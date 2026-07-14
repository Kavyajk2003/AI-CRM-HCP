from langchain_core.tools import tool
from app.database.connection import SessionLocal
from app.models import HCP, Interaction
from datetime import datetime

@tool
def log_interaction(
    hcp_name: str, 
    interaction_type: str = "In-Person", 
    discussion_notes: str = "", 
    materials_shared: str = "", 
    samples_distributed: str = "", 
    sentiment: str = "", 
    outcomes: str = "", 
    follow_up: str = "", 
    summary: str = ""
) -> str:
    """
    Mandatory Tool 1: Create a new CRM interaction log using natural language data.
    IMPORTANT: You must extract only the NAME of the doctor from the user's request. 
    Do not include titles like 'Dr.', 'Doctor', or 'Prof.'. 
    Example: If the user says 'Dr. Smith', you must pass 'Smith' to this tool.
    """
    print(f"🚨 AI TRIGGERED log_interaction FOR: {hcp_name}")
    db = SessionLocal()
    try:
        hcp = db.query(HCP).filter(HCP.name.ilike(f"%{hcp_name}%")).first()
        if not hcp:
            return f"Error: Could not find a Healthcare Professional named {hcp_name}."

        new_interaction = Interaction(
            hcp_id=hcp.id,
            interaction_type=interaction_type,
            discussion_notes=discussion_notes,
            materials_shared=materials_shared,
            samples_distributed=samples_distributed,
            sentiment=sentiment,
            outcomes=outcomes,
            follow_up=follow_up,
            summary=summary
        )
        db.add(new_interaction)
        db.commit()
        db.refresh(new_interaction)
        return f"SUCCESS: Interaction logged for {hcp.name}. Inform the user that the form has been automatically updated."
    finally:
        db.close()

@tool
def edit_latest_interaction(
    hcp_name: str,
    sentiment: str = None,
    follow_up: str = None,
    outcomes: str = None
) -> str:
    """
    Mandatory Tool 2: Modify specific fields of the MOST RECENT interaction for a given HCP.
    Only pass the fields that need to be changed.
    IMPORTANT: You must extract only the NAME of the doctor from the user's request. 
    Do not include titles like 'Dr.', 'Doctor', or 'Prof.'. 
    Example: If the user says 'Dr. Smith', you must pass 'Smith' to this tool.
    """
    db = SessionLocal()
    try:
        hcp = db.query(HCP).filter(HCP.name.ilike(f"%{hcp_name}%")).first()
        if not hcp:
            return f"Error: Could not find {hcp_name}."

        latest_interaction = db.query(Interaction).filter(Interaction.hcp_id == hcp.id).order_by(Interaction.created_at.desc()).first()
        
        if not latest_interaction:
            return f"Error: No interactions exist yet for {hcp.name}."

        if sentiment: latest_interaction.sentiment = sentiment
        if follow_up: latest_interaction.follow_up = follow_up
        if outcomes: latest_interaction.outcomes = outcomes

        db.commit()
        return f"SUCCESS: Latest interaction for {hcp.name} updated. Inform the user of the specific changes."
    finally:
        db.close()

@tool
def get_hcp_history(hcp_name: str, show_on_ui: bool = True) -> str:
    """
    Tool 3: Retrieve previous meeting history and interaction summaries for an HCP.
    Set `show_on_ui` to False ONLY if the user explicitly asks to NOT update the UI, 
    or if they request the information strictly in the chat response.
    IMPORTANT: You must extract only the NAME of the doctor from the user's request. 
    Do not include titles like 'Dr.', 'Doctor', or 'Prof.'. 
    Example: If the user says 'Dr. Smith', you must pass 'Smith' to this tool.
    """
    print(f"🚨 AI TRIGGERED get_hcp_history FOR: {hcp_name} | UI_FLAG: {show_on_ui}")
    db = SessionLocal()
    try:
        hcp = db.query(HCP).filter(HCP.name.ilike(f"%{hcp_name}%")).first()
        if not hcp:
            return f"Error: Could not find {hcp_name}."
        
        interactions = db.query(Interaction).filter(Interaction.hcp_id == hcp.id).order_by(Interaction.interaction_date.desc()).limit(3).all()
        
        if not interactions:
            return f"No previous interactions found for {hcp.name}."
        
        history_list = []
        for i in interactions:
            history_list = []
        for i in interactions:
            history_list.append(
                f"- Date: {i.interaction_date.strftime('%Y-%m-%d')}\n"
                f"  Type: {i.interaction_type}\n"
                f"  Notes: {i.discussion_notes}\n"
                f"  Materials: {i.materials_shared}\n"
                f"  Samples: {i.samples_distributed}\n"
                f"  Sentiment: {i.sentiment}\n"
                f"  Outcomes: {i.outcomes}\n"
                f"  Follow-up: {i.follow_up}\n"
            )
        
        return "Previous Interactions:\n" + "\n".join(history_list)
    finally:
        db.close()