import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent

# Import the tools we just built
from app.tools import log_interaction, edit_latest_interaction, get_hcp_history

load_dotenv()

# Initialize the Groq LLM specified in your requirements
llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama-3.1-8b-instant",
    temperature=0.1, # Low temperature for accurate data extraction
    max_retries=2
)

# List of tools the agent is allowed to use
tools = [
    log_interaction, 
    edit_latest_interaction, 
    get_hcp_history
]

# The Master Prompt enforcing the "No Manual Entry" rule
system_prompt = """
You are an AI-First CRM Copilot for Healthcare Professionals (HCPs) and Medical Representatives.
Your primary job is to log, edit, and retrieve interaction data using your tools.

CRITICAL RULES:
1. The user must NEVER manually fill out a form. You must extract information from their natural language and use the `log_interaction` tool to save it.
2. If the user mentions meeting a doctor but leaves out key details (like what they discussed), you can politely ask follow-up questions before using the tool.
3. Once you successfully use a tool, provide a brief, professional summary to the user confirming what was saved.
4. If asked to suggest next actions or generate a summary, look at the interaction history and provide your best analytical advice.
"""

# Compile the LangGraph agent
crm_agent = create_react_agent(
    model=llm,
    tools=tools
)