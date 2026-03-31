# AI Legal Workflow — Full Stack Project

## Project Structure
```
legal-project/
├── legal-backend/    FastAPI + SQLAlchemy + PostgreSQL + Groq
└── legal-frontend/   Next.js 14 + TypeScript + Tailwind CSS
```

---

## 1. Backend Setup

```bash
cd legal-backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

pip install fastapi==0.111.0 "uvicorn[standard]==0.29.0" sqlalchemy==2.0.30 \
  alembic==1.13.1 psycopg2-binary==2.9.9 "python-jose[cryptography]==3.3.0" \
  "passlib[bcrypt]==1.7.4" python-multipart==0.0.9 groq==0.9.0 \
  python-dotenv==1.0.1 "pydantic[email]==2.7.1" httpx==0.27.0

# Create .env
cp .env.example .env
# Edit .env: set DATABASE_URL, SECRET_KEY, GROQ_API_KEY

# Create DB
psql -U postgres -c "CREATE DATABASE legal_workflow;"

# Run
uvicorn app.main:app --reload --port 8000
# Docs: http://localhost:8000/docs
```

---

## 2. Frontend Setup

```bash
cd legal-frontend
npm install
npm run dev
# App: http://localhost:3000
```

---

## API Endpoints (all wired in frontend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register + get JWT |
| POST | /api/auth/signin | Login + get JWT |
| GET  | /api/dashboard | KPI + insights + activity |
| GET/POST/PUT/DELETE | /api/cases | Case CRUD |
| POST | /api/documents | Upload PDF/DOC/TXT |
| POST | /api/copilot/chat | AI chat with optional docs |
| POST | /api/copilot/review-document/{id} | Quick review |
| POST | /api/copilot/research-case-law | Research |
| POST | /api/copilot/check-deadlines | Deadline check |
| GET  | /api/copilot/conversations | List conversations |
| GET/PUT | /api/settings/profile | Profile management |
| PUT  | /api/settings/password | Change password |
| PUT  | /api/settings/notifications | Toggle notifications |
| DELETE | /api/settings/account | Delete account |

---

## Environment Variables

**Backend (.env)**
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/legal_workflow
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
GROQ_API_KEY=gsk_xxxx   # optional - falls back to mock responses
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
