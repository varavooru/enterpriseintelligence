import type {
  TokenResponse, DataSource, AnswerResponse, Conversation,
  QueryHistoryItem, Report, KnowledgeGraph, DashboardData,
  ImpactAnalysisResponse, User,
} from '../types';

const BASE_URL = '/api/v1';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) { this.token = token; }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if (response.status === 401) {
      localStorage.removeItem('auth');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    if (response.status === 204) return {} as T;
    return response.json();
  }

  // Auth
  async register(email: string, fullName: string, password: string, tenantName?: string): Promise<TokenResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, full_name: fullName, password, tenant_name: tenantName }),
    });
  }
  async login(email: string, password: string): Promise<TokenResponse> {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  }
  async getMe(): Promise<User> { return this.request('/auth/me'); }
  async getTenantMembers(): Promise<User[]> { return this.request('/auth/tenant/members'); }

  // Data Sources
  async getDataSources(): Promise<DataSource[]> { return this.request('/data-sources/'); }
  async createDataSource(data: Partial<DataSource>): Promise<DataSource> {
    return this.request('/data-sources/', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateDataSource(id: number, data: Partial<DataSource>): Promise<DataSource> {
    return this.request(`/data-sources/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteDataSource(id: number): Promise<void> { return this.request(`/data-sources/${id}`, { method: 'DELETE' }); }
  async triggerIngestion(id: number): Promise<{ message: string }> {
    return this.request(`/data-sources/${id}/ingest`, { method: 'POST' });
  }

  // Q&A
  async askQuestion(question: string, conversationId?: number, filters?: Record<string, any>): Promise<AnswerResponse> {
    return this.request('/qa/ask', { method: 'POST', body: JSON.stringify({ question, conversation_id: conversationId, filters }) });
  }
  askQuestionStream(question: string, conversationId?: number) {
    return fetch(`${BASE_URL}/qa/ask/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) },
      body: JSON.stringify({ question, conversation_id: conversationId }),
    });
  }
  async getConversations(): Promise<Conversation[]> { return this.request('/qa/conversations'); }
  async getConversationHistory(id: number): Promise<QueryHistoryItem[]> { return this.request(`/qa/conversations/${id}/history`); }

  // Reports
  async getReports(): Promise<Report[]> { return this.request('/reports/'); }
  async createReport(data: { title: string; report_type: string; parameters?: Record<string, any> }): Promise<Report> {
    return this.request('/reports/', { method: 'POST', body: JSON.stringify(data) });
  }
  async getReport(id: number): Promise<Report> { return this.request(`/reports/${id}`); }
  async deleteReport(id: number): Promise<void> { return this.request(`/reports/${id}`, { method: 'DELETE' }); }

  // Knowledge Graph
  async getKnowledgeGraph(): Promise<KnowledgeGraph> { return this.request('/knowledge-graph/'); }
  async addEntity(entityType: string, entity: Record<string, any>): Promise<any> {
    return this.request('/knowledge-graph/entities', { method: 'POST', body: JSON.stringify({ entity_type: entityType, entity }) });
  }
  async deleteEntity(entityType: string, entityId: string): Promise<any> {
    return this.request(`/knowledge-graph/entities/${entityType}/${entityId}`, { method: 'DELETE' });
  }
  async addRelationship(data: Record<string, any>): Promise<any> {
    return this.request('/knowledge-graph/relationships', { method: 'POST', body: JSON.stringify(data) });
  }
  async deleteRelationship(relId: string): Promise<any> {
    return this.request(`/knowledge-graph/relationships/${relId}`, { method: 'DELETE' });
  }
  async addRule(data: Record<string, any>): Promise<any> {
    return this.request('/knowledge-graph/rules', { method: 'POST', body: JSON.stringify(data) });
  }
  async deleteRule(ruleId: string): Promise<any> {
    return this.request(`/knowledge-graph/rules/${ruleId}`, { method: 'DELETE' });
  }

  // Intelligence
  async analyzeImpact(query: string, entityType?: string, entityIds?: string[]): Promise<ImpactAnalysisResponse> {
    return this.request('/intelligence/analyze-impact', { method: 'POST', body: JSON.stringify({ query, entity_type: entityType, entity_ids: entityIds }) });
  }
  async getDashboard(): Promise<DashboardData> { return this.request('/intelligence/dashboard'); }
}

export const api = new ApiClient();
