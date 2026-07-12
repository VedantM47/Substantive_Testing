"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { Button } from "@/components/common/Button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { uploadDocument } from "@/services/api";
import type { DocumentSummary } from "@/types/document";

const MAX_SIZE = 100 * 1024 * 1024;

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(bytes > 1024 * 1024 ? 1 : 2)} MB`;
}

function validateFile(file: File) {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return "Only PDF files can be uploaded.";
  }
  if (file.size > MAX_SIZE) {
    return "PDF must be 100 MB or smaller.";
  }
  return null;
}

export function UploadZone({
  onUploaded,
  onToast,
}: {
  onUploaded: (document: DocumentSummary) => void;
  onToast: (message: string, tone?: "error" | "success") => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const chooseFile = (nextFile: File | undefined) => {
    if (!nextFile) return;
    const validationError = validateFile(nextFile);
    setError(validationError);
    setFile(validationError ? null : nextFile);
    setProgress(0);
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    chooseFile(event.target.files?.[0]);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  };

  const onUpload = async () => {
    if (!file) {
      setError("Choose a PDF before uploading.");
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const document = await uploadDocument(file, setProgress);
      onUploaded(document);
      onToast("Document uploaded successfully.", "success");
      setFile(null);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      onToast("Upload failed. Confirm the backend is running and the file is a valid PDF.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="rounded-xl border border-line bg-white p-6 shadow-sm">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`rounded-xl border border-dashed p-10 text-center transition ${
          isDragging ? "border-accent bg-blue-50" : "border-line bg-surface"
        }`}
        aria-label="Upload PDF drop zone"
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={onInputChange}
          className="sr-only"
        />
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white text-sm font-bold text-accent shadow-sm">
          PDF
        </div>
        <h2 className="text-lg font-semibold text-ink">Upload agreement</h2>
        <p className="mt-2 text-sm text-muted">Drag a PDF here, or click to browse.</p>
        <p className="mt-1 text-xs text-muted">Maximum file size: 100 MB</p>
      </div>

      <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-h-10">
          {file ? (
            <div>
              <p className="text-sm font-medium text-ink">{file.name}</p>
              <p className="text-xs text-muted">{formatBytes(file.size)}</p>
            </div>
          ) : (
            <p className="text-sm text-muted">No file selected.</p>
          )}
          {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
        </div>
        <Button onClick={onUpload} disabled={isUploading || !file}>
          {isUploading ? <LoadingSpinner label="Uploading" /> : "Upload"}
        </Button>
      </div>

      {isUploading ? (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">{progress}% uploaded</p>
        </div>
      ) : null}
    </section>
  );
}
