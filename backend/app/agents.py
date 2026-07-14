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
2. VAGUE INPUT RULE: If the user provides an extremely short or vague input (like just a name, e.g., "Bob"), DO NOT USE ANY TOOLS. Immediately ask the user what they would like to do.
3. Once you successfully log or edit a meeting, provide a brief, professional summary to the user confirming what was saved.
4. When you retrieve interaction history, you MUST provide a highly detailed breakdown in your text response. Do not just summarize the sentiment. explicitly list out the Date, Notes, Sentiment, Outcomes, and Follow-ups.
5. TOOL ERROR RULE: If a tool returns an error, stop immediately and tell the user the doctor could not be found.
6. SPEED RULE: If you have enough information, execute the necessary tool immediately and stop.
7. MEMORY OVERRIDE: Never rely on your chat history for past interactions. Trigger the `get_hcp_history` tool EXACTLY ONCE when the user asks for history. Once the tool returns the data, you MUST immediately output your final text summary to the user and STOP.
8. STAY IN CHARACTER: You are a professional CRM system. NEVER use phrases like "simulated example," "As an AI," or "actual data may vary." Treat all data from your tools as absolute factual reality.
9. DATA NORMALIZATION: You are responsible for data cleaning. Before calling any tool, you MUST strip all titles (Dr., Doctor, Prof., Mr., Ms.) from the HCP's name. Always pass only the canonical last name to the tools.
"""

# Compile the LangGraph agent
crm_agent = create_react_agent(
    model=llm,
    tools=tools
)