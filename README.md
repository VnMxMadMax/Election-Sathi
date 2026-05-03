# Election Sathi 🇮🇳

**Election Sathi** is an AI-powered civic education platform designed to help Indian citizens navigate the democratic process. It provides personalized, factual information about voter registration, polling booth procedures, EVMs, and more, serving as a reliable companion for informed voting.

## 🌟 Features

- **AI Chat Assistant**: Powered by LangGraph and Gemini, offering dynamic, fact-checked, and politically neutral answers to your election-related questions.
- **Polling Booth Finder**: Dynamically generates localized, realistic polling booth options based on actual Indian Post Office data using the official PIN Code API and OpenStreetMap Nominatim.
- **Civic Quiz**: Test your knowledge of the Indian electoral system with an interactive quiz.
- **Voter ID Guide**: Step-by-step interactive timeline explaining the process of obtaining and verifying a Voter ID card.
- **Secure Authentication**: User accounts and login flows powered securely by Supabase.

## 🏗️ Architecture

The application is built on a modern decoupled architecture:

- **Frontend (`/frontend`)**: 
  - React + Vite
  - Tailwind CSS for modern, responsive glassmorphism UI
  - React Markdown for rendering AI responses cleanly
  - Leaflet / React-Leaflet for interactive map rendering
  - Supabase client for authentication

- **Backend (`/backend`)**:
  - Python + FastAPI
  - LangChain & LangGraph for Agentic workflow orchestration
  - Google Gemini 1.5 Flash (via `langchain-google-genai`)
  - Smart rate-limiting to prevent quota exhaustion
  - Stateless API design for highly scalable chat processing

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Python (v3.10+)
- Google Gemini API Key
- Supabase Project URL and Anon Key

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

Start the backend server:
```bash
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start the frontend development server:
```bash
npm run dev
```

### 3. Usage

Navigate to `http://localhost:5173` in your browser. Create an account, and explore the AI Chatbot and Polling Booth Finder!

## 🔐 Security & Limits
- **Rate Limiting**: The backend API (`/api/chat`) enforces strict rate limits (10 req/min) using `slowapi` to protect the Gemini API limits.
- **Strict Scope**: The AI is strictly instructed via system prompts to decline political opinions, candidate endorsements, or non-Indian election queries.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

## 📜 License
This project is open-source and available under the [MIT License](LICENSE).
