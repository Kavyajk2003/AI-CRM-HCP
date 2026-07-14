from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

# Import our compiled agent AND the system prompt
from app.agents import crm_agent, system_prompt

app = FastAPI(title="AI-First CRM API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Schema for the incoming chat request
class ChatRequest(BaseModel):
    message: str
    thread_id: str = "default_thread"

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "CRM Backend is running"}

@app.post("/chat")
async def chat_with_agent(request: ChatRequest):
    try:
        config = {"configurable": {"thread_id": request.thread_id}}
        
        # Inject the system prompt explicitly into the message history!
        response = crm_agent.invoke(
            {"messages": [("system", system_prompt), ("user", request.message)]}, 
            config=config
        )
        
        # Extract the final text response from the AI
        final_message = response["messages"][-1].content
        
        return {"reply": final_message}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))