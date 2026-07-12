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
