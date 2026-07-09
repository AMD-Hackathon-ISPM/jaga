"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * FigureImage — shows a Skeleton placeholder until the image's load event, then
 * crossfades the image in. Keeps result figures from popping in abruptly while
 * the (potentially large) spectrogram / CXR image decodes.
 *
 * The fade is a plain opacity transition; `motion-reduce:transition-none` plus
 * the global reduced-motion guard make the image appear instantly (no fade) for
 * users who prefer reduced motion. `onError` also clears the skeleton so a
 * broken image never leaves a permanent shimmer.
 */
export function FigureImage({
  src,
  alt,
  className,
  imgClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn("relative overflow-hidden rounded-control bg-surface-sunken", className)}>
      {!loaded && <Skeleton className="absolute inset-0 h-full w-full rounded-none" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={cn(
          "h-full w-full object-contain transition-opacity duration-500 ease-out motion-reduce:transition-none",
          loaded ? "opacity-100" : "opacity-0",
          imgClassName,
        )}
      />
    </div>
  );
}
