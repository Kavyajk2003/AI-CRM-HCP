# 🏥 AI-First CRM for Healthcare Professionals (HCP)

[![Python](https://img.shields.io/badge/Python-3.9+-3776ab?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.2+-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Agent-526db9?logo=langchain&logoColor=white)](https://github.com/langchain-ai/langgraph)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> **An AI-powered CRM platform for Medical Representatives to log and manage Healthcare Professional interactions using natural language processing — without manual form filling.**

---

## 🎯 Overview

**AI-CRM-HCP** transforms how Medical Representatives (MRs) document and manage interactions with Healthcare Professionals (HCPs). Instead of manually filling out structured forms, users engage in natural conversation with an **AI Copilot** that intelligently extracts information, populates CRM data, and recommends next best actions.

### Key Innovation
- ✅ **Zero Manual Entry**: Forms are populated entirely through conversational AI
- ✅ **LangGraph-Powered Agent**: Sophisticated tool orchestration via LangGraph's ReAct pattern
- ✅ **Groq LLM Integration**: Fast, accurate entity extraction and reasoning
- ✅ **Split-Screen UX**: Real-time form updates alongside interactive chat
- ✅ **Production-Ready**: Built with industry best practices for healthcare data handling

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + Redux + Tailwind CSS | Responsive split-screen UI with real-time updates |
| **Backend** | FastAPI + SQLAlchemy | RESTful API with database abstraction |
| **AI/LLM** | LangGraph + Groq LLM | Agentic workflow and entity extraction |
| **Database** | PostgreSQL/MySQL | Persistent storage for HCP and interaction records |
| **Styling** | Tailwind CSS + Lucide Icons | Modern, accessible healthcare-themed design |

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React + Redux)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  LEFT PANEL                    │   RIGHT PANEL          │   │
│  │  Interaction Form              │   AI Chat Interface    │   │
│  │  (Auto-populated by AI)        │   (Natural language)   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
           ↕️ HTTP (Axios)
┌─────────────────────────────────────────────────────────────────┐
│               FastAPI Backend (Python)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  /chat endpoint → LangGraph Agent                       │   │
│  │  ├─ Tool: log_interaction                              │   │
│  │  ├─ Tool: edit_latest_interaction                       │   │
│  │  ├─ Tool: get_hcp_history                              │   │
│  │  ├─ Tool: get_next_best_action                         │   │
│  │  ├─ Tool: get_product_info                             │   │
│  │  └─ Tool: generate_follow_up_email                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Groq LLM (openai/gpt-oss-20b)                          │   │
│  │  - Entity Extraction                                    │   │
│  │  - Sentiment Analysis                                   │   │
│  │  - Meeting Summarization                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
           ↕️ SQLAlchemy ORM
┌─────────────────────────────────────────────────────────────────┐
│               Database (PostgreSQL/MySQL)                        │
│  ├─ HCP (Healthcare Professional profiles)                      │
│  └─ Interaction (CRM interaction logs)                           │
│  └─ Product (Pharmaceutical product database)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Core Features

### 1. **AI Chat Interface** (Right Panel)
Users describe their interaction naturally:
> *"Today I met Dr. Smith. We discussed Product X. The doctor was very interested. I shared brochures and samples. Follow-up next week."*

### 2. **Auto-Populated Forms** (Left Panel)
The AI automatically extracts and populates:
- **HCP Name** → Dr. Smith
- **Interaction Type** → In-Person
- **Date & Time** → Today's date + current time
- **Discussion Notes** → Product X discussion
- **Sentiment** → Positive 😊
- **Materials Shared** → Brochures
- **Samples Distributed** → Yes
- **Follow-up Actions** → Next week
- **AI-Generated Summary** → Professional meeting recap

### 3. **Six Powerful LangGraph Tools**

#### Tool 1: **Log Interaction** 📝
Creates a new interaction record from natural language.
```python
# AI extracts and saves in one conversation turn
log_interaction(
    hcp_name="Smith",
    interaction_type="In-Person",
    discussion_notes="Discussed Product X and efficacy",
    sentiment="Positive",
    materials_shared="Brochures, clinical data",
    samples_distributed="Yes",
    follow_up="Schedule follow-up next week"
)
```

#### Tool 2: **Edit Latest Interaction** ✏️
Modifies or enriches the most recent interaction without re-logging.
```python
# User: "Actually, the sentiment was negative"
edit_latest_interaction(
    hcp_name="Smith",
    sentiment="Negative"  # Updates only this field
)
```

#### Tool 3: **Get HCP History** 📊
Retrieves the last 3 interactions for an HCP.
```python
# User: "Show me Smith's previous interactions"
get_hcp_history(hcp_name="Smith", show_on_ui=True)
```

#### Tool 4: **Get Next Best Action** 🎯
AI analyzes the latest interaction and recommends 3 contextual next steps.
```python
# Outputs: "Schedule follow-up|Send clinical trial data|Provide samples"
```

#### Tool 5: **Get Product Information** 💊
Retrieves clinical details about pharmaceutical products.
```python
# User: "Tell me about Product X"
get_product_info(product_name="Product X")
# Returns: Indications, benefits, dosage, clinical evidence
```

#### Tool 6: **Generate Follow-up Email** 📧
Automatically drafts professional follow-up emails based on the interaction.
```python
# Integrates with Tool 4 for contextual suggestions
generate_follow_up_email(hcp_name="Smith")
```

---

## 📋 Data Schema

### HCP (Healthcare Professional)
```sql
CREATE TABLE hcp (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    profession VARCHAR(100),
    specialization VARCHAR(100),
    hospital VARCHAR(255)
);
```

### Interaction
```sql
CREATE TABLE interaction (
    id INTEGER PRIMARY KEY,
    hcp_id INTEGER FOREIGN KEY,
    interaction_type VARCHAR(100),
    interaction_date DATETIME,
    discussion_notes TEXT,
    materials_shared VARCHAR(500),
    samples_distributed VARCHAR(500),
    sentiment VARCHAR(50),
    outcomes TEXT,
    follow_up TEXT,
    summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Product
```sql
CREATE TABLE product (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    details TEXT,
    indications TEXT,
    benefits TEXT,
    dosage TEXT,
    clinical_evidence TEXT
);
```

---

## 🔧 Project Structure

```
AI-CRM-HCP/
│
├── 📂 backend/
│   ├── 📂 app/
│   │   ├── agents.py              # LangGraph agent configuration
│   │   ├── tools.py               # 6 tool definitions (log, edit, history, NBA, product, email)
│   │   ├── main.py                # FastAPI routes & response routing
│   │   ├── models.py              # SQLAlchemy ORM models
│   │   ├── schemas.py             # Pydantic request/response schemas
│   │   └── 📂 database/
│   │       └── connection.py       # Database connection & session management
│   │
│   ├── init_db.py                 # Database initialization & seeding script
│   └── requirements.txt            # Python dependencies
│
├── 📂 frontend/
│   ├── 📂 src/
│   │   ├── App.jsx                # Main split-screen component
│   │   ├── App.css                # Component styling
│   │   ├── main.jsx               # React entry point
│   │   ├── index.css              # Global styles
│   │   └── 📂 redux/
│   │       ├── crmSlice.js        # CRM form state management
│   │       └── chatSlice.js       # Chat messages state management
│   │
│   ├── package.json               # Node dependencies
│   ├── vite.config.js             # Vite build configuration
│   ├── tailwind.config.js         # Tailwind CSS configuration
│   └── index.html                 # HTML entry point
│
├── AI_First_CRM_HCP_Project_Specification.md  # Project requirements
└── README.md                       # This file
```

---

## ⚡ Quick Start

### Prerequisites
- **Python 3.9+** with pip
- **Node.js 16+** with npm
- **PostgreSQL** or **MySQL** (or SQLite for development)
- **Groq API Key** (free tier available)

### 1. Clone Repository
```bash
git clone https://github.com/Kavyajk2003/AI-CRM-HCP.git
cd AI-CRM-HCP
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Configure Environment Variables
Create a `.env` file in the `backend/` directory:
```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/ai_crm_hcp
# or for MySQL:
# DATABASE_URL=mysql+pymysql://user:password@localhost:3306/ai_crm_hcp

# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here
```

**Get your Groq API Key:**
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up (free tier available)
3. Generate API key from dashboard
4. Copy and paste into `.env`

#### Initialize Database
```bash
python init_db.py
```
This will:
- Create database tables
- Seed dummy HCP data (Dr. Smith, Dr. John, Dr. Emily Chen)
- Seed pharmaceutical products (Product X, Product Y, Sample C)

#### Start Backend Server
```bash
cd app
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

✅ Backend running at `http://localhost:8000`

### 3. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Configure API Endpoint
The frontend defaults to `http://localhost:8000`. Update in `src/App.jsx` if needed:
```javascript
const response = await axios.post('http://localhost:8000/chat', {...})
```

#### Start Development Server
```bash
npm run dev
```

✅ Frontend running at `http://localhost:5173`

### 4. Access Application
Open **http://localhost:5173** in your browser

---

## 💬 Usage Examples

### Example 1: Log a New Interaction
**User Input:**
> "I just met Dr. Chen at Westside Clinic. We discussed Product Y for hypercholesterolemia. She was interested in the clinical data. I shared the LUSTER trial summary and will follow up with samples next week."

**AI Action:**
- Triggers `log_interaction()`
- Extracts: HCP=Chen, Type=In-Person, Sentiment=Positive, Materials=LUSTER trial, Follow-up=Next week
- Form updates in real-time ✨

---

### Example 2: Retrieve History
**User Input:**
> "Show me all past interactions with Dr. Smith"

**AI Action:**
- Triggers `get_hcp_history(hcp_name="Smith")`
- Left panel switches to "HCP History" view
- Shows last 3 interactions with dates, sentiments, notes

---

### Example 3: Get Next Best Action
**User Input:**
> "What should I do next for Dr. John?"

**AI Action:**
- Triggers `get_next_best_action(hcp_name="John")`
- LLM analyzes latest interaction context
- Returns: "Schedule follow-up | Send clinical trial data | Provide samples"
- Form updates with "AI Suggested Follow-up" section

---

### Example 4: Product Information
**User Input:**
> "Tell me about Product X"

**AI Action:**
- Triggers `get_product_info(product_name="Product X")`
- Returns clinical details, indications, dosage, benefits
- Chat displays formatted product card

---

### Example 5: Generate Follow-up Email
**User Input:**
> "Draft a follow-up email for Dr. Smith"

**AI Action:**
- Triggers `generate_follow_up_email(hcp_name="Smith")`
- Integrates with Tool 4 for contextual suggestions
- Returns professional email draft with meeting recap

---

## 🎨 UI Highlights

### Left Panel: Interaction Form
- **Read-Only Fields**: All fields updated by AI, preventing manual mistakes
- **Emoji Indicators**: Visual sentiment cues (😊 Positive, 😞 Negative, 😐 Neutral)
- **Dynamic Card Layout**: Adapts to available data
- **AI Suggested Follow-up Section**: Shows 3 recommended next actions in a highlighted card

### Right Panel: Chat Interface
- **Markdown Support**: Rich text formatting for product info, emails
- **Voice Input**: Speech-to-text for hands-free logging
- **Dark Mode**: Toggle for comfortable use in clinical settings
- **Loading States**: Animated feedback during AI processing
- **Error Handling**: Clear messages for timeouts and API failures

### Dark Mode Theme
- Healthcare-friendly color palette
- Accessibility compliant (WCAG AA)
- Reduces eye strain in clinical environments

---

## 🔐 Security & Best Practices

### Data Protection
- ✅ **SQL Injection Prevention**: SQLAlchemy ORM prevents SQL injection
- ✅ **CORS Configured**: Restricted origins in production
- ✅ **Environment Variables**: Sensitive keys never in code
- ✅ **Input Validation**: Pydantic schemas validate all requests

### LangGraph Agent Safety
- ✅ **Recursion Limit**: Max 10 iterations to prevent infinite loops
- ✅ **Tool Validation**: Explicit tool schema definitions
- ✅ **Error Handling**: Graceful fallbacks for API failures
- ✅ **Response Routing**: Smart logic to prevent duplicate tool calls

### Healthcare Compliance
- ✅ **Data Isolation**: Per-session thread IDs for conversation separation
- ✅ **Audit Trail**: All interactions timestamped and persisted
- ✅ **No Manual Editing**: Prevents accidental data corruption
- ✅ **Professional Tone**: AI responses follow medical communication guidelines

---

## 📊 Database Seeding

### Pre-seeded Data

**HCPs:**
| Name | Profession | Specialization | Hospital |
|------|-----------|-----------------|----------|
| Smith | Doctor | Cardiology | City General |
| John | Doctor | Neurology | Metro Health |
| Emily Chen | Doctor | Endocrinology | Westside Clinic |

**Products:**
| Name | Indication | Key Benefit | Dosage |
|------|-----------|------------|--------|
| Product X | Hypertension, Angina | 24-hour BP control | 50mg daily |
| Product Y | Hypercholesterolemia | 55% LDL-C reduction | 20mg daily |
| Sample C | Mild osteoarthritis | Fast localized relief | Apply 3-4x daily |

---

## 🚨 Common Edge Cases & Solutions

### Edge Case 1: Doctor Not Found
**Problem**: User mentions an unknown doctor
**Solution**: AI auto-creates new HCP profile with provided name and defaults

### Edge Case 2: Multiple Interactions in One Session
**Problem**: User logs multiple doctors without explicitly switching
**Solution**: Tool checks conversation context and uses correct doctor name via `edit_latest_interaction` vs `log_interaction`

### Edge Case 3: Vague User Input
**Problem**: User enters "Tell me about Bob"
**Solution**: Agent recognizes vague intent and asks clarifying questions instead of executing tools

### Edge Case 4: API Rate Limiting
**Problem**: Groq API hits rate limit (429 error)
**Solution**: Frontend catches error and displays "AI is at capacity" message with retry guidance

### Edge Case 5: Sentiment Hallucination
**Problem**: LLM generates non-standard sentiment value
**Solution**: Python safety net in `get_next_best_action` supplements missing actions with defaults

---

## 🧪 Testing & Validation

### Manual Testing Checklist
- [ ] **Log Interaction**: User inputs natural language → form populates automatically
- [ ] **Edit Interaction**: User corrects a field → only that field updates
- [ ] **History Retrieval**: User asks for history → switches to history view
- [ ] **NBA Generation**: Next best actions display in form as a highlighted section
- [ ] **Product Info**: Product data displays in chat with markdown formatting
- [ ] **Email Generation**: Follow-up email preview appears in chat
- [ ] **Voice Input**: Microphone captures and transcribes audio (browser dependent)
- [ ] **Dark Mode**: All UI elements readable in dark mode
- [ ] **Mobile Responsiveness**: Split-screen adapts to tablet size
- [ ] **Error Handling**: Network failures display appropriate messages

### Load Testing (Future)
- Test concurrent users with session isolation
- Monitor LangGraph agent performance under load
- Validate database connection pooling

---

## 🐛 Known Limitations

1. **Browser Compatibility**: Voice input requires Chrome, Edge, or Safari
2. **Session Management**: Currently uses single `default_thread_id` (can be enhanced for multi-user)
3. **Database**: SQLite support for development only (use PostgreSQL for production)
4. **LLM Model**: Tied to Groq API (can be swapped via environment variable)
5. **Email Generation**: Requires manual review before sending (no SMTP integration yet)

---

## 🛣️ Roadmap

### Phase 1 (Current) ✅
- [x] Core 6-tool LangGraph agent
- [x] Split-screen React UI
- [x] FastAPI backend
- [x] Database seeding
- [x] Dark mode support

### Phase 2 (Next)
- [ ] Multi-user session management
- [ ] SMTP integration for direct email sending
- [ ] Voice note transcription with Whisper API
- [ ] Advanced sentiment analysis with domain adaptation
- [ ] HCP profile enrichment (specialty, location, patient demographics)

### Phase 3 (Future)
- [ ] Mobile app (React Native)
- [ ] Offline-first capability
- [ ] Analytics dashboard for MR performance
- [ ] Integration with CRM systems (Salesforce, Pipedrive)
- [ ] Multi-language support

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes with clear messages
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## 📝 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) file for details.

---

## 💡 FAQ

**Q: Can I use this without Groq API?**
A: Yes! Modify `agents.py` to use OpenAI or Anthropic APIs. The LangGraph structure remains the same.

**Q: Is this HIPAA compliant?**
A: Current version handles PII (doctor names, hospital info). For HIPAA compliance, add encryption, audit logging, and access controls.

**Q: How do I handle multiple medical representatives?**
A: Implement user authentication and modify `thread_id` generation to include `user_id` for session isolation.

**Q: Can I export interaction data?**
A: Yes! Add an endpoint like `GET /interactions/export?format=csv` to export data from the database.

**Q: What if the AI makes a mistake?**
A: Use the `edit_latest_interaction` tool to correct specific fields, or use voice input to rephrase naturally.

---

## 📧 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/Kavyajk2003/AI-CRM-HCP/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Kavyajk2003/AI-CRM-HCP/discussions)
- **Author**: [@Kavyajk2003](https://github.com/Kavyajk2003)

---

## 🙏 Acknowledgments

- **LangGraph**: For elegant agent orchestration
- **Groq API**: For fast, accessible LLM inference
- **FastAPI**: For modern Python API development
- **React + Vite**: For blazingly fast frontend development
- **Tailwind CSS**: For beautiful, responsive styling

---

<div align="center">

**Built with ❤️ for healthcare professionals**

[⭐ Star this repo](#) if you find it useful!

</div>