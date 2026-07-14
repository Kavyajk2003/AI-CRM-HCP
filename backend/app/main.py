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
    allow_origins=["*"], 
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
            "recursion_limit": 50
        }
        
        response = crm_agent.invoke(
            {"messages": [("system", system_prompt), ("user", request.message)]}, 
            config=config
        )
        
        messages = response["messages"]
        final_message = messages[-1].content
        
        # 1. Check if a tool was used AND get its exact name
        tool_was_used = len(messages) >= 2 and messages[-2].type == "tool"
        tool_name = messages[-2].name if tool_was_used else None
        
        crm_data = None
        history_list = None
        
        if tool_was_used:
            db = SessionLocal()
            
            # ROUTE A: AI is logging or editing a meeting -> Update the Form
            if tool_name in ["log_interaction", "edit_latest_interaction"]:
                latest = db.query(Interaction).order_by(Interaction.id.desc()).first()
                if latest:
                    hcp = db.query(HCP).filter(HCP.id == latest.hcp_id).first()
                    crm_data = {
                        "hcp_name": hcp.name if hcp else "Unknown",
                        "interaction_type": latest.interaction_type,
                        "sentiment": latest.sentiment,
                        "discussion_notes": latest.discussion_notes,
                        "follow_up": latest.follow_up
                    }
                    
            # ROUTE B: AI is looking up history -> Send a list for the Timeline
            elif tool_name == "get_hcp_history":
                # Extract the doctor's name AND the UI flag from the AI's tool request
                ai_request_msg = messages[-3]
                args = ai_request_msg.tool_calls[0]["args"]
                
                searched_hcp = args.get("hcp_name", "")
                show_on_ui = args.get("show_on_ui", True) # Defaults to True if the AI didn't specify
                
                # SMART CHECK: Only query and format the UI data if the AI allows it!
                if show_on_ui:
                    hcp = db.query(HCP).filter(HCP.name.ilike(f"%{searched_hcp}%")).first()
                    if hcp:
                        past_meetings = db.query(Interaction).filter(Interaction.hcp_id == hcp.id).order_by(Interaction.interaction_date.desc()).limit(3).all()
                        history_list = [
                            {
                                "date": m.interaction_date.strftime("%b %d, %Y"),
                                "notes": m.discussion_notes,
                                "sentiment": m.sentiment
                            } for m in past_meetings
                        ]
            db.close()

        # 2. Send both payloads (only one will be populated, the other will be null)
        return {
            "reply": final_message,
            "data": crm_data,
            "history": history_list
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))