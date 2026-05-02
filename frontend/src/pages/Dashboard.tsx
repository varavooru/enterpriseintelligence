import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { DashboardData } from '../types';
import {
  Database,
  FileText,
  MessageSquare,
  ClipboardList,
  GitBranch,
  ArrowRight,
  Zap,
  TrendingUp,
  Clock,
  Layers,
  Link2,
  ShieldCheck,
} from 'lucide-react';

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <Icon className="h-4 w-4 text-stripe-slate-400" />
      </div>
      <p className="text-2xl font-semibold tracking-tight text-stripe-slate-800">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function QuickActionLink({
  to,
  icon: Icon,
  title,
  description,
}: {
  to: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-lg border border-stripe-slate-100 p-4 transition-all hover:border-stripe-purple/30 hover:shadow-stripe-sm"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stripe-purple/5 text-stripe-purple transition-colors group-hover:bg-stripe-purple/10">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-stripe-slate-800">{title}</p>
        <p className="text-[13px] text-stripe-slate-500">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-stripe-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-stripe-purple" />
    </Link>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-stripe-slate-200 border-t-stripe-purple" />
      </div>
    );
  }

  const stats = data?.stats || {
    total_data_sources: 0,
    total_documents: 0,
    total_queries: 0,
    total_reports: 0,
  };

  const kg = data?.knowledge_graph || {
    total_entities: 0,
    total_relationships: 0,
    total_rules: 0,
    entity_types: {},
  };

  const entityTypeEntries = Object.entries(kg.entity_types);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-2">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-stripe-slate-800">
          Overview
        </h1>
        <p className="mt-1 text-sm text-stripe-slate-500">
          A snapshot of your enterprise intelligence platform.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Database}
          label="Data Sources"
          value={stats.total_data_sources}
        />
        <StatCard
          icon={FileText}
          label="Documents"
          value={stats.total_documents}
        />
        <StatCard
          icon={MessageSquare}
          label="Queries"
          value={stats.total_queries}
        />
        <StatCard
          icon={ClipboardList}
          label="Reports"
          value={stats.total_reports}
        />
      </div>

      {/* Middle row: Knowledge Graph + Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Knowledge Graph summary */}
        <div className="card p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-stripe-slate-800">
              <GitBranch className="h-4 w-4 text-stripe-purple" />
              Knowledge Graph
            </h2>
            <Link
              to="/knowledge-graph"
              className="flex items-center gap-1 text-[13px] font-medium text-stripe-purple transition-colors hover:text-stripe-purple/80"
            >
              Manage
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-stripe-slate-50 px-4 py-3 text-center">
              <p className="text-lg font-semibold text-stripe-slate-800">
                {kg.total_entities.toLocaleString()}
              </p>
              <p className="mt-0.5 flex items-center justify-center gap-1 text-[13px] text-stripe-slate-500">
                <Layers className="h-3 w-3" />
                Entities
              </p>
            </div>
            <div className="rounded-lg bg-stripe-slate-50 px-4 py-3 text-center">
              <p className="text-lg font-semibold text-stripe-slate-800">
                {kg.total_relationships.toLocaleString()}
              </p>
              <p className="mt-0.5 flex items-center justify-center gap-1 text-[13px] text-stripe-slate-500">
                <Link2 className="h-3 w-3" />
                Relationships
              </p>
            </div>
            <div className="rounded-lg bg-stripe-slate-50 px-4 py-3 text-center">
              <p className="text-lg font-semibold text-stripe-slate-800">
                {kg.total_rules.toLocaleString()}
              </p>
              <p className="mt-0.5 flex items-center justify-center gap-1 text-[13px] text-stripe-slate-500">
                <ShieldCheck className="h-3 w-3" />
                Rules
              </p>
            </div>
          </div>

          {entityTypeEntries.length > 0 && (
            <div className="space-y-2 border-t border-stripe-slate-100 pt-4">
              <p className="label mb-2">Entity breakdown</p>
              {entityTypeEntries.map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="capitalize text-stripe-slate-600">
                    {type.replace(/_/g, ' ')}
                  </span>
                  <span className="badge">{count as number}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-stripe-slate-800">
            <Zap className="h-4 w-4 text-stripe-purple" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            <QuickActionLink
              to="/qa"
              icon={MessageSquare}
              title="Ask a Question"
              description="Query your enterprise intelligence"
            />
            <QuickActionLink
              to="/impact-analysis"
              icon={TrendingUp}
              title="Run Impact Analysis"
              description="Analyze regulatory or policy changes"
            />
            <QuickActionLink
              to="/reports"
              icon={FileText}
              title="Generate Report"
              description="Create intelligence reports"
            />
            <QuickActionLink
              to="/data-sources"
              icon={Database}
              title="Add Data Source"
              description="Connect new internal or external data"
            />
          </div>
        </div>
      </div>

      {/* Recent Queries */}
      {data?.recent_queries && data.recent_queries.length > 0 && (
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-stripe-slate-800">
              <Clock className="h-4 w-4 text-stripe-slate-400" />
              Recent Queries
            </h2>
            <Link
              to="/qa"
              className="flex items-center gap-1 text-[13px] font-medium text-stripe-purple transition-colors hover:text-stripe-purple/80"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-stripe-slate-100">
            {data.recent_queries.map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <p className="min-w-0 truncate text-sm text-stripe-slate-700">
                  {q.question}
                </p>
                <time className="shrink-0 text-[13px] text-stripe-slate-400">
                  {new Date(q.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
