import os
import json
from typing import Optional, List
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


def get_groq_client() -> Optional[Groq]:
    if not GROQ_API_KEY:
        return None
    return Groq(api_key=GROQ_API_KEY)


LEGAL_ANALYSIS_SYSTEM_PROMPT = """You are an expert AI legal assistant. When analyzing legal documents or answering legal questions, always respond in the following JSON format:

{
  "intention": "The legal intention/goal behind the document or query",
  "purpose": "The main purpose of the document or request",
  "recommended_actions": "Specific recommended actions the user should take",
  "deadline": "Any important deadlines mentioned or implied (write 'None identified' if not applicable)",
  "threats": "Potential legal risks or threats identified",
  "simple_language": "A plain-language summary a non-lawyer can understand",
  "full_analysis": "Comprehensive legal analysis and response"
}

Always be thorough, professional, and provide actionable insights. Focus on:
1. Converting complex legal language to simple terms
2. Identifying key deadlines and action items
3. Highlighting risks and opportunities
4. Providing practical recommendations"""


LEGAL_GENERAL_SYSTEM_PROMPT = """You are an expert AI legal assistant for a law firm management platform. 
You help lawyers and legal professionals with:
- Legal research and case law
- Document analysis and review
- Deadline management
- Case strategy and planning
- Legal drafting assistance

Always respond in the following JSON format:
{
  "intention": "What the user is trying to accomplish",
  "purpose": "The context and purpose of this query",
  "recommended_actions": "Specific next steps to take",
  "deadline": "Any time-sensitive elements (write 'None identified' if not applicable)",
  "threats": "Potential risks or issues to be aware of",
  "simple_language": "Plain-language summary",
  "full_analysis": "Detailed response with professional analysis"
}

Be concise, professional, and actionable."""


def analyze_legal_content(
    user_message: str,
    document_content: Optional[str] = None,
    conversation_history: Optional[List[dict]] = None
) -> dict:
    """
    Analyze legal content using Groq LLM.
    Returns structured analysis dict.
    """
    client = get_groq_client()

    if not client:
        # Return mock response if no API key
        return {
            "intention": "Legal assistance requested",
            "purpose": "Analyzing the provided legal query",
            "recommended_actions": "Please configure GROQ_API_KEY to enable AI analysis",
            "deadline": "None identified",
            "threats": "AI service not configured",
            "simple_language": "AI analysis is not available. Please add your GROQ_API_KEY to the .env file.",
            "full_analysis": f"Mock response for: {user_message[:200]}"
        }

    messages = []

    # Add conversation history
    if conversation_history:
        for msg in conversation_history[-6:]:  # Last 6 messages for context
            messages.append({"role": msg["role"], "content": msg["content"]})

    # Build the user message
    if document_content:
        content = f"""Please analyze the following legal document and answer the user's question.

DOCUMENT CONTENT:
{document_content[:8000]}

USER QUESTION/INSTRUCTION:
{user_message}

Provide a complete structured legal analysis."""
        system_prompt = LEGAL_ANALYSIS_SYSTEM_PROMPT
    else:
        content = user_message
        system_prompt = LEGAL_GENERAL_SYSTEM_PROMPT

    messages.append({"role": "user", "content": content})

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                *messages
            ],
            temperature=0.3,
            max_tokens=2000,
        )

        raw_content = response.choices[0].message.content.strip()

        # Try to parse JSON response
        try:
            # Clean up potential markdown code blocks
            if "```json" in raw_content:
                raw_content = raw_content.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_content:
                raw_content = raw_content.split("```")[1].split("```")[0].strip()

            analysis = json.loads(raw_content)
            return analysis
        except json.JSONDecodeError:
            # If not JSON, wrap in structure
            return {
                "intention": "Legal assistance",
                "purpose": "Processing your legal query",
                "recommended_actions": "Review the analysis below",
                "deadline": "None identified",
                "threats": "See full analysis",
                "simple_language": raw_content[:500],
                "full_analysis": raw_content
            }

    except Exception as e:
        return {
            "intention": "Error occurred",
            "purpose": "Could not process request",
            "recommended_actions": "Please try again",
            "deadline": "None identified",
            "threats": f"Service error: {str(e)}",
            "simple_language": "An error occurred while processing your request.",
            "full_analysis": f"Error: {str(e)}"
        }


def research_case_law(query: str) -> dict:
    """Research case law using Groq."""
    client = get_groq_client()

    if not client:
        return {
            "intention": "Case law research",
            "purpose": f"Research on: {query}",
            "recommended_actions": "Configure GROQ_API_KEY",
            "deadline": "None identified",
            "threats": "AI not configured",
            "simple_language": "AI service not available",
            "full_analysis": "Please configure GROQ_API_KEY"
        }

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": """You are a legal research expert. Research the given topic and provide relevant case law, statutes, and legal precedents. 
                    Respond in JSON format with keys: intention, purpose, recommended_actions, deadline, threats, simple_language, full_analysis"""
                },
                {
                    "role": "user",
                    "content": f"Research case law and legal precedents for: {query}"
                }
            ],
            temperature=0.3,
            max_tokens=2000,
        )

        raw_content = response.choices[0].message.content.strip()
        try:
            if "```json" in raw_content:
                raw_content = raw_content.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_content:
                raw_content = raw_content.split("```")[1].split("```")[0].strip()
            return json.loads(raw_content)
        except:
            return {
                "intention": "Case law research",
                "purpose": f"Research on: {query}",
                "recommended_actions": "Review findings below",
                "deadline": "None identified",
                "threats": "See full analysis",
                "simple_language": raw_content[:300],
                "full_analysis": raw_content
            }
    except Exception as e:
        return {"full_analysis": f"Research error: {str(e)}", "simple_language": str(e)}


def check_deadlines_ai(cases_data: str) -> dict:
    """AI analysis of upcoming deadlines."""
    client = get_groq_client()

    if not client:
        return {
            "intention": "Deadline check",
            "purpose": "Review upcoming deadlines",
            "recommended_actions": "Configure GROQ_API_KEY",
            "deadline": "Unable to analyze",
            "threats": "AI not configured",
            "simple_language": "AI service not available",
            "full_analysis": "Please configure GROQ_API_KEY"
        }

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a legal deadline management expert. Analyze the provided case data and identify critical deadlines. Respond in JSON format with keys: intention, purpose, recommended_actions, deadline, threats, simple_language, full_analysis"
                },
                {
                    "role": "user",
                    "content": f"Analyze these cases for deadline urgency:\n{cases_data}"
                }
            ],
            temperature=0.2,
            max_tokens=1500,
        )

        raw_content = response.choices[0].message.content.strip()
        try:
            if "```json" in raw_content:
                raw_content = raw_content.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_content:
                raw_content = raw_content.split("```")[1].split("```")[0].strip()
            return json.loads(raw_content)
        except:
            return {
                "intention": "Deadline analysis",
                "purpose": "Review case deadlines",
                "recommended_actions": "See full analysis",
                "deadline": "Multiple deadlines found",
                "threats": "See full analysis",
                "simple_language": raw_content[:300],
                "full_analysis": raw_content
            }
    except Exception as e:
        return {"full_analysis": f"Error: {str(e)}", "simple_language": str(e)}
