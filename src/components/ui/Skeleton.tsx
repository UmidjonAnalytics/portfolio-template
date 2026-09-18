import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}

export function CardSkeleton({ lines = 3, image = true }: { lines?: number; image?: boolean }) {
  return (
    <div className="card p-4 space-y-3" aria-hidden="true">
      {image && <Skeleton className="aspect-[16/10] w-full rounded-xl" />}
      <Skeleton className="h-5 w-3/4" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-1/2" : "w-full")} />
      ))}
    </div>
  );
}

export function SectionSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="container-x py-20 sm:py-28" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-3 w-24 mb-4" />
      <Skeleton className="h-9 w-64 mb-3" />
      <Skeleton className="h-4 w-80 mb-10" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
