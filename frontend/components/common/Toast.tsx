export function Toast({
  message,
  tone = "error",
  onDismiss,
}: {
  message: string;
  tone?: "error" | "success";
  onDismiss: () => void;
}) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border p-4 text-sm shadow-soft ${
        tone === "success"
          ? "border-blue-200 bg-blue-50 text-blue-900"
          : "border-red-200 bg-red-50 text-red-900"
      }`}
      role="status"
    >
      <div className="flex items-start gap-4">
        <p className="leading-6">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md px-2 text-lg leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label="Dismiss notification"
        >
          x
        </button>
      </div>
    </div>
  );
}
