from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from app.agents import crm_agent, system_prompt
from app.database.connection import SessionLocal
from app.models import Interaction, HCP

app = FastAPI(title="AI-First CRM API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://ai-crm-hcp-ui.onrender.com"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=86400,
)

class ChatRequest(BaseModel):
    message: str
    thread_id: str = "default_thread"

@app.options("/chat")
def options_chat():
    return Response(status_code=200, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*"
    })

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "CRM Backend is running"}

@app.post("/chat")
async def chat_with_agent(request: ChatRequest):
    try:
        config = {
            "configurable": {"thread_id": request.thread_id},
            "recursion_limit": 10
        }
        
        response = crm_agent.invoke(
            {"messages": [("system", system_prompt), ("user", request.message)]}, 
            config=config
        )
        
        messages = response["messages"]
        final_message = messages[-1].content
        
        # --- NEW ROBUST TOOL DETECTION ---
        # Scan backward to find ALL tools used in THIS specific interaction
        active_tools = []
        for msg in reversed(messages):
            if msg.type == "human": 
                break # Stop checking when we reach the user's prompt
            
            if hasattr(msg, "tool_calls") and msg.tool_calls:
                for tc in msg.tool_calls:
                    active_tools.append(tc["name"])
        
        crm_data = None
        history_list = None
        
        db = SessionLocal()
        try:
            # ROUTE A PRIORITY: If AI logged or edited data, ALWAYS update the Form UI
            if "log_interaction" in active_tools or "edit_latest_interaction" in active_tools:
                latest = db.query(Interaction).order_by(Interaction.id.desc()).first()
                if latest:
                    hcp = db.query(HCP).filter(HCP.id == latest.hcp_id).first()
                    
                    formatted_date = ""
                    if latest.interaction_date:
                        formatted_date = latest.interaction_date.strftime("%B %d, %Y, %I:%M %p")

                    crm_data = {
                        "hcp_name": hcp.name if hcp else "Unknown",
                        "interaction_type": latest.interaction_type,
                        "interaction_date": formatted_date,
                        "sentiment": latest.sentiment,
                        "discussion_notes": latest.discussion_notes,
                        "materials_shared": latest.materials_shared,
                        "samples_distributed": latest.samples_distributed,
                        "outcomes": latest.outcomes,
                        "follow_up": latest.follow_up,
                        "summary": latest.summary
                    }
                    
            # ROUTE B: Only send history if they asked for it AND didn't just log something
            elif "get_hcp_history" in active_tools:
                args = {}
                for msg in reversed(messages):
                    if msg.type == "human": break
                    if hasattr(msg, "tool_calls") and msg.tool_calls:
                        for tc in msg.tool_calls:
                            if tc["name"] == "get_hcp_history":
                                args = tc["args"]
                                break
                    if args: break
                
                searched_hcp = args.get("hcp_name", "")
                show_on_ui = args.get("show_on_ui", True)
                
                if show_on_ui and searched_hcp:
                    hcp = db.query(HCP).filter(HCP.name.ilike(f"%{searched_hcp}%")).first()
                    if hcp:
                        past_meetings = db.query(Interaction).filter(Interaction.hcp_id == hcp.id).order_by(Interaction.interaction_date.desc()).limit(3).all()
                        history_list = [
                            {k: v for k, v in {
                                "date": m.interaction_date.strftime("%b %d, %Y, %I:%M %p") if m.interaction_date else "Unknown",
                                "type": m.interaction_type,
                                "notes": m.discussion_notes,
                                "materials": m.materials_shared,
                                "samples": m.samples_distributed,
                                "sentiment": m.sentiment,
                                "outcomes": m.outcomes,
                                "follow_up": m.follow_up
                            }.items() if v} 
                            for m in past_meetings
                        ]
            # ROUTE C: Next Best Action -> Update the Form UI with the NBA field
            elif "get_next_best_action" in active_tools:
                nba_list = []  # Changed to array
                for msg in messages:
                    if msg.type == "tool" and msg.name == "get_next_best_action":
                        raw_nba = msg.content.replace("NBA:", "").strip()
                        # Split by pipe and remove empty strings
                        nba_list = [action.strip() for action in raw_nba.split("|") if action.strip()]
                
                searched_hcp = ""
                for msg in reversed(messages):
                    if hasattr(msg, "tool_calls") and msg.tool_calls:
                        for tc in msg.tool_calls:
                            if tc["name"] == "get_next_best_action":
                                searched_hcp = tc["args"].get("hcp_name", "")
                                break
                
                if searched_hcp:
                    hcp = db.query(HCP).filter(HCP.name.ilike(f"%{searched_hcp}%")).first()
                    if hcp:
                        latest = db.query(Interaction).filter(Interaction.hcp_id == hcp.id).order_by(Interaction.id.desc()).first()
                        if latest:
                            formatted_date = latest.interaction_date.strftime("%B %d, %Y, %I:%M %p") if latest.interaction_date else ""
                            
                            crm_data = {
                                "hcp_name": hcp.name,
                                "interaction_type": latest.interaction_type,
                                "interaction_date": formatted_date,
                                "sentiment": latest.sentiment,
                                "discussion_notes": latest.discussion_notes,
                                "materials_shared": latest.materials_shared,
                                "samples_distributed": latest.samples_distributed,
                                "outcomes": latest.outcomes,
                                "follow_up": latest.follow_up,
                                "summary": latest.summary,
                                "next_best_action": nba_list # <-- NOW PASSING A LIST
                            }
        finally:
            db.close()

        # Send both payloads (UI will naturally show whichever is populated)
        return {
            "reply": final_message,
            "data": crm_data,
            "history": history_list
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))