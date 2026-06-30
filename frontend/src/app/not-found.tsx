import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-flow px-4 py-16 text-center">
      <h1 className="mb-2 font-serif text-2xl font-semibold">Page not found</h1>
      <p className="mb-6 text-ink-muted">This page does not exist in the capture flow.</p>
      <Button asChild>
        <Link href="/">Back to start</Link>
      </Button>
    </div>
  );
}
