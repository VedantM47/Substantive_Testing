import { ViewerClient } from "@/components/viewer/ViewerClient";

export default async function DocumentViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ViewerClient documentId={id} />;
}
