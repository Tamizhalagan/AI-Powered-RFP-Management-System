# AI-Powered-RFP-Management-System
🚀 AI-Powered RFP Management System

Streamlining Procurement with Generative Intelligence.

A robust, full-stack web application designed to revolutionize the procurement process. This system leverages Google Gemini 2.5 Flash to transform natural language requirements into structured Requests for Proposals (RFPs), parse unstructured vendor email responses, and generate intelligent, side-by-side comparison matrices.

1. Project Setup

a. Prerequisites

Before starting, ensure you have the following:

Node.js: Version v18.0.0 or higher.

Database: A Google Firebase project with Firestore Database and Authentication (Anonymous) enabled.

API Keys: A valid API Key for Google Gemini (available from Google AI Studio).

b. Install Steps

The project is a monorepo containing both client and server.

Clone the Repository

git clone [https://github.com/your-org/rfp-manager.git](https://github.com/your-org/rfp-manager.git)
cd rfp-manager


Install Backend Dependencies

cd server
npm install


Install Frontend Dependencies

cd ../client
npm install


c. Configure Email Sending/Receiving

Current Configuration (Simulated):
For this single-user demonstration, the application uses a Mock SMTP Service. No actual email credentials are required. The frontend simulates network latency (1.5s) and triggers a visual "Toast Notification" to confirm the action.

Production Configuration:
To enable real emailing, update the backend environment variables with SMTP details (Host, Port, User, Password) and uncomment the nodemailer transport logic in server/controllers/emailController.js.

d. How to Run Locally

You can run the full stack concurrently from the root directory (if configured) or in separate terminals.

Option 1: Concurrent (Root)

npm run dev


Option 2: Separate Terminals

# Terminal 1: Backend (Runs on port 5000)
cd server && npm start

# Terminal 2: Frontend (Runs on port 3000)
cd client && npm start


e. Seed Data / Initial Scripts

Auto-Seeding: The application contains a client-side check on load. If the vendors collection in Firestore is empty, it automatically triggers a seeding function to populate the database with 4 mock vendors (e.g., "TechFlow Solutions", "Office Depot Pro").

No Manual Script Needed: Just run the app and log in; the data will appear automatically.

2. Tech Stack

Component

Technology

Description

Frontend 

React.js (v18)

Component-based UI with Hooks for state management.

Styling

Tailwind CSS

Utility-first CSS framework for responsive design.

Backend

Node.js + Express

RESTful API handling business logic and AI orchestration.

Database

Firebase Firestore

NoSQL document store for flexible schema (RFPs/Responses).

AI Provider

Google Gemini 2.5

LLM used for extraction, summarization, and reasoning.

Email Solution

Mock/Simulated

Client-side simulation of SMTP latency and success states.

Key Libraries

firebase-admin: Server-side privileged database access.

lucide-react: Iconography.

marked: Markdown rendering for AI analysis output.

3. API Documentation

POST /api/rfp/generate

Description: Converts natural language into structured JSON.

Request Body:

{
  "description": "I need 20 laptops with 16GB RAM and a budget of $30k."
}


Success Response (200 OK):

{
  "id": "doc_abc123",
  "items": [{ "name": "Laptops", "quantity": 20, "specs": "16GB RAM" }],
  "budget": 30000,
  "deadline": "N/A"
}


Error Response (400 Bad Request):

{ "error": "Description is required." }


POST /api/response/parse

Description: Extracts structured fields from unstructured vendor emails.

Request Body:

{
  "vendorId": "v1",
  "emailContent": "Hi, our quote is $28,000 total with 2 weeks delivery."
}


Success Response (200 OK):

{
  "total_cost": 28000,
  "delivery_time": "14 days",
  "warranty": "Standard 1 year",
  "payment_terms": "Unknown"
}


Error Response (500 Internal Server Error):

{ "error": "AI processing failed." }


POST /api/analysis/recommend

Description: Generates a qualitative recommendation based on quantitative data.

Request Body:

{ "rfpId": "doc_abc123" }


Success Response (200 OK):

{
  "recommendation": "Vendor B is the best choice due to lower cost and faster delivery.",
  "justification": "Although Vendor A has better warranty, Vendor B is 15% cheaper.",
  "score": 92
}
{
  "recommendation": "## Executive Summary\n\nI recommend Vendor A due to..."
}


4. Decisions & Assumptions

a. Key Design Decisions

Architecture: We chose a Decoupled Architecture (React Front / Node Back) rather than a serverless-only approach to ensure API keys are kept secure server-side and to allow for more complex validation logic in the future.

Data Modeling: We utilized a NoSQL Schema (Firestore) because procurement requirements vary wildly. Hard-coding a SQL schema for "Specs" would have been too rigid for natural language inputs.

Flow: The workflow is linear (Create -> Select -> Parse -> Compare) to reduce user cognitive load, implemented via a step-based sidebar.

b. Assumptions

Single User: The current authentication implementation handles data globally for the project ID. It assumes a single procurement manager view without row-level security per user.

Currency: The AI is instructed to normalize all financial figures to USD for comparison purposes.

Email Format: We assume vendor responses are text-based. PDF/Attachment parsing is out of scope for this version.

Language: The system is optimized for English language inputs.

5. AI Tools Usage

a. Tools Used

Google Gemini 2.5 Flash: The core intelligence engine.

Google AI Studio: Used for testing prompts before implementation.

b. What They Helped With

Boilerplate Code: Generating the initial Express server setup and React component hierarchy.

Data Extraction: Replacing complex Regular Expressions (Regex) with robust AI prompts for parsing email bodies. Regex failed on edge cases (e.g., "$1k" vs "$1,000"); the AI handled both effortlessly.

Design: Generating the color palette and Tailwind utility classes for a clean, professional UI.

c. Notable Prompts/Approaches

Prompting for JSON: We used the responseMimeType: "application/json" configuration feature of Gemini. This was critical. Early attempts using just text prompts resulted in markdown code blocks (json ... ) which broke the JSON parser.

Role-Playing: For the recommendation engine, we used the system instruction: "Act as a senior procurement officer. Be critical of risks." This resulted in output that flagged issues like "Net 15 payment terms" as a negative cash-flow risk.

d. What i was Learned

Latency vs. Accuracy: Gemini 2.5 Flash is significantly faster than Pro versions, which is essential for UI responsiveness. The slight trade-off in reasoning depth was worth the sub-second response time for the UI.

Context Window: Passing the entire RFP context along with the vendor response was necessary for the AI to judge "value." Without the RFP context, the AI couldn't know if a $50k quote was good or bad.
