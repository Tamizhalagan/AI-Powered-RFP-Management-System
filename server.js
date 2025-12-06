require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');

// 1. Setup Express
const app = express();
app.use(cors()); // Allow frontend requests
app.use(express.json());

// 2. Setup Firebase Admin (Database)
// In production, pass the service account JSON string via environment variable
// locally, you might require('./serviceAccountKey.json')
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require('./firebase-service-account.json'); // Fallback for local dev

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// 3. Setup Gemini (AI)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Using the preview model as requested
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });

// --- ROUTES ---

// Endpoint 1: Generate RFP Structure from Text
// POST /api/rfp/generate
app.post('/api/rfp/generate', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: 'Description required' });

    console.log('Generating RFP structure...');
    const prompt = `Extract procurement requirements into JSON. Keys: "items" (array), "budget", "deadline", "payment_terms", "warranty_requirement". Text: "${description}"`;
    
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
    });
    
    const structuredData = JSON.parse(result.response.text());
    
    // Save to Firestore (Server-side write)
    const docRef = await db.collection('rfps').add({
        ...structuredData,
        originalText: description,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ id: docRef.id, ...structuredData });
  } catch (error) {
    console.error('Error in /api/rfp/generate:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 2: Parse Vendor Email Response
// POST /api/response/parse
app.post('/api/response/parse', async (req, res) => {
  try {
    const { emailContent, vendorId } = req.body;
    if (!emailContent || !vendorId) return res.status(400).json({ error: 'Email content and Vendor ID required' });

    console.log(`Parsing response for vendor ${vendorId}...`);
    const prompt = `Analyze vendor email. Extract JSON with keys: "total_cost" (number), "delivery_time", "warranty", "payment_terms". Email: "${emailContent}"`;
    
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
    });
    
    const parsedData = JSON.parse(result.response.text());

    // Save to Firestore (Server-side write)
    await db.collection('responses').doc(vendorId).set({
        data: parsedData,
        vendorId,
        parsedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json(parsedData);
  } catch (error) {
    console.error('Error in /api/response/parse:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 3: Generate Recommendation
// POST /api/analysis/recommend
app.post('/api/analysis/recommend', async (req, res) => {
  try {
    const { rfpId } = req.body;
    if (!rfpId) return res.status(400).json({ error: 'RFP ID required' });
    
    console.log(`Generating recommendation for RFP ${rfpId}...`);

    // Fetch Data from DB
    const rfpDoc = await db.collection('rfps').doc(rfpId).get();
    if (!rfpDoc.exists) return res.status(404).json({ error: 'RFP not found' });

    const responsesSnap = await db.collection('responses').get();
    
    const rfp = rfpDoc.data();
    const responses = responsesSnap.docs.map(d => d.data());

    // Build Context for AI
    const context = `RFP Requirements: ${JSON.stringify(rfp)}\nVendor Responses: ${JSON.stringify(responses)}`;
    const prompt = `Act as a procurement expert. Compare these vendors against the requirements. 
    1. Score them (0-100). 
    2. Write a brief recommendation on who to choose and why. 
    3. List risks. 
    Data: ${context}`;

    const result = await model.generateContent(prompt);
    res.json({ recommendation: result.response.text() });

  } catch (error) {
    console.error('Error in /api/analysis/recommend:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));