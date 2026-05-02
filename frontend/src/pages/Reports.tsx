import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Report } from '../types';
import {
  Plus,
  FileText,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  RefreshCw,
} from 'lucide-react';

const REPORT_TYPES = [
  {
    value: 'regulatory_impact',
    label: 'Regulatory Impact Analysis',
    description: 'Analyze how regulatory changes impact your business',
  },
  {
    value: 'policy_analysis',
    label: 'Policy Analysis',
    description: 'Analyze internal or external policy changes',
  },
  {
    value: 'executive_summary',
    label: 'Executive Summary',
    description: 'High-level overview of key findings',
  },
  {
    value: 'custom',
    label: 'Custom Report',
    description: 'Custom analysis based on your parameters',
  },
];

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const loadReports = () => {
    api
      .getReports()
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this report?')) return;
    try {
      await api.deleteReport(id);
      if (selectedReport?.id === id) setSelectedReport(null);
      loadReports();
    } catch (err) {
      console.error(err);
    }
  };

  const refreshReport = async (id: number) => {
    try {
      const report = await api.getReport(id);
      setReports((prev) => prev.map((r) => (r.id === id ? report : r)));
      if (selectedReport?.id === id) setSelectedReport(report);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stripe-slate-900">
            Intelligence Reports
          </h1>
          <p className="text-sm text-stripe-slate-500 mt-1">
            Generate and manage enterprise intelligence reports
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Generate report
        </button>
      </div>

      {/* Split layout */}
      <div className="flex gap-6">
        {/* Report list */}
        <div className={`${selectedReport ? 'w-1/3' : 'w-full'} space-y-3`}>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-stripe-purple" />
            </div>
          ) : reports.length === 0 ? (
            <div className="card text-center py-16 px-6">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-stripe-slate-100 mb-4">
                <FileText className="h-6 w-6 text-stripe-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-stripe-slate-900 mb-2">
                No reports yet
              </h3>
              <p className="text-sm text-stripe-slate-500 mb-6 max-w-sm mx-auto">
                Generate your first intelligence report.
              </p>
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                Generate report
              </button>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`card p-4 cursor-pointer transition-all duration-150 ${
                  selectedReport?.id === report.id
                    ? 'ring-2 ring-stripe-purple border-stripe-purple/30'
                    : 'hover:border-stripe-slate-300 hover:shadow-stripe'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stripe-slate-900 truncate">
                        {report.title}
                      </h3>
                      <ReportStatusBadge status={report.status} />
                    </div>
                    <p className="text-sm text-stripe-slate-500 mt-1 capitalize">
                      {report.report_type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[13px] text-stripe-slate-400 mt-1">
                      {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    {report.status === 'generating' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          refreshReport(report.id);
                        }}
                        className="p-1.5 rounded-md hover:bg-stripe-slate-50 transition-colors"
                      >
                        <RefreshCw className="h-4 w-4 text-stripe-slate-400" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(report.id);
                      }}
                      className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Report detail */}
        {selectedReport && (
          <div className="flex-1 card p-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-stripe-slate-900">
                  {selectedReport.title}
                </h2>
                <p className="text-sm text-stripe-slate-500 capitalize mt-1">
                  {selectedReport.report_type.replace(/_/g, ' ')}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 rounded-md hover:bg-stripe-slate-50 transition-colors"
              >
                <X className="h-5 w-5 text-stripe-slate-400" />
              </button>
            </div>

            {selectedReport.status === 'generating' ? (
              <div className="text-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-stripe-purple mx-auto mb-4" />
                <p className="text-sm text-stripe-slate-500">
                  Generating report… This may take a few minutes.
                </p>
                <button
                  onClick={() => refreshReport(selectedReport.id)}
                  className="btn-secondary mt-4"
                >
                  Check status
                </button>
              </div>
            ) : selectedReport.status === 'error' ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-md text-sm border border-red-200">
                Report generation failed. Please try again.
              </div>
            ) : selectedReport.content ? (
              <div className="prose prose-sm max-w-none prose-slate">
                <div className="whitespace-pre-wrap text-sm text-stripe-slate-800 leading-relaxed">
                  {selectedReport.content}
                </div>
              </div>
            ) : (
              <p className="text-sm text-stripe-slate-400">No content available.</p>
            )}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateReportModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadReports();
          }}
        />
      )}
    </div>
  );
}

function ReportStatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: any; className: string }> = {
    pending: {
      icon: Clock,
      className: 'bg-stripe-slate-50 text-stripe-slate-600 border-stripe-slate-200',
    },
    generating: {
      icon: Loader2,
      className: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    completed: {
      icon: CheckCircle,
      className: 'bg-green-50 text-green-700 border-green-200',
    },
    error: {
      icon: AlertCircle,
      className: 'bg-red-50 text-red-700 border-red-200',
    },
  };

  const { icon: Icon, className } = config[status] || config.pending;

  return (
    <span className={`badge border ${className}`}>
      <Icon className={`h-3 w-3 ${status === 'generating' ? 'animate-spin' : ''}`} />
      {status}
    </span>
  );
}

function CreateReportModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState('regulatory_impact');
  const [topic, setTopic] = useState('');
  const [scope, setScope] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError('');
    try {
      await api.createReport({
        title,
        report_type: reportType,
        parameters: { topic, scope },
      });
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-stripe border border-stripe-slate-200 w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stripe-slate-200">
          <h2 className="text-lg font-semibold text-stripe-slate-900">Generate report</h2>
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
            <label className="label">Report title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="e.g., Q1 2026 Regulatory Impact Analysis"
            />
          </div>

          <div>
            <label className="label">Report type</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {REPORT_TYPES.map((rt) => (
                <button
                  key={rt.value}
                  onClick={() => setReportType(rt.value)}
                  className={`text-left p-3 rounded-md border transition-all duration-150 ${
                    reportType === rt.value
                      ? 'border-stripe-purple bg-stripe-purple/5 ring-1 ring-stripe-purple/20'
                      : 'border-stripe-slate-200 hover:border-stripe-slate-300 hover:shadow-stripe-sm'
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      reportType === rt.value
                        ? 'text-stripe-purple'
                        : 'text-stripe-slate-800'
                    }`}
                  >
                    {rt.label}
                  </p>
                  <p className="text-[13px] text-stripe-slate-500 mt-0.5">
                    {rt.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Topic / Focus area</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="input-field h-24 resize-none"
              placeholder="Describe what this report should cover…"
            />
          </div>

          <div>
            <label className="label">Scope (optional)</label>
            <input
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="input-field"
              placeholder="e.g., All business units, Lending only, etc."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-stripe-slate-200">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="btn-primary"
          >
            {saving ? 'Creating…' : 'Generate report'}
          </button>
        </div>
      </div>
    </div>
  );
}
