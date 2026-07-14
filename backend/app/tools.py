from langchain_core.tools import tool
from app.database.connection import SessionLocal
from app.models import HCP, Interaction, Product
import os
from langchain_groq import ChatGroq

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
    CRITICAL EXTRACTION RULES:
    1. NAME: Extract only the name without titles (e.g., pass 'Kempi', not 'Dr. Kempi').
    2. INTERACTION TYPE: Infer the method of contact from the prompt (e.g., "Phone Call", "Video Meeting", "Email", "In-Person"). Default to "In-Person" if unclear.
    3. SAMPLES: If samples are requested or given, put ONLY that in `samples_distributed`.
    4. MATERIALS: If reports, documents, or brochures are shared, put that in `materials_shared`.
    5. DISCUSSION: Put the general meeting context here, but DO NOT include the samples or materials you already extracted.
    6. SUMMARY: Write a brief, 1-sentence professional summary of the meeting.
    """
    print(f"🚨 AI TRIGGERED log_interaction FOR: {hcp_name}")
    db = SessionLocal()
    try:
        hcp = db.query(HCP).filter(HCP.name.ilike(f"%{hcp_name}%")).first()
        
        # --- NEW LOGIC: Auto-create doctor if not found ---
        if not hcp:
            print(f"HCP '{hcp_name}' not found. Auto-creating new profile.")
            hcp = HCP(
                name=hcp_name,
                profession="Doctor",
                specialization="General", 
                hospital="Unknown"
            )
            db.add(hcp)
            db.commit()
            db.refresh(hcp)
        # --------------------------------------------------

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
        return f"Details added successfully. AI INSTRUCTION: Stop thinking. Do not call any more tools. Reply to the user with EXACTLY this phrase: 'The interaction with {hcp.name} has been successfully logged.' and nothing else."
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
    Mandatory Tool 2: Modify or ADD missing fields to the MOST RECENT interaction for a given HCP.
    CRITICAL TRIGGER: If the user provides a follow-up date, sentiment, or outcome for a doctor 
    they ALREADY mentioned in this conversation, you MUST use this tool. 
    Do NOT use log_interaction again, even if the user says "When I spoke with them today...".
    IMPORTANT: Extract only the NAME of the doctor (e.g., pass 'Shan', not 'Dr. Shan').
    Only pass the fields that need to be changed or added.
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
        return f"Details updated successfully. AI INSTRUCTION: Stop thinking. Do not call any more tools. Reply to the user with EXACTLY this phrase: 'The interaction with {hcp.name} has been successfully updated.' and nothing else."
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
        
        # --- FIXED BUG: Removed the accidental duplicate loop and list clear ---
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
        # -----------------------------------------------------------------------
        
        return "Previous Interactions:\n" + "\n".join(history_list)
    finally:
        db.close()

@tool
def get_next_best_action(hcp_name: str) -> str:
    """
    Tool 4: Analyzes the latest interaction for an HCP and recommends the Next Best Action.
    IMPORTANT: Extract only the NAME of the doctor (e.g., pass 'Shan', not 'Dr. Shan').
    Based on this medical interaction, choose exactly THREE (3) distinct next best actions from the list below.
        
        Discussion: {latest.discussion_notes}
        Sentiment: {latest.sentiment}
        Materials Shared: {latest.materials_shared}
        Follow-up: {latest.follow_up}
        
        Available Actions (pick 3):
        - Schedule follow-up
        - Share brochure
        - Send clinical trial data
        - Arrange demo
        - Provide samples
        - Schedule key opinion leader (KOL) meeting
        - Send treatment guidelines
        
        Output ONLY the 3 actions separated by a pipe character (|) and absolutely nothing else.
        Example: Schedule follow-up|Send clinical trial data|Provide samples
    """
    print(f"🚨 AI TRIGGERED get_next_best_action FOR: {hcp_name}")
    db = SessionLocal()
    try:
        hcp = db.query(HCP).filter(HCP.name.ilike(f"%{hcp_name}%")).first()
        if not hcp:
            return f"Error: Could not find {hcp_name}."

        latest = db.query(Interaction).filter(Interaction.hcp_id == hcp.id).order_by(Interaction.id.desc()).first()
        if not latest:
            return f"Error: No interactions exist yet for {hcp.name}."

        # Initialize a lightweight LLM specifically for the analysis
        llm = ChatGroq(
            api_key=os.getenv("GROQ_API_KEY"),
            model="llama-3.1-8b-instant",
            temperature=0
        )
        
        prompt = f"""
        You are a medical CRM assistant. Based on this medical interaction, you MUST choose EXACTLY THREE (3) distinct next best actions from the list below.
        
        Discussion: {latest.discussion_notes}
        Sentiment: {latest.sentiment}
        Materials Shared: {latest.materials_shared}
        Follow-up: {latest.follow_up}
        
        Available Actions (pick exactly 3):
        - Schedule follow-up
        - Share brochure
        - Send clinical trial data
        - Arrange demo
        - Provide samples
        - Schedule KOL meeting
        - Send treatment guidelines
        
        CRITICAL FORMATTING RULE: 
        You must output ONLY the 3 actions separated by a pipe character (|). Do not number them. Do not write introductory text.
        
        EXAMPLE OUTPUT:
        Schedule follow-up|Send clinical trial data|Provide samples
        
        YOUR OUTPUT:
        """
        
        response = llm.invoke(prompt)
        nba_result = response.content.replace("NBA:", "").strip()
        
        # --- PYTHON SAFETY NET ---
        # 1. Split the AI's response by the pipe
        actions = [a.strip() for a in nba_result.split('|') if a.strip()]
        
        # 2. If the AI was stubborn and provided fewer than 3, supplement with safe defaults
        default_actions = ["Schedule follow-up", "Send clinical trial data", "Share brochure"]
        while len(actions) < 3:
            for default in default_actions:
                if default not in actions:
                    actions.append(default)
                    if len(actions) == 3:
                        break
                        
        # 3. If the AI hallucinated and provided TOO MANY, cut it down to exactly 3
        actions = actions[:3]
        
        # Re-join with pipes to send back to main.py
        final_nba_string = "|".join(actions)
        
        return f"NBA:{final_nba_string}"
    finally:
        db.close()

@tool
def get_product_info(product_name: str) -> str:
    """
    Tool 5: Retrieve clinical and descriptive information about a specific product.
    
    CRITICAL SCHEMA RULE: You must ONLY pass the `product_name` argument (e.g., "Product X" or "Sample C"). 
    """
    print(f"🚨 AI TRIGGERED get_product_info FOR: {product_name}")
    db = SessionLocal()
    try:
        # Search using ilike for case-insensitive matching
        product = db.query(Product).filter(Product.name.ilike(f"%{product_name}%")).first()
        
        if not product:
            return f"Error: Product '{product_name}' not found in the knowledge base. AI INSTRUCTION: Tell the user you don't have information on this product and stop."

        # Return the formatted string and immediately stop the agent from looping
        return (
            f"PRODUCT FOUND:\n"
            f"- Name: {product.name}\n"
            f"- Details: {product.details}\n"
            f"- Indications: {product.indications}\n"
            f"- Benefits: {product.benefits}\n"
            f"- Dosage: {product.dosage}\n"
            f"- Clinical Evidence: {product.clinical_evidence}\n\n"
            f"AI INSTRUCTION: Stop thinking. Do not call any other tools. Format this data beautifully using Markdown (bolding, bullet points) and output it directly to the user in the chat."
        )
    finally:
        db.close()

@tool
def generate_follow_up_email(hcp_name: str) -> str:
    """
    Tool 6: Generates a professional follow-up email draft for a specific HCP based on their latest interaction.
    
    CRITICAL SCHEMA RULE: You must ONLY pass the `hcp_name` argument (e.g., "Kei").
    """
    print(f"🚨 AI TRIGGERED generate_follow_up_email FOR: {hcp_name}")
    db = SessionLocal()
    try:
        # 1. Verify Doctor
        hcp = db.query(HCP).filter(HCP.name.ilike(f"%{hcp_name}%")).first()
        if not hcp:
            return f"Error: Could not find {hcp_name}. Tell the user the doctor doesn't exist."

        # 2. Fetch Latest Interaction
        latest = db.query(Interaction).filter(Interaction.hcp_id == hcp.id).order_by(Interaction.id.desc()).first()
        if not latest:
            return f"Error: No interactions exist yet for {hcp.name}. Cannot draft an email."

        # 3. Use Tool 4 Internally to get Next Best Actions
        try:
            nba_raw = get_next_best_action.invoke({"hcp_name": hcp.name})
            # Convert "NBA:Action 1|Action 2" into "Action 1, Action 2"
            nbas = nba_raw.replace("NBA:", "").replace("|", ", ")
        except Exception as e:
            nbas = "Schedule follow-up" # Fallback if Tool 4 fails internally

        # 4. Generate the Email Draft using a new LLM call
        llm = ChatGroq(
            api_key=os.getenv("GROQ_API_KEY"),
            model="llama-3.1-8b-instant",
            temperature=0.4 # A bit of temperature for natural writing
        )
        
        date_str = latest.interaction_date.strftime('%B %d, %Y') if latest.interaction_date else 'recently'
        
        prompt = f"""
        You are a professional Medical Representative writing a follow-up email to Dr. {hcp.name}.
        
        Context of your latest meeting on {date_str}:
        - Discussion Notes: {latest.discussion_notes}
        - Sentiment: {latest.sentiment}
        - Materials/Reports Shared: {latest.materials_shared}
        - Samples Provided: {latest.samples_distributed}
        - Agreed Follow-up: {latest.follow_up}
        
        The AI system suggested these next best actions: {nbas}.
        Incorporate relevant next steps naturally into the email (e.g., offering to schedule the demo or send the data).
        
        CRITICAL FORMATTING RULES:
        - Use Markdown. 
        - Start with "**Subject:** [Your Subject Line]"
        - Use a professional medical greeting and sign-off.
        - Do not include brackets like [Your Name] unless absolutely necessary.
        
        Output ONLY the email draft, nothing else.
        """
        
        response = llm.invoke(prompt)
        email_draft = response.content.strip()
        
        # 5. Return with strict instructions to halt the loop
        return (
            f"EMAIL DRAFT GENERATED:\n\n{email_draft}\n\n"
            f"AI INSTRUCTION: Stop thinking. Do not call any other tools. Output this email draft beautifully formatted in Markdown directly to the user in the chat."
        )
    finally:
        db.close()