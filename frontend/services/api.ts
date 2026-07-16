import axios from "axios";
import type {
  BuildSearchIndexResponse,
  ClauseSearchResponse,
  DocumentMetadata,
  DocumentSummary,
  ExtractedPage,
  ParseResponse,
} from "@/types/document";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

export async function listDocuments(): Promise<DocumentSummary[]> {
  const { data } = await api.get<DocumentSummary[]>("/documents");
  return data.filter((document) => document.id);
}

export async function getDocument(id: string): Promise<DocumentMetadata> {
  const { data } = await api.get<DocumentMetadata>(`/documents/${id}`);
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/documents/${id}`);
}

export async function parseDocument(id: string): Promise<ParseResponse> {
  const { data } = await api.post<ParseResponse>(`/documents/${id}/parse`);
  return data;
}

export async function getDocumentPages(id: string): Promise<ExtractedPage[]> {
  const { data } = await api.get<ExtractedPage[]>(`/documents/${id}/pages`);
  return data;
}

export async function buildSearchIndex(pages: ExtractedPage[]): Promise<BuildSearchIndexResponse> {
  const { data } = await api.post<BuildSearchIndexResponse>("/api/search/index", {
    pages: pages.map((page) => ({ page: page.page, text: page.text })),
  });
  return data;
}

export async function searchClauses(query: string): Promise<ClauseSearchResponse> {
  const { data } = await api.post<ClauseSearchResponse>("/api/search", { query });
  return data;
}

export async function uploadDocument(
  file: File,
  onProgress: (progress: number) => void,
): Promise<DocumentSummary> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post<DocumentSummary>("/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });

  return data;
}

export function documentDownloadUrl(id: string): string {
  return `${API_BASE_URL}/documents/${id}/download`;
}

export default api;
