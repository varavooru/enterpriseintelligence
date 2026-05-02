import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import type { KnowledgeGraph as KGType, KGEntity } from '../types';
import {
  Plus,
  Trash2,
  GitBranch,
  Building2,
  Scale,
  Package,
  Workflow,
  FileCheck,
  X,
  Link as LinkIcon,
} from 'lucide-react';

const ENTITY_TYPES = [
  { key: 'business_units', label: 'Business Units', icon: Building2, color: 'blue' },
  { key: 'regulations', label: 'Regulations', icon: Scale, color: 'red' },
  { key: 'products', label: 'Products', icon: Package, color: 'green' },
  { key: 'processes', label: 'Processes', icon: Workflow, color: 'purple' },
  { key: 'policies', label: 'Policies', icon: FileCheck, color: 'orange' },
];

const RELATIONSHIP_TYPES = [
  'impacts',
  'requires',
  'owns',
  'produces',
  'depends_on',
  'regulates',
  'applies_to',
];

export default function KnowledgeGraph() {
  const [graph, setGraph] = useState<KGType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'entities' | 'relationships' | 'rules' | 'visual'>('entities');
  const [selectedEntityType, setSelectedEntityType] = useState('business_units');
  const [showAddEntity, setShowAddEntity] = useState(false);
  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);

  const loadGraph = useCallback(() => {
    api.getKnowledgeGraph().then(setGraph).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadGraph(); }, [loadGraph]);

  if (loading || !graph) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-stripe-slate-200 border-t-stripe-purple" />
      </div>
    );
  }

  const allEntities: { type: string; entity: KGEntity }[] = [];
  for (const [type, entities] of Object.entries(graph.entities)) {
    for (const entity of entities) {
      allEntities.push({ type, entity });
    }
  }

  const tabs = ['entities', 'relationships', 'rules', 'visual'] as const;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-2">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-stripe-slate-800">
          Knowledge Graph
        </h1>
        <p className="mt-1 text-sm text-stripe-slate-500">
          Manage tribal knowledge, business entities, and relationships.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-stripe-slate-100 p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? 'bg-white text-stripe-slate-800 shadow-stripe-sm'
                : 'text-stripe-slate-500 hover:text-stripe-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Entities Tab */}
      {activeTab === 'entities' && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex gap-1 rounded-lg bg-stripe-slate-100 p-1">
              {ENTITY_TYPES.map((et) => (
                <button
                  key={et.key}
                  onClick={() => setSelectedEntityType(et.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    selectedEntityType === et.key
                      ? 'bg-white text-stripe-slate-800 shadow-stripe-sm'
                      : 'text-stripe-slate-500 hover:text-stripe-slate-700'
                  }`}
                >
                  <et.icon className="h-3.5 w-3.5" />
                  {et.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowAddEntity(true)} className="btn-primary ml-auto">
              <Plus className="h-4 w-4" /> Add Entity
            </button>
          </div>

          <div className="grid gap-3">
            {(graph.entities[selectedEntityType] || []).map((entity) => (
              <div key={entity.id} className="card flex items-start gap-4 p-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-stripe-slate-800">{entity.name}</h3>
                    <span className="text-[13px] font-mono text-stripe-slate-400">{entity.id}</span>
                  </div>
                  {entity.description && (
                    <p className="mt-1 text-sm text-stripe-slate-500">{entity.description}</p>
                  )}
                  {entity.metadata && Object.keys(entity.metadata).length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {Object.entries(entity.metadata).map(([k, v]) =>
                        v ? (
                          <span key={k} className="badge bg-stripe-slate-100 text-stripe-slate-600">
                            {k}: {String(v)}
                          </span>
                        ) : null,
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={async () => {
                    if (confirm(`Delete "${entity.name}"?`)) {
                      await api.deleteEntity(selectedEntityType, entity.id);
                      loadGraph();
                    }
                  }}
                  className="rounded-md p-1.5 text-stripe-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {(graph.entities[selectedEntityType] || []).length === 0 && (
              <div className="card py-12 text-center text-sm text-stripe-slate-400">
                No {selectedEntityType.replace(/_/g, ' ')} defined yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Relationships Tab */}
      {activeTab === 'relationships' && (
        <div className="space-y-5">
          <div className="flex justify-end">
            <button onClick={() => setShowAddRelationship(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Add Relationship
            </button>
          </div>
          <div className="grid gap-3">
            {graph.relationships.map((rel) => {
              const sourceEntity = allEntities.find((e) => e.entity.id === rel.source);
              const targetEntity = allEntities.find((e) => e.entity.id === rel.target);
              return (
                <div key={rel.id} className="card flex items-center gap-4 p-5">
                  <div className="flex flex-1 items-center gap-3 min-w-0">
                    <span className="text-sm font-medium text-stripe-slate-800">
                      {sourceEntity?.entity.name || rel.source}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-stripe-purple/5 px-2.5 py-0.5 text-xs font-medium text-stripe-purple">
                      <LinkIcon className="h-3 w-3" /> {rel.type}
                    </span>
                    <span className="text-sm font-medium text-stripe-slate-800">
                      {targetEntity?.entity.name || rel.target}
                    </span>
                    <span className="ml-2 text-[13px] text-stripe-slate-400">
                      weight: {rel.weight}
                    </span>
                  </div>
                  {rel.context && (
                    <p className="text-[13px] text-stripe-slate-500">{rel.context}</p>
                  )}
                  <button
                    onClick={async () => {
                      if (confirm('Delete this relationship?')) {
                        await api.deleteRelationship(rel.id);
                        loadGraph();
                      }
                    }}
                    className="rounded-md p-1.5 text-stripe-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
            {graph.relationships.length === 0 && (
              <div className="card py-12 text-center text-sm text-stripe-slate-400">
                No relationships defined yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-5">
          <div className="flex justify-end">
            <button onClick={() => setShowAddRule(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Add Rule
            </button>
          </div>
          <div className="grid gap-3">
            {graph.rules.map((rule) => (
              <div key={rule.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-stripe-slate-800">{rule.name}</h3>
                    {rule.description && (
                      <p className="mt-1 text-sm text-stripe-slate-500">{rule.description}</p>
                    )}
                    <div className="mt-3 flex items-center gap-3">
                      <code className="rounded bg-stripe-slate-100 px-2 py-0.5 text-xs text-stripe-slate-600">
                        {rule.condition}
                      </code>
                      <span
                        className={`badge ${
                          rule.impact_level === 'critical'
                            ? 'bg-red-50 text-red-700'
                            : rule.impact_level === 'high'
                              ? 'bg-orange-50 text-orange-700'
                              : rule.impact_level === 'medium'
                                ? 'bg-yellow-50 text-yellow-700'
                                : 'bg-green-50 text-green-700'
                        }`}
                      >
                        {rule.impact_level}
                      </span>
                    </div>
                    {rule.affected_entity_types.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {rule.affected_entity_types.map((t) => (
                          <span
                            key={t}
                            className="badge bg-stripe-purple/5 text-stripe-purple"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm(`Delete rule "${rule.name}"?`)) {
                        await api.deleteRule(rule.id);
                        loadGraph();
                      }
                    }}
                    className="ml-4 rounded-md p-1.5 text-stripe-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {graph.rules.length === 0 && (
              <div className="card py-12 text-center text-sm text-stripe-slate-400">
                No rules defined yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visual Tab */}
      {activeTab === 'visual' && <VisualGraph graph={graph} />}

      {/* Modals */}
      {showAddEntity && (
        <AddEntityModal
          entityType={selectedEntityType}
          onClose={() => setShowAddEntity(false)}
          onSaved={() => { setShowAddEntity(false); loadGraph(); }}
        />
      )}
      {showAddRelationship && (
        <AddRelationshipModal
          allEntities={allEntities}
          onClose={() => setShowAddRelationship(false)}
          onSaved={() => { setShowAddRelationship(false); loadGraph(); }}
        />
      )}
      {showAddRule && (
        <AddRuleModal
          onClose={() => setShowAddRule(false)}
          onSaved={() => { setShowAddRule(false); loadGraph(); }}
        />
      )}
    </div>
  );
}

/* ---------- Visual Graph ---------- */

const COLOR_MAP: Record<string, string> = {
  business_units: '#3b82f6',
  regulations: '#ef4444',
  products: '#22c55e',
  processes: '#a855f7',
  policies: '#f97316',
};

function VisualGraph({ graph }: { graph: KGType }) {
  const allEntities: { type: string; entity: KGEntity }[] = [];
  for (const [type, entities] of Object.entries(graph.entities)) {
    for (const entity of entities) allEntities.push({ type, entity });
  }

  const nodeRadius = 30;
  const width = 800;
  const height = 500;
  const cx = width / 2;
  const cy = height / 2;

  const nodePositions: Record<string, { x: number; y: number }> = {};
  allEntities.forEach((item, i) => {
    const angle = (2 * Math.PI * i) / allEntities.length;
    const radius = Math.min(width, height) * 0.35;
    nodePositions[item.entity.id] = {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });

  return (
    <div className="card p-6">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-stripe-slate-800">
        <GitBranch className="h-4 w-4 text-stripe-purple" />
        Visual Knowledge Graph
      </h3>

      <div className="mb-4 flex gap-5">
        {ENTITY_TYPES.map((et) => (
          <div key={et.key} className="flex items-center gap-2 text-[13px] text-stripe-slate-600">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLOR_MAP[et.key] }} />
            {et.label}
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full rounded-lg border border-stripe-slate-200 bg-stripe-slate-50"
      >
        {graph.relationships.map((rel) => {
          const from = nodePositions[rel.source];
          const to = nodePositions[rel.target];
          if (!from || !to) return null;
          return (
            <g key={rel.id}>
              <line
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke="#94a3b8" strokeWidth={1.5}
                strokeDasharray={rel.type === 'impacts' ? '' : '4'}
              />
              <text
                x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 6}
                textAnchor="middle"
                className="fill-stripe-slate-400 text-[10px]"
              >
                {rel.type}
              </text>
            </g>
          );
        })}
        {allEntities.map((item) => {
          const pos = nodePositions[item.entity.id];
          return (
            <g key={item.entity.id}>
              <circle cx={pos.x} cy={pos.y} r={nodeRadius} fill={COLOR_MAP[item.type] || '#6b7280'} opacity={0.9} />
              <text
                x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle"
                className="fill-white text-[11px] font-medium" style={{ pointerEvents: 'none' }}
              >
                {item.entity.name.length > 10 ? item.entity.name.slice(0, 9) + '…' : item.entity.name}
              </text>
              <text
                x={pos.x} y={pos.y + nodeRadius + 14}
                textAnchor="middle" className="fill-stripe-slate-500 text-[10px]"
              >
                {item.entity.name}
              </text>
            </g>
          );
        })}
        {allEntities.length === 0 && (
          <text x={cx} y={cy} textAnchor="middle" className="fill-stripe-slate-400 text-sm">
            Add entities to visualize the knowledge graph
          </text>
        )}
      </svg>
    </div>
  );
}

/* ---------- Modal wrapper ---------- */

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-md p-6 shadow-stripe">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stripe-slate-800">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-stripe-slate-400 hover:bg-stripe-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- Add Entity ---------- */

function AddEntityModal({
  entityType,
  onClose,
  onSaved,
}: {
  entityType: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.addEntity(entityType, { name, description });
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const prettyType = entityType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .slice(0, -1);

  return (
    <Modal title={`Add ${prettyType}`} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Entity name" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field h-24" placeholder="Optional description" />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={handleSave} disabled={saving || !name.trim()} className="btn-primary">
          {saving ? 'Saving…' : 'Add Entity'}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- Add Relationship ---------- */

function AddRelationshipModal({
  allEntities,
  onClose,
  onSaved,
}: {
  allEntities: { type: string; entity: KGEntity }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [type, setType] = useState('impacts');
  const [weight, setWeight] = useState('0.5');
  const [context, setContext] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!source || !target) return;
    setSaving(true);
    try {
      await api.addRelationship({ source, target, type, weight: parseFloat(weight), context });
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add Relationship" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Source Entity</label>
          <select value={source} onChange={(e) => setSource(e.target.value)} className="input-field">
            <option value="">Select source…</option>
            {allEntities.map((e) => (
              <option key={e.entity.id} value={e.entity.id}>
                {e.entity.name} ({e.type})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Relationship Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
            {RELATIONSHIP_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Target Entity</label>
          <select value={target} onChange={(e) => setTarget(e.target.value)} className="input-field">
            <option value="">Select target…</option>
            {allEntities.map((e) => (
              <option key={e.entity.id} value={e.entity.id}>
                {e.entity.name} ({e.type})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Weight (0.0 – 1.0)</label>
          <input
            type="number" min="0" max="1" step="0.1"
            value={weight} onChange={(e) => setWeight(e.target.value)} className="input-field"
          />
        </div>
        <div>
          <label className="label">Context</label>
          <input value={context} onChange={(e) => setContext(e.target.value)} className="input-field" placeholder="Describe the relationship" />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={handleSave} disabled={saving || !source || !target} className="btn-primary">
          {saving ? 'Saving…' : 'Add Relationship'}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- Add Rule ---------- */

function AddRuleModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('');
  const [impactLevel, setImpactLevel] = useState('medium');
  const [affectedTypes, setAffectedTypes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !condition.trim()) return;
    setSaving(true);
    try {
      await api.addRule({ name, description, condition, impact_level: impactLevel, affected_entity_types: affectedTypes });
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add Business Rule" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Rule Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="e.g., Financial Regulation Impact Rule" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field h-20" placeholder="Describe when and how this rule applies" />
        </div>
        <div>
          <label className="label">Condition</label>
          <input value={condition} onChange={(e) => setCondition(e.target.value)} className="input-field font-mono text-xs" placeholder="regulation.domain == 'financial'" />
        </div>
        <div>
          <label className="label">Impact Level</label>
          <select value={impactLevel} onChange={(e) => setImpactLevel(e.target.value)} className="input-field">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="label">Affected Entity Types</label>
          <div className="flex flex-wrap gap-2">
            {ENTITY_TYPES.map((et) => (
              <label key={et.key} className="flex items-center gap-1.5 text-sm text-stripe-slate-600">
                <input
                  type="checkbox"
                  checked={affectedTypes.includes(et.key)}
                  onChange={(e) => {
                    if (e.target.checked) setAffectedTypes([...affectedTypes, et.key]);
                    else setAffectedTypes(affectedTypes.filter((t) => t !== et.key));
                  }}
                  className="rounded border-stripe-slate-300 text-stripe-purple focus:ring-stripe-purple/20"
                />
                {et.label}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={handleSave} disabled={saving || !name.trim() || !condition.trim()} className="btn-primary">
          {saving ? 'Saving…' : 'Add Rule'}
        </button>
      </div>
    </Modal>
  );
}
