# AI Legal Workflow — FastAPI Backend

Complete backend for the AI Legal Workflow platform.  
**Stack:** FastAPI · SQLAlchemy · PostgreSQL · Groq LLM · JWT Auth

---

## Project Structure

```
legal-backend/
├── app/
│   ├── main.py               # FastAPI app entry point
│   ├── database.py           # SQLAlchemy engine + session
│   ├── models.py             # ORM models (User, Case, Document, etc.)
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── routers/
│   │   ├── auth.py           # POST /api/auth/signup  POST /api/auth/signin
│   │   ├── dashboard.py      # GET  /api/dashboard
│   │   ├── cases.py          # CRUD /api/cases
│   │   ├── documents.py      # Upload/manage /api/documents
│   │   ├── copilot.py        # AI chat + quick actions /api/copilot
│   │   └── settings.py       # Profile, password, notifications /api/settings
│   ├── services/
│   │   └── ai_service.py     # Groq LLM integration
│   └── utils/
│       └── auth.py           # JWT + bcrypt helpers
├── tests/
│   └── test_api.py           # 60+ tests (no Groq key needed)
├── requirements.txt
├── .env.example
├── alembic.ini
└── README.md
```

---

## Quick Start

### 1. Prerequisites
- Python 3.11+
- PostgreSQL running locally
- (Optional) Groq API key from https://console.groq.com

### 2. Install
```bash
cd legal-backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env:
```
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/legal_workflow
SECRET_KEY=your-super-secret-key-min-32-chars-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx   # Optional — falls back to mock responses
```

### 4. Create database
```bash
psql -U postgres -c "CREATE DATABASE legal_workflow;"
```

### 5. Run the server
```bash
uvicorn app.main:app --reload --port 8000
```

Server is live at: http://localhost:8000  
Interactive docs: http://localhost:8000/docs  
ReDoc: http://localhost:8000/redoc

---

## Running Tests

Tests use **SQLite in-memory** — no PostgreSQL or Groq key needed.

```bash
# Run all tests
pytest tests/test_api.py -v

# Run a specific test class
pytest tests/test_api.py::TestAuth -v
pytest tests/test_api.py::TestCases -v
pytest tests/test_api.py::TestCopilot -v
pytest tests/test_api.py::TestSettings -v
pytest tests/test_api.py::TestIntegration -v

# Run with coverage
pytest tests/test_api.py -v --tb=short
```

Expected output: **60+ tests passing**

---

## API Reference

### Authentication

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | `{full_name, email, password}` | Register new user |
| POST | `/api/auth/signin` | `{email, password}` | Login, get JWT token |
| GET | `/api/auth/me` | — | Get current user info |

**Signup Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "full_name": "Himanshi Shah",
    "email": "himanshi@example.com",
    "created_at": "2024-03-15T10:30:00Z"
  }
}
```

---

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | KPI cards + AI insights + recent activity |

**Response:**
```json
{
  "kpi": {
    "active_cases": 32,
    "pending_tasks": 12,
    "documents_processed_this_month": 145,
    "ai_insights_generated": 58,
    "active_cases_trend": "+5 total active",
    "pending_tasks_trend": "12 need attention",
    "documents_trend": "145 this month",
    "ai_insights_trend": "58 total generated"
  },
  "recent_activities": [...],
  "ai_insights": [...]
}
```

---

### Case Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cases` | Create a new case |
| GET | `/api/cases` | List all cases (filter: `?status=active&priority=high&search=text`) |
| GET | `/api/cases/{id}` | Get single case |
| PUT | `/api/cases/{id}` | Update case |
| DELETE | `/api/cases/{id}` | Delete case |

**Create Case Body:**
```json
{
  "title": "Employment Contract Dispute",
  "client": "John Smith",
  "status": "active",
  "priority": "high",
  "deadline": "2024-03-15T00:00:00Z",
  "description": "Optional description"
}
```

**Case Response includes:**
- `case_number` — auto-generated (e.g. "248")
- `document_count` — number of attached documents
- `pending_task_count` — pending tasks count

---

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents` | Upload document (multipart/form-data) |
| GET | `/api/documents` | List documents (`?case_id=1` to filter) |
| GET | `/api/documents/{id}` | Get document |
| DELETE | `/api/documents/{id}` | Delete document |

**Upload (multipart/form-data):**
```
file       = <File>           # PDF, DOC, DOCX, TXT
case_id    = 1                # Optional
doc_type   = "Contract"       # Optional
category   = "Legal"          # Optional
```

---

### AI Copilot

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/copilot/chat` | Chat with AI (text only or text + docs) |
| POST | `/api/copilot/review-document/{id}` | Quick action: Review document |
| POST | `/api/copilot/research-case-law` | Quick action: Research case law |
| POST | `/api/copilot/check-deadlines` | Quick action: Check all deadlines |
| GET | `/api/copilot/conversations` | List conversations |
| GET | `/api/copilot/conversations/{id}` | Get conversation with messages |
| DELETE | `/api/copilot/conversations/{id}` | Delete conversation |

**Chat Request:**
```json
{
  "message": "Analyze this contract for risks",
  "document_ids": ["1", "2"],    // Optional
  "conversation_id": 5           // Optional — continue existing conversation
}
```

**Chat Response (always structured):**
```json
{
  "message_id": 42,
  "conversation_id": 5,
  "response": "Full legal analysis...",
  "analysis": {
    "intention": "Identify contract risks",
    "purpose": "Legal risk assessment",
    "recommended_actions": "1. Review indemnity clause...",
    "deadline": "Contract expires 2024-12-31",
    "threats": "Broad liability clause on page 3",
    "simple_language": "This contract puts most risk on you...",
    "full_analysis": "Comprehensive legal analysis..."
  }
}
```

**Research Case Law:**
```json
{ "query": "employment discrimination precedents" }
```

---

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings/profile` | Get profile + notification prefs |
| PUT | `/api/settings/profile` | Update name, email, phone |
| PUT | `/api/settings/password` | Change password |
| PUT | `/api/settings/notifications` | Toggle notification preferences |
| DELETE | `/api/settings/account` | Delete account and all data |

**Profile Update:**
```json
{
  "full_name": "Himanshi Shah",
  "email": "himanshi@example.com",
  "phone": "+91 98765 43210"
}
```

**Notification Settings:**
```json
{
  "email_notifications": true,
  "task_reminders": true,
  "case_updates": true,
  "document_alerts": false
}
```

---

## Frontend Integration

All authenticated routes require the JWT token in the `Authorization` header:

```javascript
// After signin, store the token:
const { access_token, user } = await response.json();
localStorage.setItem('token', access_token);
localStorage.setItem('user', JSON.stringify(user));

// Include in every request:
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
};

// Dashboard Header — show user's name:
const user = JSON.parse(localStorage.getItem('user'));
// "Good morning, Himanshi 👋"

// Example: fetch dashboard
const res = await fetch('http://localhost:8000/api/dashboard', { headers });
const data = await res.json();
// data.kpi.active_cases → 32
// data.kpi.pending_tasks → 12
// data.kpi.documents_processed_this_month → 145
// data.kpi.ai_insights_generated → 58
```

---

## Database Models

```
users           → cases (one-to-many)
users           → documents (one-to-many)
users           → conversations (one-to-many)
users           → activities (one-to-many)
users           → ai_insights (one-to-many)
cases           → documents (one-to-many)
cases           → tasks (one-to-many)
conversations   → messages (one-to-many, cascade delete)
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `SECRET_KEY` | — | JWT signing secret (min 32 chars) |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Token TTL (24 hours) |
| `GROQ_API_KEY` | — | Groq LLM API key (optional) |

> **Without `GROQ_API_KEY`:** All AI endpoints return structured mock responses, so the app is fully functional for development/testing.

---

## Groq Model Used

`llama3-70b-8192` — 70B parameter LLaMA 3 model via Groq's ultra-fast inference API.

All AI prompts are structured to return **JSON** with these fields:
- `intention` — Legal intent
- `purpose` — Document/query purpose  
- `recommended_actions` — What to do next
- `deadline` — Time-sensitive elements
- `threats` — Risks and issues
- `simple_language` — Plain English summary
- `full_analysis` — Complete professional analysis
