import axios from "axios";
import type { DocumentMetadata, DocumentSummary } from "@/types/document";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

export async function listDocuments(): Promise<DocumentSummary[]> {
  const { data } = await api.get<DocumentSummary[]>("/documents");
  return data;
}

export async function getDocument(id: string): Promise<DocumentMetadata> {
  const { data } = await api.get<DocumentMetadata>(`/documents/${id}`);
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
