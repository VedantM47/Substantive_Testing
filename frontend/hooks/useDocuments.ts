"use client";

import { useCallback, useEffect, useState } from "react";
import { listDocuments } from "@/services/api";
import type { DocumentSummary } from "@/types/document";

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setDocuments(await listDocuments());
    } catch {
      setError("Could not load documents. Check that the backend is running.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { documents, setDocuments, isLoading, error, refresh };
}
