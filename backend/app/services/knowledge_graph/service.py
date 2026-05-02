import json
import uuid
from pathlib import Path
from datetime import datetime, timezone
from threading import Lock
from app.core.config import settings


class KnowledgeGraphService:
    """Per-tenant knowledge graph stored as a JSON file."""

    def __init__(self, tenant_id: int):
        self.tenant_id = tenant_id
        self._graph = {}
        self._lock = Lock()
        self._file_path = (
            Path(settings.LOCAL_STORAGE_PATH)
            / "knowledge_graph"
            / f"tenant_{tenant_id}"
            / "enterprise_kg.json"
        )

    def load(self):
        if self._file_path.exists():
            with open(self._file_path, "r") as f:
                self._graph = json.load(f)
        else:
            self._graph = {
                "version": "1.0",
                "metadata": {
                    "name": "Enterprise Knowledge Graph",
                    "description": "Tribal and institutional knowledge",
                    "tenant_id": self.tenant_id,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                },
                "entities": {
                    "business_units": [],
                    "regulations": [],
                    "products": [],
                    "processes": [],
                    "policies": [],
                },
                "relationships": [],
                "rules": [],
            }
            self._save()

    def _save(self):
        self._graph["metadata"]["updated_at"] = datetime.now(timezone.utc).isoformat()
        self._file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self._file_path, "w") as f:
            json.dump(self._graph, f, indent=2, default=str)

    def get_graph(self) -> dict:
        return self._graph

    def add_entity(self, entity_type: str, entity: dict) -> dict:
        with self._lock:
            if entity_type not in self._graph["entities"]:
                self._graph["entities"][entity_type] = []
            if "id" not in entity:
                entity["id"] = f"{entity_type[:3]}_{uuid.uuid4().hex[:8]}"
            self._graph["entities"][entity_type].append(entity)
            self._save()
            return entity

    def update_entity(self, entity_type: str, entity_id: str, data: dict) -> dict | None:
        with self._lock:
            entities = self._graph["entities"].get(entity_type, [])
            for i, e in enumerate(entities):
                if e["id"] == entity_id:
                    entities[i].update(data)
                    entities[i]["id"] = entity_id
                    self._save()
                    return entities[i]
            return None

    def delete_entity(self, entity_type: str, entity_id: str) -> bool:
        with self._lock:
            entities = self._graph["entities"].get(entity_type, [])
            original_len = len(entities)
            self._graph["entities"][entity_type] = [e for e in entities if e["id"] != entity_id]
            self._graph["relationships"] = [
                r for r in self._graph["relationships"]
                if r["source"] != entity_id and r["target"] != entity_id
            ]
            if len(self._graph["entities"][entity_type]) < original_len:
                self._save()
                return True
            return False

    def add_relationship(self, rel: dict) -> dict:
        with self._lock:
            if "id" not in rel:
                rel["id"] = f"rel_{uuid.uuid4().hex[:8]}"
            self._graph["relationships"].append(rel)
            self._save()
            return rel

    def update_relationship(self, rel_id: str, data: dict) -> dict | None:
        with self._lock:
            for i, r in enumerate(self._graph["relationships"]):
                if r["id"] == rel_id:
                    self._graph["relationships"][i].update(data)
                    self._graph["relationships"][i]["id"] = rel_id
                    self._save()
                    return self._graph["relationships"][i]
            return None

    def delete_relationship(self, rel_id: str) -> bool:
        with self._lock:
            original_len = len(self._graph["relationships"])
            self._graph["relationships"] = [
                r for r in self._graph["relationships"] if r["id"] != rel_id
            ]
            if len(self._graph["relationships"]) < original_len:
                self._save()
                return True
            return False

    def add_rule(self, rule: dict) -> dict:
        with self._lock:
            if "id" not in rule:
                rule["id"] = f"rule_{uuid.uuid4().hex[:8]}"
            self._graph["rules"].append(rule)
            self._save()
            return rule

    def update_rule(self, rule_id: str, data: dict) -> dict | None:
        with self._lock:
            for i, r in enumerate(self._graph["rules"]):
                if r["id"] == rule_id:
                    self._graph["rules"][i].update(data)
                    self._graph["rules"][i]["id"] = rule_id
                    self._save()
                    return self._graph["rules"][i]
            return None

    def delete_rule(self, rule_id: str) -> bool:
        with self._lock:
            original_len = len(self._graph["rules"])
            self._graph["rules"] = [r for r in self._graph["rules"] if r["id"] != rule_id]
            if len(self._graph["rules"]) < original_len:
                self._save()
                return True
            return False

    def get_entity_by_id(self, entity_id: str) -> tuple[str, dict] | None:
        for entity_type, entities in self._graph["entities"].items():
            for entity in entities:
                if entity["id"] == entity_id:
                    return entity_type, entity
        return None

    def get_related_entities(self, entity_id: str) -> list[dict]:
        related = []
        for rel in self._graph["relationships"]:
            if rel["source"] == entity_id:
                target = self.get_entity_by_id(rel["target"])
                if target:
                    related.append({"relationship": rel, "entity_type": target[0], "entity": target[1], "direction": "outgoing"})
            elif rel["target"] == entity_id:
                source = self.get_entity_by_id(rel["source"])
                if source:
                    related.append({"relationship": rel, "entity_type": source[0], "entity": source[1], "direction": "incoming"})
        return related

    def analyze_impact(self, entity_id: str) -> list[dict]:
        impacts = []
        visited = set()
        self._traverse_impacts(entity_id, impacts, visited, depth=0, max_depth=3)
        return impacts

    def _traverse_impacts(self, entity_id: str, impacts: list, visited: set, depth: int, max_depth: int):
        if entity_id in visited or depth > max_depth:
            return
        visited.add(entity_id)
        for rel in self._graph["relationships"]:
            target_id = None
            if rel["source"] == entity_id:
                target_id = rel["target"]
            elif rel["target"] == entity_id:
                target_id = rel["source"]
            if target_id and target_id not in visited:
                target = self.get_entity_by_id(target_id)
                if target:
                    impacts.append({
                        "entity_id": target_id, "entity_type": target[0],
                        "entity_name": target[1].get("name", ""),
                        "relationship_type": rel["type"], "weight": rel.get("weight", 0.5), "depth": depth + 1,
                    })
                    self._traverse_impacts(target_id, impacts, visited, depth + 1, max_depth)

    def get_context_for_query(self, query: str) -> str:
        context_parts = ["=== Enterprise Knowledge Graph Context ==="]
        for entity_type, entities in self._graph["entities"].items():
            if entities:
                context_parts.append(f"\n--- {entity_type.replace('_', ' ').title()} ---")
                for entity in entities:
                    context_parts.append(f"- {entity.get('name', 'Unknown')}: {entity.get('description', 'No description')}")
        if self._graph["relationships"]:
            context_parts.append("\n--- Relationships ---")
            for rel in self._graph["relationships"]:
                source = self.get_entity_by_id(rel["source"])
                target = self.get_entity_by_id(rel["target"])
                if source and target:
                    context_parts.append(f"- {source[1].get('name', '?')} --[{rel['type']}]--> {target[1].get('name', '?')} (weight: {rel.get('weight', 0.5)})")
        if self._graph["rules"]:
            context_parts.append("\n--- Business Rules ---")
            for rule in self._graph["rules"]:
                context_parts.append(f"- {rule.get('name', 'Unknown')}: {rule.get('description', rule.get('condition', ''))} [Impact: {rule.get('impact_level', 'medium')}]")
        return "\n".join(context_parts)


class KnowledgeGraphManager:
    """Manages per-tenant KnowledgeGraphService instances."""

    def __init__(self):
        self._services: dict[int, KnowledgeGraphService] = {}
        self._lock = Lock()

    def get_service(self, tenant_id: int) -> KnowledgeGraphService:
        if tenant_id not in self._services:
            with self._lock:
                if tenant_id not in self._services:
                    svc = KnowledgeGraphService(tenant_id)
                    svc.load()
                    self._services[tenant_id] = svc
        return self._services[tenant_id]


kg_manager = KnowledgeGraphManager()
