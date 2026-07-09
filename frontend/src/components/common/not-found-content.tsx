"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";

export function NotFoundContent() {
  const t = useT();

  return (
    <div className="mx-auto w-full max-w-flow px-4 py-16 text-center">
      <h1 className="mb-2 font-heading text-2xl font-semibold">{t("notFound.title")}</h1>
      <p className="mb-6 text-base text-ink-muted">{t("notFound.description")}</p>
      <Link href="/" className={cn(buttonVariants({ size: "md" }))}>
        {t("notFound.backToStart")}
      </Link>
    </div>
  );
}
