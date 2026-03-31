"""
Comprehensive test suite for AI Legal Workflow API
Run with: pytest tests/test_api.py -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app

# ── Test Database Setup (SQLite in-memory) ────────────────────────────────────
TEST_DATABASE_URL = "sqlite:///./test_legal.db"

engine = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def auth_headers(client):
    """Sign up and return auth headers for tests."""
    client.post("/api/auth/signup", json={
        "full_name": "Test User",
        "email": "test@example.com",
        "password": "testpass123",
    })
    response = client.post("/api/auth/signin", json={
        "email": "test@example.com",
        "password": "testpass123",
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ══════════════════════════════════════════════════════════════════════════════
# AUTH TESTS
# ══════════════════════════════════════════════════════════════════════════════

class TestAuth:

    def test_health_check(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "healthy"

    def test_root_endpoint(self, client):
        r = client.get("/")
        assert r.status_code == 200
        assert "AI Legal Workflow API" in r.json()["message"]

    def test_signup_success(self, client):
        r = client.post("/api/auth/signup", json={
            "full_name": "John Doe",
            "email": "john@example.com",
            "password": "securepass123",
        })
        assert r.status_code == 201
        data = r.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["full_name"] == "John Doe"
        assert data["user"]["email"] == "john@example.com"
        assert "id" in data["user"]

    def test_signup_duplicate_email(self, client):
        client.post("/api/auth/signup", json={
            "full_name": "Alice",
            "email": "duplicate@example.com",
            "password": "pass123",
        })
        r = client.post("/api/auth/signup", json={
            "full_name": "Alice Clone",
            "email": "duplicate@example.com",
            "password": "pass123",
        })
        assert r.status_code == 400
        assert "already registered" in r.json()["detail"].lower()

    def test_signup_short_password(self, client):
        r = client.post("/api/auth/signup", json={
            "full_name": "Bob",
            "email": "bob@example.com",
            "password": "123",
        })
        assert r.status_code == 422

    def test_signup_empty_name(self, client):
        r = client.post("/api/auth/signup", json={
            "full_name": "   ",
            "email": "noname@example.com",
            "password": "validpass123",
        })
        assert r.status_code == 422

    def test_signin_success(self, client):
        client.post("/api/auth/signup", json={
            "full_name": "Sign In User",
            "email": "signin@example.com",
            "password": "mypassword",
        })
        r = client.post("/api/auth/signin", json={
            "email": "signin@example.com",
            "password": "mypassword",
        })
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert data["user"]["email"] == "signin@example.com"

    def test_signin_wrong_password(self, client):
        r = client.post("/api/auth/signin", json={
            "email": "test@example.com",
            "password": "wrongpassword",
        })
        assert r.status_code == 401
        assert "Invalid" in r.json()["detail"]

    def test_signin_nonexistent_email(self, client):
        r = client.post("/api/auth/signin", json={
            "email": "nobody@example.com",
            "password": "pass123",
        })
        assert r.status_code == 401

    def test_get_me_authenticated(self, client, auth_headers):
        r = client.get("/api/auth/me", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == "test@example.com"
        assert data["full_name"] == "Test User"

    def test_get_me_no_token(self, client):
        r = client.get("/api/auth/me")
        assert r.status_code == 401

    def test_get_me_invalid_token(self, client):
        r = client.get("/api/auth/me", headers={"Authorization": "Bearer invalidtoken"})
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# DASHBOARD TESTS
# ══════════════════════════════════════════════════════════════════════════════

class TestDashboard:

    def test_get_dashboard_authenticated(self, client, auth_headers):
        r = client.get("/api/dashboard", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "kpi" in data
        assert "recent_activities" in data
        assert "ai_insights" in data

    def test_dashboard_kpi_structure(self, client, auth_headers):
        r = client.get("/api/dashboard", headers=auth_headers)
        kpi = r.json()["kpi"]
        assert "active_cases" in kpi
        assert "pending_tasks" in kpi
        assert "documents_processed_this_month" in kpi
        assert "ai_insights_generated" in kpi
        assert "active_cases_trend" in kpi
        assert isinstance(kpi["active_cases"], int)
        assert isinstance(kpi["pending_tasks"], int)

    def test_dashboard_requires_auth(self, client):
        r = client.get("/api/dashboard")
        assert r.status_code == 401

    def test_dashboard_new_user_has_insights(self, client, auth_headers):
        """New users should have seeded default AI insights."""
        r = client.get("/api/dashboard", headers=auth_headers)
        data = r.json()
        assert len(data["ai_insights"]) >= 1


# ══════════════════════════════════════════════════════════════════════════════
# CASE MANAGEMENT TESTS
# ══════════════════════════════════════════════════════════════════════════════

class TestCases:

    @pytest.fixture(scope="class")
    def created_case_id(self, client, auth_headers):
        r = client.post("/api/cases", headers=auth_headers, json={
            "title": "Test Employment Dispute",
            "client": "Jane Smith",
            "status": "active",
            "priority": "high",
            "description": "Test case description",
        })
        assert r.status_code == 201
        return r.json()["id"]

    def test_create_case_success(self, client, auth_headers):
        r = client.post("/api/cases", headers=auth_headers, json={
            "title": "Contract Review Case",
            "client": "Acme Corp",
            "status": "active",
            "priority": "medium",
        })
        assert r.status_code == 201
        data = r.json()
        assert data["title"] == "Contract Review Case"
        assert data["client"] == "Acme Corp"
        assert data["status"] == "active"
        assert data["priority"] == "medium"
        assert "case_number" in data
        assert "id" in data
        assert data["document_count"] == 0

    def test_create_case_with_deadline(self, client, auth_headers):
        r = client.post("/api/cases", headers=auth_headers, json={
            "title": "Deadline Case",
            "client": "Test Client",
            "priority": "high",
            "deadline": "2025-12-31T00:00:00Z",
        })
        assert r.status_code == 201
        assert r.json()["deadline"] is not None

    def test_create_case_requires_auth(self, client):
        r = client.post("/api/cases", json={
            "title": "Unauthorized Case",
            "client": "Nobody",
        })
        assert r.status_code == 401

    def test_create_case_missing_title(self, client, auth_headers):
        r = client.post("/api/cases", headers=auth_headers, json={
            "client": "Someone",
        })
        assert r.status_code == 422

    def test_get_all_cases(self, client, auth_headers):
        r = client.get("/api/cases", headers=auth_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1

    def test_get_cases_filter_by_status(self, client, auth_headers):
        r = client.get("/api/cases?status=active", headers=auth_headers)
        assert r.status_code == 200
        for case in r.json():
            assert case["status"] == "active"

    def test_get_cases_search(self, client, auth_headers):
        r = client.get("/api/cases?search=Contract", headers=auth_headers)
        assert r.status_code == 200
        # Should find "Contract Review Case" created above

    def test_get_single_case(self, client, auth_headers, created_case_id):
        r = client.get(f"/api/cases/{created_case_id}", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["id"] == created_case_id

    def test_get_nonexistent_case(self, client, auth_headers):
        r = client.get("/api/cases/999999", headers=auth_headers)
        assert r.status_code == 404

    def test_update_case(self, client, auth_headers, created_case_id):
        r = client.put(f"/api/cases/{created_case_id}", headers=auth_headers, json={
            "status": "pending",
            "priority": "low",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "pending"
        assert data["priority"] == "low"

    def test_update_case_partial(self, client, auth_headers, created_case_id):
        r = client.put(f"/api/cases/{created_case_id}", headers=auth_headers, json={
            "title": "Updated Title",
        })
        assert r.status_code == 200
        assert r.json()["title"] == "Updated Title"

    def test_cases_are_user_scoped(self, client):
        """Cases from one user should not be visible to another."""
        r = client.post("/api/auth/signup", json={
            "full_name": "Other User",
            "email": "other@example.com",
            "password": "otherpass123",
        })
        token = r.json()["access_token"]
        other_headers = {"Authorization": f"Bearer {token}"}

        r = client.get("/api/cases", headers=other_headers)
        assert r.status_code == 200
        assert len(r.json()) == 0  # Other user has no cases

    def test_delete_case(self, client, auth_headers):
        r = client.post("/api/cases", headers=auth_headers, json={
            "title": "To Be Deleted",
            "client": "Delete Me",
        })
        case_id = r.json()["id"]

        r = client.delete(f"/api/cases/{case_id}", headers=auth_headers)
        assert r.status_code == 204

        r = client.get(f"/api/cases/{case_id}", headers=auth_headers)
        assert r.status_code == 404

    def test_dashboard_kpi_updates_after_case_creation(self, client, auth_headers):
        r1 = client.get("/api/dashboard", headers=auth_headers)
        count_before = r1.json()["kpi"]["active_cases"]

        client.post("/api/cases", headers=auth_headers, json={
            "title": "KPI Test Case",
            "client": "KPI Client",
            "status": "active",
        })

        r2 = client.get("/api/dashboard", headers=auth_headers)
        count_after = r2.json()["kpi"]["active_cases"]
        assert count_after == count_before + 1


# ══════════════════════════════════════════════════════════════════════════════
# DOCUMENT TESTS
# ══════════════════════════════════════════════════════════════════════════════

class TestDocuments:

    def test_upload_txt_document(self, client, auth_headers):
        file_content = b"This is a sample legal document for testing purposes."
        r = client.post(
            "/api/documents",
            headers=auth_headers,
            files={"file": ("test.txt", file_content, "text/plain")},
            data={"doc_type": "Contract", "category": "Legal"},
        )
        assert r.status_code == 201
        data = r.json()
        assert data["original_name"] == "test.txt"
        assert data["doc_type"] == "Contract"
        assert "id" in data

    def test_upload_invalid_file_type(self, client, auth_headers):
        r = client.post(
            "/api/documents",
            headers=auth_headers,
            files={"file": ("test.exe", b"binary content", "application/octet-stream")},
        )
        assert r.status_code == 400
        assert "not allowed" in r.json()["detail"]

    def test_get_documents(self, client, auth_headers):
        r = client.get("/api/documents", headers=auth_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1

    def test_get_document_by_id(self, client, auth_headers):
        # Upload a doc first
        r = client.post(
            "/api/documents",
            headers=auth_headers,
            files={"file": ("getme.txt", b"Get this document", "text/plain")},
        )
        doc_id = r.json()["id"]

        r = client.get(f"/api/documents/{doc_id}", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["id"] == doc_id

    def test_get_nonexistent_document(self, client, auth_headers):
        r = client.get("/api/documents/999999", headers=auth_headers)
        assert r.status_code == 404

    def test_delete_document(self, client, auth_headers):
        r = client.post(
            "/api/documents",
            headers=auth_headers,
            files={"file": ("delete_me.txt", b"Delete this", "text/plain")},
        )
        doc_id = r.json()["id"]

        r = client.delete(f"/api/documents/{doc_id}", headers=auth_headers)
        assert r.status_code == 204

        r = client.get(f"/api/documents/{doc_id}", headers=auth_headers)
        assert r.status_code == 404

    def test_upload_document_to_case(self, client, auth_headers):
        # Create case first
        case_r = client.post("/api/cases", headers=auth_headers, json={
            "title": "Doc Test Case", "client": "Doc Client",
        })
        case_id = case_r.json()["id"]

        r = client.post(
            "/api/documents",
            headers=auth_headers,
            files={"file": ("case_doc.txt", b"Case document content", "text/plain")},
            data={"case_id": str(case_id)},
        )
        assert r.status_code == 201
        assert r.json()["case_id"] == case_id

    def test_get_documents_filtered_by_case(self, client, auth_headers):
        case_r = client.post("/api/cases", headers=auth_headers, json={
            "title": "Filter Doc Case", "client": "Filter Client",
        })
        case_id = case_r.json()["id"]

        client.post(
            "/api/documents",
            headers=auth_headers,
            files={"file": ("filtered.txt", b"Filtered doc", "text/plain")},
            data={"case_id": str(case_id)},
        )

        r = client.get(f"/api/documents?case_id={case_id}", headers=auth_headers)
        assert r.status_code == 200
        assert all(doc["case_id"] == case_id for doc in r.json())

    def test_documents_require_auth(self, client):
        r = client.get("/api/documents")
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# AI COPILOT TESTS  (mock AI - no real Groq key needed)
# ══════════════════════════════════════════════════════════════════════════════

class TestCopilot:

    def test_chat_text_only(self, client, auth_headers):
        r = client.post("/api/copilot/chat", headers=auth_headers, json={
            "message": "What are the key elements of a valid contract?",
        })
        assert r.status_code == 200
        data = r.json()
        assert "message_id" in data
        assert "conversation_id" in data
        assert "response" in data
        assert "analysis" in data
        assert isinstance(data["conversation_id"], int)

    def test_chat_creates_conversation(self, client, auth_headers):
        r = client.post("/api/copilot/chat", headers=auth_headers, json={
            "message": "Explain force majeure clauses",
        })
        assert r.status_code == 200
        conv_id = r.json()["conversation_id"]
        assert conv_id is not None

    def test_chat_continues_conversation(self, client, auth_headers):
        r1 = client.post("/api/copilot/chat", headers=auth_headers, json={
            "message": "What is breach of contract?",
        })
        conv_id = r1.json()["conversation_id"]

        r2 = client.post("/api/copilot/chat", headers=auth_headers, json={
            "message": "What are the remedies?",
            "conversation_id": conv_id,
        })
        assert r2.status_code == 200
        assert r2.json()["conversation_id"] == conv_id

    def test_chat_with_document(self, client, auth_headers):
        # Upload a document
        doc_r = client.post(
            "/api/documents",
            headers=auth_headers,
            files={"file": ("contract.txt", b"This agreement is made between Party A and Party B for services.", "text/plain")},
        )
        doc_id = str(doc_r.json()["id"])

        r = client.post("/api/copilot/chat", headers=auth_headers, json={
            "message": "Analyze this contract",
            "document_ids": [doc_id],
        })
        assert r.status_code == 200
        data = r.json()
        assert "response" in data
        assert "analysis" in data

    def test_chat_analysis_structure(self, client, auth_headers):
        r = client.post("/api/copilot/chat", headers=auth_headers, json={
            "message": "Review a lease agreement",
        })
        analysis = r.json()["analysis"]
        assert "intention" in analysis
        assert "purpose" in analysis
        assert "recommended_actions" in analysis
        assert "deadline" in analysis
        assert "threats" in analysis
        assert "simple_language" in analysis
        assert "full_analysis" in analysis

    def test_chat_empty_message(self, client, auth_headers):
        r = client.post("/api/copilot/chat", headers=auth_headers, json={
            "message": "   ",
        })
        # Should still process (whitespace only)
        assert r.status_code in [200, 422]

    def test_get_conversations(self, client, auth_headers):
        r = client.get("/api/copilot/conversations", headers=auth_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1

    def test_get_single_conversation(self, client, auth_headers):
        # Create a conversation
        r = client.post("/api/copilot/chat", headers=auth_headers, json={
            "message": "What is tort law?",
        })
        conv_id = r.json()["conversation_id"]

        r = client.get(f"/api/copilot/conversations/{conv_id}", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == conv_id
        assert "messages" in data
        assert len(data["messages"]) >= 2  # user + assistant

    def test_get_nonexistent_conversation(self, client, auth_headers):
        r = client.get("/api/copilot/conversations/999999", headers=auth_headers)
        assert r.status_code == 404

    def test_delete_conversation(self, client, auth_headers):
        r = client.post("/api/copilot/chat", headers=auth_headers, json={
            "message": "Delete this conversation",
        })
        conv_id = r.json()["conversation_id"]

        r = client.delete(f"/api/copilot/conversations/{conv_id}", headers=auth_headers)
        assert r.status_code == 204

        r = client.get(f"/api/copilot/conversations/{conv_id}", headers=auth_headers)
        assert r.status_code == 404

    def test_review_document_quick_action(self, client, auth_headers):
        doc_r = client.post(
            "/api/documents",
            headers=auth_headers,
            files={"file": ("review_doc.txt", b"Employment agreement terms and conditions.", "text/plain")},
        )
        doc_id = doc_r.json()["id"]

        r = client.post(f"/api/copilot/review-document/{doc_id}", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "content" in data
        assert "analysis" in data
        assert "document_name" in data

    def test_review_nonexistent_document(self, client, auth_headers):
        r = client.post("/api/copilot/review-document/999999", headers=auth_headers)
        assert r.status_code == 404

    def test_research_case_law(self, client, auth_headers):
        r = client.post("/api/copilot/research-case-law", headers=auth_headers, json={
            "query": "employment discrimination law",
        })
        assert r.status_code == 200
        assert "content" in r.json()

    def test_research_case_law_empty_query(self, client, auth_headers):
        r = client.post("/api/copilot/research-case-law", headers=auth_headers, json={
            "query": "",
        })
        assert r.status_code == 400

    def test_check_deadlines_no_cases(self, client):
        # Create fresh user with no cases
        client.post("/api/auth/signup", json={
            "full_name": "No Cases User",
            "email": "nocases@example.com",
            "password": "pass12345",
        })
        r = client.post("/api/auth/signin", json={
            "email": "nocases@example.com",
            "password": "pass12345",
        })
        token = r.json()["access_token"]
        h = {"Authorization": f"Bearer {token}"}

        r = client.post("/api/copilot/check-deadlines", headers=h, json={})
        assert r.status_code == 200
        assert "content" in r.json()

    def test_check_deadlines_with_cases(self, client, auth_headers):
        r = client.post("/api/copilot/check-deadlines", headers=auth_headers, json={})
        assert r.status_code == 200
        data = r.json()
        assert "content" in data

    def test_copilot_requires_auth(self, client):
        r = client.post("/api/copilot/chat", json={"message": "test"})
        assert r.status_code == 401

    def test_conversations_scoped_to_user(self, client, auth_headers):
        """User should not see other users' conversations."""
        r = client.post("/api/auth/signup", json={
            "full_name": "Isolated User",
            "email": "isolated@example.com",
            "password": "isolatedpass",
        })
        token = r.json()["access_token"]
        isolated_headers = {"Authorization": f"Bearer {token}"}

        r = client.get("/api/copilot/conversations", headers=isolated_headers)
        assert r.status_code == 200
        assert len(r.json()) == 0


# ══════════════════════════════════════════════════════════════════════════════
# SETTINGS TESTS
# ══════════════════════════════════════════════════════════════════════════════

class TestSettings:

    @pytest.fixture(scope="class")
    def settings_headers(self, client):
        """Dedicated user for settings tests to avoid state conflicts."""
        client.post("/api/auth/signup", json={
            "full_name": "Settings User",
            "email": "settings@example.com",
            "password": "settingspass",
        })
        r = client.post("/api/auth/signin", json={
            "email": "settings@example.com",
            "password": "settingspass",
        })
        return {"Authorization": f"Bearer {r.json()['access_token']}"}

    def test_get_profile(self, client, settings_headers):
        r = client.get("/api/settings/profile", headers=settings_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["full_name"] == "Settings User"
        assert data["email"] == "settings@example.com"
        assert "email_notifications" in data
        assert "task_reminders" in data

    def test_update_profile_name(self, client, settings_headers):
        r = client.put("/api/settings/profile", headers=settings_headers, json={
            "full_name": "Updated Settings User",
        })
        assert r.status_code == 200
        assert r.json()["full_name"] == "Updated Settings User"

    def test_update_profile_phone(self, client, settings_headers):
        r = client.put("/api/settings/profile", headers=settings_headers, json={
            "phone": "+1 (555) 999-8888",
        })
        assert r.status_code == 200
        assert r.json()["phone"] == "+1 (555) 999-8888"

    def test_update_profile_email_duplicate(self, client, settings_headers):
        r = client.put("/api/settings/profile", headers=settings_headers, json={
            "email": "test@example.com",  # Already taken by test user
        })
        assert r.status_code == 400
        assert "already in use" in r.json()["detail"]

    def test_update_password_success(self, client, settings_headers):
        r = client.put("/api/settings/password", headers=settings_headers, json={
            "current_password": "settingspass",
            "new_password": "newsettingspass",
        })
        assert r.status_code == 200
        assert "successfully" in r.json()["message"]

    def test_update_password_wrong_current(self, client, settings_headers):
        r = client.put("/api/settings/password", headers=settings_headers, json={
            "current_password": "wrongpassword",
            "new_password": "anotherpass123",
        })
        assert r.status_code == 400
        assert "incorrect" in r.json()["detail"]

    def test_update_password_too_short(self, client, settings_headers):
        r = client.put("/api/settings/password", headers=settings_headers, json={
            "current_password": "newsettingspass",
            "new_password": "123",
        })
        assert r.status_code == 422

    def test_update_notifications(self, client, settings_headers):
        r = client.put("/api/settings/notifications", headers=settings_headers, json={
            "email_notifications": False,
            "task_reminders": True,
            "case_updates": False,
            "document_alerts": True,
        })
        assert r.status_code == 200
        data = r.json()
        assert data["email_notifications"] == False
        assert data["task_reminders"] == True
        assert data["case_updates"] == False
        assert data["document_alerts"] == True

    def test_update_notifications_partial(self, client, settings_headers):
        r = client.put("/api/settings/notifications", headers=settings_headers, json={
            "document_alerts": True,
        })
        assert r.status_code == 200
        assert r.json()["document_alerts"] == True

    def test_settings_require_auth(self, client):
        r = client.get("/api/settings/profile")
        assert r.status_code == 401

    def test_delete_account(self, client):
        """Test account deletion."""
        client.post("/api/auth/signup", json={
            "full_name": "Delete Me",
            "email": "deleteme@example.com",
            "password": "deletepass123",
        })
        r = client.post("/api/auth/signin", json={
            "email": "deleteme@example.com",
            "password": "deletepass123",
        })
        h = {"Authorization": f"Bearer {r.json()['access_token']}"}

        r = client.delete("/api/settings/account", headers=h)
        assert r.status_code == 200

        # Account should be gone
        r = client.post("/api/auth/signin", json={
            "email": "deleteme@example.com",
            "password": "deletepass123",
        })
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# INTEGRATION TESTS
# ══════════════════════════════════════════════════════════════════════════════

class TestIntegration:

    def test_full_workflow(self, client, auth_headers):
        """Create case → upload doc → chat about it → check dashboard."""
        # 1. Check initial dashboard
        r = client.get("/api/dashboard", headers=auth_headers)
        initial_cases = r.json()["kpi"]["active_cases"]

        # 2. Create a case
        case_r = client.post("/api/cases", headers=auth_headers, json={
            "title": "Integration Test Case",
            "client": "Integration Client",
            "status": "active",
            "priority": "high",
        })
        assert case_r.status_code == 201
        case_id = case_r.json()["id"]

        # 3. Upload document to case
        doc_r = client.post(
            "/api/documents",
            headers=auth_headers,
            files={"file": ("integration.txt", b"Legal document for integration test.", "text/plain")},
            data={"case_id": str(case_id)},
        )
        assert doc_r.status_code == 201
        doc_id = str(doc_r.json()["id"])

        # 4. Chat about the document
        chat_r = client.post("/api/copilot/chat", headers=auth_headers, json={
            "message": "Summarize this document",
            "document_ids": [doc_id],
        })
        assert chat_r.status_code == 200
        conv_id = chat_r.json()["conversation_id"]

        # 5. Continue conversation
        chat_r2 = client.post("/api/copilot/chat", headers=auth_headers, json={
            "message": "What are the key risks?",
            "conversation_id": conv_id,
        })
        assert chat_r2.status_code == 200

        # 6. Dashboard should show updated case count
        r = client.get("/api/dashboard", headers=auth_headers)
        assert r.json()["kpi"]["active_cases"] >= initial_cases + 1

        # 7. Recent activities should show the case and doc
        activities = r.json()["recent_activities"]
        assert len(activities) >= 1

        # 8. Verify case shows correct doc count
        case_r = client.get(f"/api/cases/{case_id}", headers=auth_headers)
        assert case_r.json()["document_count"] == 1

    def test_case_number_auto_increment(self, client, auth_headers):
        r1 = client.post("/api/cases", headers=auth_headers, json={
            "title": "First Case", "client": "A",
        })
        r2 = client.post("/api/cases", headers=auth_headers, json={
            "title": "Second Case", "client": "B",
        })
        num1 = int(r1.json()["case_number"])
        num2 = int(r2.json()["case_number"])
        assert num2 > num1

    def test_user_data_isolation(self, client):
        """Two users cannot access each other's data."""
        # User A
        client.post("/api/auth/signup", json={
            "full_name": "User A", "email": "usera@test.com", "password": "passA12345",
        })
        ra = client.post("/api/auth/signin", json={"email": "usera@test.com", "password": "passA12345"})
        headers_a = {"Authorization": f"Bearer {ra.json()['access_token']}"}

        # User B
        client.post("/api/auth/signup", json={
            "full_name": "User B", "email": "userb@test.com", "password": "passB12345",
        })
        rb = client.post("/api/auth/signin", json={"email": "userb@test.com", "password": "passB12345"})
        headers_b = {"Authorization": f"Bearer {rb.json()['access_token']}"}

        # A creates a case
        case_r = client.post("/api/cases", headers=headers_a, json={
            "title": "User A Private Case", "client": "Private",
        })
        case_id = case_r.json()["id"]

        # B cannot see A's case
        r = client.get(f"/api/cases/{case_id}", headers=headers_b)
        assert r.status_code == 404

        # B's case list is empty
        r = client.get("/api/cases", headers=headers_b)
        assert len(r.json()) == 0
