import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { ImpactAnalysisResponse, KnowledgeGraph as KGType } from '../types';
import {
  Zap,
  Loader2,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Info,
  Clock,
  ChevronRight,
} from 'lucide-react';

const IMPACT_STYLES: Record<string, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertTriangle },
  high:     { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: AlertCircle },
  medium:   { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Info },
  low:      { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle },
};

const EXAMPLE_QUERIES = [
  'New CFPB rules requiring open banking data sharing — impact on lending and compliance',
  'EU AI Act enforcement begins — impact on our AI-powered products and services',
  'Federal Reserve interest rate increase of 0.5% — impact across all business units',
  'New state-level data privacy legislation similar to CCPA — compliance implications',
];

export default function ImpactAnalysis() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImpactAnalysisResponse | null>(null);
  const [error, setError] = useState('');
  const [graph, setGraph] = useState<KGType | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState('');
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);

  useEffect(() => {
    api.getKnowledgeGraph().then(setGraph).catch(console.error);
  }, []);

  const handleAnalyze = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await api.analyzeImpact(
        query,
        selectedEntityType || undefined,
        selectedEntityIds.length > 0 ? selectedEntityIds : undefined,
      );
      setResult(response);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-2">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-stripe-slate-800">
          Impact Analysis
        </h1>
        <p className="mt-1 text-sm text-stripe-slate-500">
          Analyze how regulations, policies, and news affect your business.
        </p>
      </div>

      {/* Input Card */}
      <div className="card space-y-5 p-6">
        <div>
          <label className="label">Describe the change or event to analyze</label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field h-32"
            placeholder="e.g., The CFPB has proposed new rules requiring financial institutions to share consumer data with third-party providers under Section 1033 of the Dodd-Frank Act. How does this impact our operations?"
          />
        </div>

        {/* Entity scope filter */}
        {graph && (
          <div className="space-y-3">
            <label className="label">Scope (optional)</label>
            <p className="text-[13px] text-stripe-slate-500 -mt-1">
              Narrow the analysis to specific entity types or entities.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setSelectedEntityType(''); setSelectedEntityIds([]); }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  !selectedEntityType
                    ? 'bg-stripe-purple/10 text-stripe-purple'
                    : 'bg-stripe-slate-100 text-stripe-slate-500 hover:text-stripe-slate-700'
                }`}
              >
                All Entities
              </button>
              {Object.keys(graph.entities).map((type) =>
                graph.entities[type].length > 0 ? (
                  <button
                    key={type}
                    onClick={() => { setSelectedEntityType(type); setSelectedEntityIds([]); }}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-all ${
                      selectedEntityType === type
                        ? 'bg-stripe-purple/10 text-stripe-purple'
                        : 'bg-stripe-slate-100 text-stripe-slate-500 hover:text-stripe-slate-700'
                    }`}
                  >
                    {type.replace(/_/g, ' ')} ({graph.entities[type].length})
                  </button>
                ) : null,
              )}
            </div>

            {selectedEntityType && graph.entities[selectedEntityType] && (
              <div className="flex flex-wrap gap-2">
                {graph.entities[selectedEntityType].map((entity) => (
                  <label
                    key={entity.id}
                    className="flex items-center gap-1.5 rounded-md bg-stripe-slate-50 px-3 py-1.5 text-sm text-stripe-slate-600"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEntityIds.includes(entity.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedEntityIds([...selectedEntityIds, entity.id]);
                        else setSelectedEntityIds(selectedEntityIds.filter((id) => id !== entity.id));
                      }}
                      className="rounded border-stripe-slate-300 text-stripe-purple focus:ring-stripe-purple/20"
                    />
                    {entity.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <button onClick={handleAnalyze} disabled={loading || !query.trim()} className="btn-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {loading ? 'Analyzing…' : 'Run Impact Analysis'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="card p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-stripe-slate-800">
                Analysis Summary
              </h2>
              <span className="flex items-center gap-1 text-[13px] text-stripe-slate-400">
                <Clock className="h-3.5 w-3.5" />
                {(result.processing_time_ms / 1000).toFixed(1)}s
              </span>
            </div>
            <p className="text-sm leading-relaxed text-stripe-slate-600">
              {result.overall_summary}
            </p>
          </div>

          {/* Impact cards */}
          {result.impacts && result.impacts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-stripe-slate-800">
                Impact Details
                <span className="ml-2 text-[13px] font-normal text-stripe-slate-500">
                  {result.impacts.length} {result.impacts.length === 1 ? 'entity' : 'entities'} affected
                </span>
              </h2>

              {result.impacts.map((impact, i) => {
                const style = IMPACT_STYLES[impact.impact_level] || IMPACT_STYLES.medium;
                const Icon = style.icon;
                return (
                  <div key={i} className={`rounded-lg border p-5 ${style.bg} ${style.border}`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.text}`} />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className={`text-sm font-semibold ${style.text}`}>
                            {impact.entity_name}
                          </h3>
                          <span className="badge bg-white/60 text-xs capitalize">
                            {impact.entity_type.replace(/_/g, ' ')}
                          </span>
                          <span className={`text-xs font-medium ${style.text}`}>
                            Score: {(impact.impact_score * 100).toFixed(0)}%
                          </span>
                        </div>

                        <p className={`text-sm ${style.text}`}>{impact.summary}</p>

                        {impact.details && (
                          <p className={`mt-1 text-sm opacity-80 ${style.text}`}>
                            {impact.details}
                          </p>
                        )}

                        {impact.recommendations.length > 0 && (
                          <div className="mt-3">
                            <p className={`mb-1.5 text-xs font-medium ${style.text}`}>
                              Recommendations
                            </p>
                            <ul className="space-y-1">
                              {impact.recommendations.map((rec, j) => (
                                <li key={j} className={`flex items-start gap-1.5 text-sm ${style.text}`}>
                                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Example queries */}
      {!result && !loading && (
        <div className="card p-6">
          <h3 className="mb-4 text-sm font-semibold text-stripe-slate-800">
            Example Analyses
          </h3>
          <div className="grid gap-3">
            {EXAMPLE_QUERIES.map((example) => (
              <button
                key={example}
                onClick={() => setQuery(example)}
                className="group flex items-center gap-3 rounded-lg border border-stripe-slate-200 p-3.5 text-left text-sm text-stripe-slate-600 transition-all hover:border-stripe-purple/30 hover:shadow-stripe-sm"
              >
                <Zap className="h-4 w-4 shrink-0 text-stripe-slate-300 transition-colors group-hover:text-stripe-purple" />
                <span className="flex-1">{example}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
