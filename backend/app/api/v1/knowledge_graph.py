from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.schemas.knowledge_graph import (
    KnowledgeGraphResponse,
    EntityCreate,
    RelationshipCreate,
    RuleCreate,
)
from app.services.knowledge_graph.service import kg_manager

router = APIRouter(prefix="/knowledge-graph", tags=["Knowledge Graph"])


def _kg(user: User):
    return kg_manager.get_service(user.tenant_id)


@router.get("/", response_model=KnowledgeGraphResponse)
async def get_knowledge_graph(current_user: User = Depends(get_current_user)):
    return _kg(current_user).get_graph()


@router.post("/entities")
async def add_entity(
    data: EntityCreate,
    current_user: User = Depends(require_role(["admin", "analyst"])),
):
    entity = _kg(current_user).add_entity(data.entity_type, data.entity)
    return {"message": "Entity added", "entity": entity}


@router.put("/entities/{entity_type}/{entity_id}")
async def update_entity(
    entity_type: str,
    entity_id: str,
    data: dict,
    current_user: User = Depends(require_role(["admin", "analyst"])),
):
    entity = _kg(current_user).update_entity(entity_type, entity_id, data)
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    return {"message": "Entity updated", "entity": entity}


@router.delete("/entities/{entity_type}/{entity_id}")
async def delete_entity(
    entity_type: str,
    entity_id: str,
    current_user: User = Depends(require_role(["admin", "analyst"])),
):
    success = _kg(current_user).delete_entity(entity_type, entity_id)
    if not success:
        raise HTTPException(status_code=404, detail="Entity not found")
    return {"message": "Entity deleted"}


@router.post("/relationships")
async def add_relationship(
    data: RelationshipCreate,
    current_user: User = Depends(require_role(["admin", "analyst"])),
):
    rel = _kg(current_user).add_relationship(data.model_dump())
    return {"message": "Relationship added", "relationship": rel}


@router.put("/relationships/{rel_id}")
async def update_relationship(
    rel_id: str,
    data: dict,
    current_user: User = Depends(require_role(["admin", "analyst"])),
):
    rel = _kg(current_user).update_relationship(rel_id, data)
    if not rel:
        raise HTTPException(status_code=404, detail="Relationship not found")
    return {"message": "Relationship updated", "relationship": rel}


@router.delete("/relationships/{rel_id}")
async def delete_relationship(
    rel_id: str,
    current_user: User = Depends(require_role(["admin", "analyst"])),
):
    success = _kg(current_user).delete_relationship(rel_id)
    if not success:
        raise HTTPException(status_code=404, detail="Relationship not found")
    return {"message": "Relationship deleted"}


@router.post("/rules")
async def add_rule(
    data: RuleCreate,
    current_user: User = Depends(require_role(["admin", "analyst"])),
):
    rule = _kg(current_user).add_rule(data.model_dump())
    return {"message": "Rule added", "rule": rule}


@router.put("/rules/{rule_id}")
async def update_rule(
    rule_id: str,
    data: dict,
    current_user: User = Depends(require_role(["admin", "analyst"])),
):
    rule = _kg(current_user).update_rule(rule_id, data)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"message": "Rule updated", "rule": rule}


@router.delete("/rules/{rule_id}")
async def delete_rule(
    rule_id: str,
    current_user: User = Depends(require_role(["admin", "analyst"])),
):
    success = _kg(current_user).delete_rule(rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"message": "Rule deleted"}


@router.get("/impact/{entity_id}")
async def get_impact_analysis(
    entity_id: str,
    current_user: User = Depends(get_current_user),
):
    impacts = _kg(current_user).analyze_impact(entity_id)
    return {"entity_id": entity_id, "impacts": impacts}
