from pydantic import BaseModel
from typing import Optional

class PipelineStageBase(BaseModel):
    name: str
    order_index: int
    color: str = "#E2E8F0"
    probability: int = 0
    branch_id: int

class PipelineStageCreate(PipelineStageBase):
    pass

class PipelineStage(PipelineStageBase):
    id: int
    
    class Config:
        from_attributes = True
