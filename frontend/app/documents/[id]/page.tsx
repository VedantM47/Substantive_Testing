import { ViewerClient } from "@/components/viewer/ViewerClient";
import { notFound } from "next/navigation";

export default async function DocumentViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    notFound();
  }
  return <ViewerClient documentId={id} />;
}
