import axios from 'axios';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000' });

export interface TraceStep {
  step: string;
  detail: any;
}

export interface Trace {
  steps: TraceStep[];
  docsUsed: string[];
  contradictions: string[];
}

export interface AskResponse {
  id: string;
  question: string;
  finalAnswer: string;
  trace: Trace;
}

export interface UploadDoc {
  title: string;
  topic: string;
  content: string;
}

export const askQuestion = (question: string) =>
  api.post<AskResponse>('/ask', { question }).then(r => r.data);

export const uploadDocument = (doc: UploadDoc) =>
  api.post('/upload', doc).then(r => r.data);

export const fetchTrace = (id: string) =>
  api.get<AskResponse>(`/trace/${id}`).then(r => r.data);
