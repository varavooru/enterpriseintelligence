from pydantic import BaseModel
from typing import Optional


class EntityBase(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    metadata: dict = {}


class BusinessUnit(EntityBase):
    department: Optional[str] = None
    head: Optional[str] = None
    employee_count: Optional[int] = None


class Regulation(EntityBase):
    domain: str = ""
    jurisdiction: str = "federal"
    status: str = "active"
    effective_date: Optional[str] = None
    source_url: Optional[str] = None
    agency: Optional[str] = None


class Product(EntityBase):
    category: Optional[str] = None


class Process(EntityBase):
    owner_bu: Optional[str] = None


class Policy(EntityBase):
    owner_bu: Optional[str] = None


class Relationship(BaseModel):
    id: str
    source: str
    target: str
    type: str  # impacts, requires, owns, produces, depends_on
    weight: float = 0.5
    context: Optional[str] = None
    metadata: dict = {}


class Rule(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    condition: str
    affected_entity_types: list[str] = []
    impact_level: str = "medium"  # low, medium, high, critical
    metadata: dict = {}


class KnowledgeGraphResponse(BaseModel):
    version: str
    metadata: dict
    entities: dict
    relationships: list[Relationship]
    rules: list[Rule]


class EntityCreate(BaseModel):
    entity_type: str  # business_units, regulations, products, processes, policies
    entity: dict


class RelationshipCreate(BaseModel):
    source: str
    target: str
    type: str
    weight: float = 0.5
    context: Optional[str] = None
    metadata: dict = {}


class RuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    condition: str
    affected_entity_types: list[str] = []
    impact_level: str = "medium"
    metadata: dict = {}
