import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { DataSource } from '../types';
import {
  Plus,
  Database,
  Globe,
  Server,
  FolderOpen,
  Play,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
} from 'lucide-react';

const SOURCE_TYPE_CONFIG: Record<
  string,
  {
    icon: any;
    label: string;
    fields: { key: string; label: string; type: string; placeholder: string }[];
  }
> = {
  filesystem: {
    icon: FolderOpen,
    label: 'File System / ADLS',
    fields: [
      { key: 'path', label: 'Directory Path', type: 'text', placeholder: '/path/to/documents or ADLS path' },
    ],
  },
  web_scraper: {
    icon: Globe,
    label: 'Web Scraper',
    fields: [
      { key: 'urls', label: 'URLs (one per line)', type: 'textarea', placeholder: 'https://regulations.gov/…\nhttps://news-source.com/…' },
      { key: 'selectors.content', label: 'Content CSS Selector (optional)', type: 'text', placeholder: 'article, .content, #main' },
    ],
  },
  api: {
    icon: Server,
    label: 'REST API',
    fields: [
      { key: 'base_url', label: 'Base URL', type: 'text', placeholder: 'https://api.example.com' },
      { key: 'endpoints', label: 'Endpoints (one per line)', type: 'textarea', placeholder: '/articles\n/regulations' },
      { key: 'headers', label: 'Headers (JSON)', type: 'textarea', placeholder: '{"Authorization": "Bearer …"}' },
      { key: 'data_path', label: 'Data Path', type: 'text', placeholder: 'results.items' },
      { key: 'title_field', label: 'Title Field', type: 'text', placeholder: 'title' },
      { key: 'content_field', label: 'Content Field', type: 'text', placeholder: 'content' },
    ],
  },
  database: {
    icon: Database,
    label: 'Database',
    fields: [
      { key: 'connection_string', label: 'Connection String', type: 'text', placeholder: 'postgresql://user:pass@host:5432/db' },
      { key: 'query', label: 'SQL Query', type: 'textarea', placeholder: 'SELECT title, content FROM documents WHERE …' },
      { key: 'title_column', label: 'Title Column', type: 'text', placeholder: 'title' },
      { key: 'content_column', label: 'Content Column', type: 'text', placeholder: 'content' },
    ],
  },
};

export default function DataSources() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const loadSources = () => {
    api
      .getDataSources()
      .then(setSources)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this data source?')) return;
    try {
      await api.deleteDataSource(id);
      loadSources();
    } catch (err) {
      console.error(err);
    }
  };

  const handleIngest = async (id: number) => {
    try {
      await api.triggerIngestion(id);
      loadSources();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stripe-slate-900">Data Sources</h1>
          <p className="text-sm text-stripe-slate-500 mt-1">
            Manage internal and external data connections
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Add source
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-stripe-purple" />
        </div>
      ) : sources.length === 0 ? (
        <div className="card text-center py-16 px-6">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-stripe-slate-100 mb-4">
            <Database className="h-6 w-6 text-stripe-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-stripe-slate-900 mb-2">
            No data sources configured
          </h3>
          <p className="text-sm text-stripe-slate-500 mb-6 max-w-sm mx-auto">
            Connect your first data source to start building intelligence.
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            Add your first data source
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {sources.map((ds) => {
            const typeConfig = SOURCE_TYPE_CONFIG[ds.source_type];
            const Icon = typeConfig?.icon || Database;
            return (
              <div key={ds.id} className="card p-5 flex items-start gap-4">
                <div className="flex-shrink-0 p-2.5 rounded-lg bg-stripe-purple/5 text-stripe-purple">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-stripe-slate-900">{ds.name}</h3>
                    <StatusBadge status={ds.status} />
                  </div>
                  {ds.description && (
                    <p className="text-sm text-stripe-slate-500 mt-1">{ds.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-[13px] text-stripe-slate-500">
                    <span className="capitalize">{ds.source_type.replace(/_/g, ' ')}</span>
                    <span>{ds.document_count} documents</span>
                    {ds.last_ingested_at && (
                      <span>
                        Last ingested: {new Date(ds.last_ingested_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {ds.error_message && (
                    <p className="text-sm text-red-600 mt-2">{ds.error_message}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleIngest(ds.id)}
                    className="p-2 rounded-md hover:bg-green-50 text-green-600 transition-colors"
                    title="Run ingestion"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ds.id)}
                    className="p-2 rounded-md hover:bg-red-50 text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateDataSourceModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadSources();
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ready: 'bg-green-50 text-green-700 border-green-200',
    configured: 'bg-stripe-slate-50 text-stripe-slate-600 border-stripe-slate-200',
    ingesting: 'bg-blue-50 text-blue-700 border-blue-200',
    error: 'bg-red-50 text-red-700 border-red-200',
  };

  const icons: Record<string, any> = {
    ready: CheckCircle,
    error: AlertCircle,
    ingesting: Loader2,
    configured: Settings,
  };

  const Icon = icons[status] || Settings;

  return (
    <span
      className={`badge border ${styles[status] || styles.configured}`}
    >
      <Icon className={`h-3 w-3 ${status === 'ingesting' ? 'animate-spin' : ''}`} />
      {status}
    </span>
  );
}

function CreateDataSourceModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState('filesystem');
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError('');

    try {
      const config: Record<string, any> = {};
      const fields = SOURCE_TYPE_CONFIG[sourceType]?.fields || [];
      for (const field of fields) {
        const value = configValues[field.key] || '';
        if (field.key === 'urls' || field.key === 'endpoints') {
          config[field.key] = value
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);
        } else if (field.key === 'headers') {
          try {
            config[field.key] = value ? JSON.parse(value) : {};
          } catch {
            config[field.key] = {};
          }
        } else if (field.key.includes('.')) {
          const parts = field.key.split('.');
          if (!config[parts[0]]) config[parts[0]] = {};
          config[parts[0]][parts[1]] = value;
        } else {
          config[field.key] = value;
        }
      }

      await api.createDataSource({ name, description, source_type: sourceType, config });
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const typeConfig = SOURCE_TYPE_CONFIG[sourceType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-stripe border border-stripe-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stripe-slate-200">
          <h2 className="text-lg font-semibold text-stripe-slate-900">Add data source</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-stripe-slate-50 transition-colors"
          >
            <X className="h-5 w-5 text-stripe-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="label">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="e.g., Federal Regulations"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="label">Source type</label>
            <select
              value={sourceType}
              onChange={(e) => {
                setSourceType(e.target.value);
                setConfigValues({});
              }}
              className="input-field"
            >
              {Object.entries(SOURCE_TYPE_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>

          {typeConfig?.fields.map((field) => (
            <div key={field.key}>
              <label className="label">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  value={configValues[field.key] || ''}
                  onChange={(e) =>
                    setConfigValues({ ...configValues, [field.key]: e.target.value })
                  }
                  className="input-field h-24 resize-none"
                  placeholder={field.placeholder}
                />
              ) : (
                <input
                  value={configValues[field.key] || ''}
                  onChange={(e) =>
                    setConfigValues({ ...configValues, [field.key]: e.target.value })
                  }
                  className="input-field"
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-stripe-slate-200">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !name.trim()} className="btn-primary">
            {saving ? 'Creating…' : 'Create data source'}
          </button>
        </div>
      </div>
    </div>
  );
}
