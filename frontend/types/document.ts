export type DocumentSummary = {
  id: string;
  filename: string;
  uploaded_at: string;
  size: number;
};

export type DocumentMetadata = DocumentSummary & {
  stored_filename: string;
  file_path: string;
  mime_type: string;
};

export type ExtractedPage = {
  page: number;
  method: "native" | "ocr";
  text: string;
};

export type ParseResponse = {
  document_id: string;
  status: "completed";
  pages_processed: number;
  pages_failed: number;
};

export type BuildSearchIndexResponse = {
  success: boolean;
  chunks_indexed: number;
};

export type ClauseSearchResult = {
  page: number;
  section: string | null;
  matched_text: string;
  confidence: number;
  similarity_score?: number | null;
  highlighted_sentence?: string | null;
};

export type ClauseSearchResponse = {
  success: boolean;
  result: ClauseSearchResult | null;
  message?: string | null;
};
