from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class HCPBase(BaseModel):
    name: str
    specialization: str
    hospital: str

class HCPCreate(HCPBase):
    pass

class HCPResponse(HCPBase):
    id: int
    class Config:
        orm_mode = True

class InteractionDraft(BaseModel):
    hcp_name: str = Field(description="Name of the Healthcare Professional")
    interaction_type: Optional[str] = Field(default="In-Person", description="Type of meeting")
    discussion_notes: Optional[str] = Field(default=None, description="Main topics discussed")
    materials_shared: Optional[str] = Field(default=None, description="Brochures, PDFs, or links shared")
    samples_distributed: Optional[str] = Field(default=None, description="Physical medicine samples given out")
    sentiment: Optional[str] = Field(default=None, description="HCP's reaction: Positive, Neutral, or Negative")
    outcomes: Optional[str] = Field(default=None, description="Results or conclusions of the meeting")
    follow_up: Optional[str] = Field(default=None, description="Next actions to take")
    summary: Optional[str] = Field(default=None, description="A brief professional CRM summary")