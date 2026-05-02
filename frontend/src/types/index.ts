export interface Tenant {
  id: number;
  name: string;
  slug: string;
  plan: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'analyst' | 'viewer';
  is_active: boolean;
  tenant_id: number;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
  tenant: Tenant;
}

export interface DataSource {
  id: number;
  name: string;
  description: string | null;
  source_type: string;
  config: Record<string, any>;
  is_active: boolean;
  schedule: string | null;
  last_ingested_at: string | null;
  document_count: number;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface SourceReference {
  document_id: number;
  document_title: string;
  chunk_text: string;
  relevance_score: number;
  source_url?: string;
}

export interface AnswerResponse {
  answer: string;
  sources: SourceReference[];
  conversation_id: number;
  query_id: number;
  processing_time_ms: number;
}

export interface Conversation {
  id: number;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface QueryHistoryItem {
  id: number;
  question: string;
  answer: string | null;
  sources: any[];
  created_at: string;
}

export interface Report {
  id: number;
  title: string;
  report_type: string;
  template: string | null;
  parameters: Record<string, any>;
  content: string | null;
  sections: any[];
  status: string;
  storage_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeGraph {
  version: string;
  metadata: Record<string, any>;
  entities: Record<string, KGEntity[]>;
  relationships: KGRelationship[];
  rules: KGRule[];
}

export interface KGEntity {
  id: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface KGRelationship {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  context?: string;
  metadata?: Record<string, any>;
}

export interface KGRule {
  id: string;
  name: string;
  description?: string;
  condition: string;
  affected_entity_types: string[];
  impact_level: string;
  metadata?: Record<string, any>;
}

export interface DashboardData {
  stats: {
    total_data_sources: number;
    total_documents: number;
    total_queries: number;
    total_reports: number;
  };
  recent_queries: { id: number; question: string; created_at: string }[];
  active_sources: { id: number; name: string; source_type: string; status: string; document_count: number }[];
  knowledge_graph: {
    total_entities: number;
    total_relationships: number;
    total_rules: number;
    entity_types: Record<string, number>;
  };
}

export interface ImpactResult {
  entity_id: string;
  entity_name: string;
  entity_type: string;
  impact_level: string;
  impact_score: number;
  summary: string;
  details: string;
  recommendations: string[];
  sources: { title: string; relevance: number }[];
}

export interface ImpactAnalysisResponse {
  query: string;
  overall_summary: string;
  impacts: ImpactResult[];
  processing_time_ms: number;
}
