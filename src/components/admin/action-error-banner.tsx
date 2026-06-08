export function ActionErrorBanner({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {message}
    </p>
  );
}
