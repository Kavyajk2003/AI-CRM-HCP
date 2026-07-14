# AI-First CRM -- HCP Module (Log Interaction Screen)

## Project Goal

Build an AI-first Customer Relationship Management (CRM) module for
Healthcare Professionals (HCPs). The application enables Medical
Representatives (MRs) to log and manage doctor interactions using an AI
Assistant powered by **LangGraph** and **Groq LLM**, instead of manually
filling forms.

------------------------------------------------------------------------

# Tech Stack

## Frontend

-   React
-   Redux
-   Google Inter Font

## Backend

-   Python
-   FastAPI

## AI

-   LangGraph (Mandatory)
-   Groq API
    -   Primary Model: `gemma2-9b-it`
    -   Optional: `llama-3.3-70b-versatile`

## Database

-   PostgreSQL (preferred) or MySQL

------------------------------------------------------------------------

# Core Concept

The application contains a split-screen interface.

## Left Panel

Structured Interaction Form.

Example fields: - HCP Name - Interaction Type - Date - Time -
Attendees - Topics Discussed - Materials Shared - Samples Distributed -
HCP Sentiment - Outcomes - Follow-up Actions - AI Generated Summary

## Right Panel

AI Assistant Chat.

Users communicate naturally with the AI.

Example:

> Today I met Dr. Smith. We discussed Product X. The doctor was
> interested. I shared brochures and scheduled a follow-up next week.

The AI should automatically extract all relevant information and
populate the form.

------------------------------------------------------------------------

# Critical Requirement

**The left-side form must never be filled manually.**

All creation and modification of interaction data must happen through
the AI Assistant using LangGraph tools.

------------------------------------------------------------------------

# LangGraph Agent Responsibilities

The LangGraph agent should:

1.  Understand user intent.
2.  Decide which tool to execute.
3.  Invoke the appropriate tool.
4.  Use the Groq LLM for reasoning, extraction, and summarization.
5.  Read/write data from the database.
6.  Return structured responses to update the React UI.

Workflow:

User → React Chat → FastAPI → LangGraph Agent → Tool → Groq LLM →
Database → UI Update

------------------------------------------------------------------------

# LangGraph Tools

## Mandatory Tool 1 --- Log Interaction

Purpose: Create a new interaction using natural language.

Capabilities: - Extract HCP name - Extract interaction date/time -
Extract interaction type - Extract discussion topics - Detect
sentiment - Detect materials shared - Detect samples distributed -
Extract follow-up actions - Generate structured JSON - Save
interaction - Update UI automatically

Example:

User: \> Today I met Dr. Smith. We discussed Product X. The sentiment
was positive. I shared brochures.

Expected Output: - HCP Name: Dr. Smith - Date: Today - Discussion:
Product X - Sentiment: Positive - Materials Shared: Brochures

------------------------------------------------------------------------

## Mandatory Tool 2 --- Edit Interaction

Purpose: Modify an existing interaction using conversational commands.

Example:

> The doctor's name should be Dr. John and the sentiment should be
> negative.

Only the specified fields should change.

------------------------------------------------------------------------

## Tool 3 --- Previous Interaction History

Purpose: Retrieve previous meetings for an HCP.

Example Prompt:

> Show Dr. Smith's previous interactions.

Output: - Previous meeting dates - Discussion summaries - Products
discussed - Previous follow-up actions

------------------------------------------------------------------------

## Tool 4 --- AI Suggested Next Best Action

Purpose: Recommend the next action after analyzing the latest
interaction.

Possible Suggestions: - Schedule follow-up - Share brochure - Send
clinical trial documents - Arrange product demonstration - Provide
medicine samples

------------------------------------------------------------------------

## Tool 5 --- Generate Meeting Summary

Purpose: Generate a concise professional CRM summary.

Example:

Input: \> Doctor expressed positive interest in Product X and requested
more clinical evidence.

Output:

> Dr. Smith showed positive interest in Product X and requested
> additional clinical trial evidence. A follow-up visit is recommended
> next week.

------------------------------------------------------------------------

# Optional Enhancements

## Product Information Tool

Provides product details including: - Indications - Benefits - Dosage -
Contraindications - Clinical evidence

------------------------------------------------------------------------

## Email / Follow-up Draft Generator

Generates a professional follow-up email based on the interaction.

------------------------------------------------------------------------

## Voice Note Transcription Tool

Allows users to upload or record voice notes.

AI should: - Transcribe audio - Extract entities - Populate the
interaction form automatically

------------------------------------------------------------------------

# AI Capabilities

The LLM should perform:

-   Natural Language Understanding
-   Entity Extraction
-   Information Extraction
-   Meeting Summarization
-   Sentiment Analysis
-   Structured JSON Generation

------------------------------------------------------------------------

# Suggested Database Schema

## HCP

-   id
-   name
-   specialization
-   hospital

## Interaction

-   id
-   hcp_id
-   interaction_date
-   interaction_type
-   discussion_notes
-   materials_shared
-   samples_distributed
-   sentiment
-   outcomes
-   follow_up
-   summary
-   created_at

------------------------------------------------------------------------

# Suggested Backend Structure

backend/ - app/ - api/ - agents/ - tools/ - database/ - models/ -
schemas/ - services/ - main.py

------------------------------------------------------------------------

# Suggested Frontend Structure

frontend/ - src/ - components/ - pages/ - redux/ - services/ - hooks/ -
App.jsx

------------------------------------------------------------------------

# API Suggestions

POST /chat

POST /interactions

PUT /interactions/{id}

GET /interactions/{hcp_id}

GET /hcp

------------------------------------------------------------------------

# Redux State

Manage: - Chat messages - Current interaction - AI extracted fields -
Loading state - Error state - Interaction history

------------------------------------------------------------------------

# UI Requirements

-   Responsive split-screen layout
-   Modern healthcare dashboard
-   Inter font
-   AI Chat on the right
-   Auto-updating form on the left
-   Professional design

------------------------------------------------------------------------

# Deliverables

## GitHub Repository

Include: - Frontend - Backend - README - Environment variables
documentation - Setup instructions

## Demo Video (10--15 Minutes)

Show: - Frontend walkthrough - LangGraph agent - All five tools -
FastAPI APIs - Groq integration - Project architecture - End-to-end demo

------------------------------------------------------------------------

# Success Criteria

The project should demonstrate:

-   Proper use of React + Redux
-   FastAPI backend
-   LangGraph agent orchestration
-   Groq LLM integration
-   AI-controlled interaction logging
-   Automatic form updates
-   At least five LangGraph tools
-   Clean architecture
-   Well-documented code
-   Production-quality UI

This project should behave like an AI Copilot for pharmaceutical Medical
Representatives, where AI is the primary interface and the structured
CRM form is automatically generated and maintained through intelligent
conversational interactions.
