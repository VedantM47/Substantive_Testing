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
