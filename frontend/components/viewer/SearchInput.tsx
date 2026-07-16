import { FormEvent } from "react";
import { Button } from "@/components/common/Button";

export function SearchInput({
  value,
  disabled,
  onChange,
  onSubmit,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <label className="sr-only" htmlFor="ai-clause-search">
        AI clause search
      </label>
      <input
        id="ai-clause-search"
        className="min-h-11 flex-1 rounded-lg border border-line bg-white px-4 text-sm text-ink shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-blue-100"
        placeholder="Ask anything about this agreement..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
      <Button type="submit" disabled={disabled || !value.trim()} className="rounded-lg">
        Search
      </Button>
    </form>
  );
}
