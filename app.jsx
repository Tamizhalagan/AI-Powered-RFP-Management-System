import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, addDoc } from 'firebase/firestore';
import { marked } from 'marked';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3, 
  Send, 
  Bot, 
  CheckCircle2, 
  Loader2,
  Database,
  Mail
} from 'lucide-react';

// --- FIREBASE INIT ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-rfp-app';

// --- COMPONENTS ---

// 1. Sidebar Component
const Sidebar = ({ activeTab, setActiveTab, dbStatus }) => {
  const navItems = [
    { id: 'create', label: 'Create RFP', icon: FileText },
    { id: 'vendors', label: 'Select Vendors', icon: Users },
    { id: 'responses', label: 'Parse Responses', icon: Mail },
    { id: 'compare', label: 'Analysis & Award', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-white shadow-lg flex-shrink-0 flex flex-col z-20 h-full">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Bot className="h-8 w-8 text-blue-600 mr-2" />
        <span className="font-bold text-gray-800 text-lg">Procure<span className="text-blue-600">AI</span></span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Workflow</div>
        {navItems.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center px-6 py-3 transition-colors ${
              activeTab === item.id 
                ? 'border-l-4 border-blue-600 bg-blue-50 text-blue-700' 
                : 'border-l-4 border-transparent text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className={`w-6 text-center font-bold mr-2 ${activeTab === item.id ? 'text-blue-600' : 'text-gray-400'}`}>
              {index + 1}
            </span>
            <item.icon className="w-4 h-4 mr-3" />
            {item.label}
          </button>
        ))}

        <div className="mt-8 px-6">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <h4 className="text-sm font-bold text-blue-900 mb-1">System Status</h4>
            <div className="flex items-center mt-2">
              <div className={`h-2 w-2 rounded-full mr-2 ${dbStatus === 'Connected' ? 'bg-green-500' : 'bg-yellow-400'}`}></div>
              <span className="text-xs text-gray-500">{dbStatus}</span>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
};

// 2. View: Create RFP
const CreateRFP = ({ currentRFP, setCurrentRFP }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExample = () => {
    setInput("I need to procure laptops and monitors for our new office. Budget is $50,000 total. Need delivery within 30 days. We need 20 laptops with 16GB RAM and 15 monitors 27-inch. Payment terms should be net 30, and we need at least 1 year warranty.");
  };

  const generateStructure = async () => {
    if (!input) return;
    setLoading(true);
    
    // In a real Node architecture, this would verify the token and call /api/rfp
    // Here we call Gemini directly for the demo
    const prompt = `Extract procurement requirements into JSON. Keys: "items" (array), "budget", "deadline", "payment_terms", "warranty_requirement". Text: "${input}"`;
    
    try {
      // Simulate API latency if we were hitting Node backend
      const response = await callGemini(prompt, true);
      setCurrentRFP(response);
      
      // Save to Firestore
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'rfps'), response);
    } catch (err) {
      console.error(err);
      alert('Error generating RFP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New RFP</h1>
        <p className="text-gray-500 mt-2">Describe what you need in plain English. The AI will structure it.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Requirement Description</label>
        <textarea 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows="5" 
          className="w-full p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 resize-none" 
          placeholder="e.g. I need to procure laptops..."
        />
        
        <div className="mt-4 flex justify-between items-center">
          <button onClick={handleExample} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Try Example Prompt
          </button>
          <button 
            onClick={generateStructure} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow flex items-center disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Bot className="w-4 h-4 mr-2" />}
            Generate Structured RFP
          </button>
        </div>
      </div>

      {currentRFP && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
           <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <span className="font-mono text-xs text-gray-500">JSON Preview</span>
              <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">Persisted to DB</span>
           </div>
           <pre className="p-6 overflow-x-auto text-sm text-gray-800 font-mono bg-white">
             {JSON.stringify(currentRFP, null, 2)}
           </pre>
        </div>
      )}
    </div>
  );
};

// 3. View: Vendors
const VendorSelect = ({ vendors, selectedVendors, toggleVendor, onSend }) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      onSend();
      setTimeout(() => setSent(false), 3000);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Select Vendors</h1>
        <p className="text-gray-500 mt-2">Load master data from database and select recipients.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vendors.length === 0 ? (
               <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-400">Loading vendors...</td></tr>
            ) : (
              vendors.map((v) => (
                <tr key={v.id}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      checked={selectedVendors.includes(v.id)}
                      onChange={() => toggleVendor(v.id)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{v.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{v.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-400 font-mono">{v.email}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <span className="text-sm text-gray-600">{selectedVendors.length} vendors selected</span>
          <button 
            onClick={handleSend}
            disabled={selectedVendors.length === 0 || sending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send RFP Emails'}
          </button>
        </div>
      </div>

      {sent && (
        <div className="fixed bottom-10 right-10 bg-gray-900 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center animate-bounce">
          <CheckCircle2 className="w-6 h-6 text-green-400 mr-3" />
          <div>
            <h4 className="font-bold">Emails Sent!</h4>
            <p className="text-sm text-gray-300">RFP distributed via Mock SMTP.</p>
          </div>
        </div>
      )}
    </div>
  );
};

// 4. View: Responses
const ParseResponses = ({ vendors, parsedResponses, setParsedResponses }) => {
  const [selectedVendor, setSelectedVendor] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState(null);

  const loadMock = (type) => {
    const mocks = {
      'TechFlow': "Hi Team,\n\nHere is our quote. 20 High-Perf Laptops at $1,200 each. 15 Monitors at $250 each. \nTotal: $27,750.\nDelivery in 14 days. Warranty 2 years. Net 45.\n\nThanks, TechFlow",
      'OfficeDepot': "RE: RFP\n\nOffer:\n- 20x Laptops @ $1,100 ($22,000)\n- 15x Monitors @ $300 ($4,500)\nGrand Total: $26,500.\n45 days lead time. 1 Year warranty. Net 30."
    };
    setEmailContent(mocks[type]);
    // Auto select vendor for ease
    const v = vendors.find(v => v.name.includes(type));
    if(v) setSelectedVendor(v.id);
  };

  const handleParse = async () => {
    if (!selectedVendor || !emailContent) return;
    setProcessing(true);
    const prompt = `Analyze vendor email. Extract JSON with keys: "total_cost" (number), "delivery_time", "warranty", "payment_terms". Email: "${emailContent}"`;
    try {
      const result = await callGemini(prompt, true);
      setPreview(result);
    } catch(e) {
      alert("Parsing failed");
    } finally {
      setProcessing(false);
    }
  };

  const saveToDB = async () => {
     if(!preview) return;
     // In node architecture: POST /api/response
     await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'responses', selectedVendor), {
        data: preview,
        vendorId: selectedVendor,
        timestamp: new Date().toISOString()
     });
     setParsedResponses(prev => ({...prev, [selectedVendor]: preview}));
     setPreview(null);
     setEmailContent('');
     setSelectedVendor('');
  };

  return (
    <div className="max-w-4xl mx-auto fade-in">
       <div className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Parse Responses</h1>
            <p className="text-gray-500 mt-2">Paste messy email content. AI will extract data.</p>
          </div>
          <div className="space-x-2">
            <button onClick={() => loadMock('TechFlow')} className="text-xs bg-white border px-3 py-1 rounded hover:bg-gray-50">Mock 1</button>
            <button onClick={() => loadMock('OfficeDepot')} className="text-xs bg-white border px-3 py-1 rounded hover:bg-gray-50">Mock 2</button>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
              <select 
                value={selectedVendor} 
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Vendor...</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} {parsedResponses[v.id] ? '(Analyzed)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <textarea 
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              className="w-full p-4 h-64 rounded-xl border border-gray-300 resize-none font-mono text-sm"
              placeholder="Paste email content..."
            />
            <button 
              onClick={handleParse} 
              disabled={processing}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-semibold flex justify-center items-center"
            >
              {processing ? 'Processing...' : 'Extract Data with AI'}
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col">
             <h3 className="font-bold text-gray-900 mb-2">Extraction Preview</h3>
             <div className="flex-1 bg-gray-50 rounded-lg p-4 font-mono text-sm overflow-auto">
                {preview ? JSON.stringify(preview, null, 2) : <span className="text-gray-400 italic">Waiting for input...</span>}
             </div>
             {preview && (
               <button onClick={saveToDB} className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-semibold">
                 Save to Database
               </button>
             )}
          </div>
       </div>
    </div>
  );
};

// 5. View: Comparison
const ComparisonMatrix = ({ vendors, parsedResponses, currentRFP }) => {
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(false);

  const generateRec = async () => {
    setLoading(true);
    const context = `RFP: ${JSON.stringify(currentRFP)}\nResponses: ${JSON.stringify(parsedResponses)}`;
    const prompt = `Act as a procurement expert. Compare these vendors. 1. Score them (0-100). 2. Recommend one. 3. List risks. Data: ${context}`;
    
    try {
      const text = await callGemini(prompt, false);
      setRecommendation(text);
    } catch(e) {
      alert("Failed");
    } finally {
      setLoading(false);
    }
  };

  const ids = Object.keys(parsedResponses);
  if(ids.length === 0) return <div className="text-center text-gray-500 mt-20">No data. Parse responses first.</div>;

  return (
    <div className="max-w-6xl mx-auto fade-in">
       <div className="mb-6 flex justify-between items-center">
         <h1 className="text-3xl font-bold text-gray-900">Vendor Comparison</h1>
         <button onClick={generateRec} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow">
           {loading ? 'Analyzing...' : 'Generate AI Recommendation'}
         </button>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto mb-8">
         <table className="min-w-full divide-y divide-gray-200">
           <thead className="bg-gray-50">
             <tr>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feature</th>
               {ids.map(id => {
                 const v = vendors.find(ven => ven.id === id);
                 return <th key={id} className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">{v?.name || id}</th>
               })}
             </tr>
           </thead>
           <tbody className="bg-white divide-y divide-gray-200">
             {['total_cost', 'delivery_time', 'warranty', 'payment_terms'].map(field => (
               <tr key={field}>
                 <td className="px-6 py-4 font-medium text-gray-900 capitalize">{field.replace('_', ' ')}</td>
                 {ids.map(id => (
                   <td key={id} className="px-6 py-4 text-gray-500">{parsedResponses[id][field]}</td>
                 ))}
               </tr>
             ))}
           </tbody>
         </table>
       </div>

       {recommendation && (
         <div className="bg-white rounded-xl shadow-lg border-l-4 border-purple-500 p-6 prose max-w-none">
           <div dangerouslySetInnerHTML={{ __html: marked.parse(recommendation) }} />
         </div>
       )}
    </div>
  );
};

// --- MAIN APP ---
const App = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [dbStatus, setDbStatus] = useState('Connecting...');
  const [user, setUser] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [parsedResponses, setParsedResponses] = useState({});
  const [currentRFP, setCurrentRFP] = useState(null);
  const [selectedVendors, setSelectedVendors] = useState([]);

  useEffect(() => {
    // Auth
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
         await signInWithCustomToken(auth, __initial_auth_token);
      } else {
         await signInAnonymously(auth);
      }
    };
    initAuth();
    onAuthStateChanged(auth, u => {
      if(u) {
        setUser(u);
        setDbStatus('Connected');
      }
    });
  }, []);

  useEffect(() => {
    if(!user) return;
    // Data Listeners
    const unsubV = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'vendors'), (snap) => {
      const vList = [];
      snap.forEach(d => vList.push({id: d.id, ...d.data()}));
      if(vList.length === 0) seedVendors();
      else setVendors(vList);
    });

    const unsubR = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'responses'), (snap) => {
      const rMap = {};
      snap.forEach(d => rMap[d.id] = d.data().data);
      setParsedResponses(rMap);
    });

    return () => { unsubV(); unsubR(); };
  }, [user]);

  const seedVendors = async () => {
     const seeds = [
        { id: 'v1', name: 'TechFlow Solutions', category: 'Hardware', email: 'sales@techflow.mock' },
        { id: 'v2', name: 'Office Depot Pro', category: 'General', email: 'bids@officedepot.mock' }
     ];
     for(const s of seeds) {
       await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'vendors', s.id), s);
     }
  };

  const toggleVendor = (id) => {
    setSelectedVendors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} dbStatus={dbStatus} />
      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === 'create' && <CreateRFP currentRFP={currentRFP} setCurrentRFP={setCurrentRFP} />}
        {activeTab === 'vendors' && <VendorSelect vendors={vendors} selectedVendors={selectedVendors} toggleVendor={toggleVendor} onSend={() => setActiveTab('responses')} />}
        {activeTab === 'responses' && <ParseResponses vendors={vendors} parsedResponses={parsedResponses} setParsedResponses={setParsedResponses} />}
        {activeTab === 'compare' && <ComparisonMatrix vendors={vendors} parsedResponses={parsedResponses} currentRFP={currentRFP} />}
      </main>
    </div>
  );
};

// Helper: Call Gemini
async function callGemini(prompt, jsonMode) {
    const apiKey = ""; // Injected
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: jsonMode ? { responseMimeType: "application/json" } : {}
    };
    
    // Simple retry logic
    for(let i=0; i<3; i++) {
       try {
         const res = await fetch(url, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)});
         if(!res.ok) throw new Error("API Error");
         const data = await res.json();
         const text = data.candidates[0].content.parts[0].text;
         return jsonMode ? JSON.parse(text) : text;
       } catch(e) {
         await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
       }
    }
    throw new Error("Failed after retries");
}

export default App;