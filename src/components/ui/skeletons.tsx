import { cn } from "@/lib/utils";

/** Base shimmer block. Compose with width/height/radius utilities. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-card", className)} aria-hidden />;
}

/** Hero placeholder — matches the real carousel's footprint and inner layout. */
export function HeroSkeleton() {
  return (
    <div className="relative min-h-[24rem] w-full overflow-hidden rounded-hero bg-surface-raised ring-1 ring-line sm:min-h-[20rem] lg:min-h-[22rem]">
      <div className="skeleton absolute inset-0 rounded-none" />
      <div className="relative flex min-h-[24rem] items-center gap-6 p-5 sm:min-h-[20rem] sm:p-7 lg:min-h-[22rem] lg:gap-8 lg:p-8">
        <Skeleton className="hidden aspect-[2/3] w-32 shrink-0 rounded-card sm:block lg:w-40" />
        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          <Skeleton className="h-4 w-28 rounded-pill" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-14 rounded-md" />
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-3 pt-1">
            <Skeleton className="h-11 w-32 rounded-pill" />
            <Skeleton className="size-11 rounded-pill" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** A single 2:3 poster card placeholder. */
export function PosterCardSkeleton() {
  return (
    <div className="space-y-2.5">
      <Skeleton className="aspect-[2/3] w-full" />
      <Skeleton className="h-3.5 w-5/6" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

/** Wide, compact "latest update" row placeholder. */
export function UpdateRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-card border border-line bg-surface-raised/50 p-3">
      <Skeleton className="size-14 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="size-8 shrink-0 rounded-lg" />
    </div>
  );
}

/** Compact mini-list item placeholder for the left sidebar. */
export function MiniRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2">
      <Skeleton className="size-10 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2.5 w-1/3" />
      </div>
    </div>
  );
}
