import { 
  Collection, 
  DocumentItem, 
  DocumentDetail, 
  ChatQueryResponse, 
  FinanceBenchQuestion, 
  EvaluationSummary, 
  SystemHealth 
} from '../types';

const API_BASE = '/api';

export const api = {
  // Collections
  async getCollections(): Promise<Collection[]> {
    const res = await fetch(`${API_BASE}/collections`);
    if (!res.ok) throw new Error('Failed to fetch collections');
    return res.json();
  },

  async createCollection(name: string, description?: string): Promise<Collection> {
    const res = await fetch(`${API_BASE}/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    if (!res.ok) throw new Error('Failed to create collection');
    return res.json();
  },

  // Documents
  async getDocuments(collectionId?: string): Promise<DocumentItem[]> {
    const url = collectionId 
      ? `${API_BASE}/documents?collection_id=${encodeURIComponent(collectionId)}`
      : `${API_BASE}/documents`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async getDocument(documentId: string): Promise<DocumentDetail> {
    const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(documentId)}`);
    if (!res.ok) throw new Error('Failed to fetch document details');
    return res.json();
  },

  async uploadDocument(file: File, title?: string, collectionId?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (collectionId) formData.append('collection_id', collectionId);

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload document');
    }
    return res.json();
  },

  async deleteDocument(documentId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(documentId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete document');
  },

  // Chat Q&A
  async queryChat(params: {
    question: string;
    collection_id?: string;
    top_k?: number;
    similarity_threshold?: number;
    session_id?: string;
  }): Promise<ChatQueryResponse> {
    const res = await fetch(`${API_BASE}/chat/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to execute query');
    }
    return res.json();
  },

  async getChatSessions(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/chat/sessions`);
    if (!res.ok) throw new Error('Failed to fetch sessions');
    return res.json();
  },

  // Evaluation
  async getBenchmarkQuestions(): Promise<FinanceBenchQuestion[]> {
    const res = await fetch(`${API_BASE}/evaluation/questions`);
    if (!res.ok) throw new Error('Failed to fetch benchmark questions');
    return res.json();
  },

  async runEvaluation(params?: {
    collection_id?: string;
    sample_ids?: string[];
    top_k?: number;
    similarity_threshold?: number;
  }): Promise<EvaluationSummary> {
    const res = await fetch(`${API_BASE}/evaluation/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {}),
    });
    if (!res.ok) throw new Error('Evaluation failed');
    return res.json();
  },

  async bootstrapSamples(): Promise<any> {
    const res = await fetch(`${API_BASE}/evaluation/bootstrap`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to bootstrap sample filings');
    return res.json();
  },

  // Settings & Health
  async getSettings(): Promise<any> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(settings: any): Promise<any> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  async getHealth(): Promise<SystemHealth> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch health');
    return res.json();
  },
};
