import { Skeleton } from "@/components/ui/skeleton";

export const HeroSkeleton = () => (
  <div className="bg-card/60 backdrop-blur-xl rounded-3xl p-6 shadow-card border border-border/50 relative overflow-hidden">
    {/* Pet area */}
    <div className="flex flex-col items-center gap-3">
      <Skeleton className="w-32 h-32 rounded-full" />
      <Skeleton className="h-5 w-24 rounded-lg" />
      <Skeleton className="h-3 w-40 rounded-full" />
      {/* XP bar */}
      <div className="w-full flex items-center gap-2 mt-2">
        <Skeleton className="h-3 w-12 rounded" />
        <Skeleton className="h-3 flex-1 rounded-full" />
        <Skeleton className="h-3 w-12 rounded" />
      </div>
    </div>
  </div>
);

export const StreakSkeleton = () => (
  <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      </div>
      <Skeleton className="h-8 w-16 rounded-lg" />
    </div>
  </div>
);

export const XPSkeleton = () => (
  <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
    <div className="grid grid-cols-3 gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col items-center gap-2 p-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-5 w-14 rounded" />
          <Skeleton className="h-3 w-10 rounded" />
        </div>
      ))}
    </div>
  </div>
);

export const BalanceCardSkeleton = () => (
  <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
    <div className="flex items-center justify-between mb-3">
      <Skeleton className="h-4 w-24 rounded" />
      <Skeleton className="w-8 h-8 rounded-full" />
    </div>
    <Skeleton className="h-8 w-36 rounded-lg mb-2" />
    <div className="flex items-center gap-2">
      <Skeleton className="h-3 w-20 rounded" />
      <Skeleton className="h-3 w-16 rounded" />
    </div>
  </div>
);

export const QuickActionsSkeleton = () => (
  <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
    <Skeleton className="h-4 w-28 rounded mb-4" />
    <div className="grid grid-cols-4 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Skeleton className="w-12 h-12 rounded-2xl" />
          <Skeleton className="h-3 w-10 rounded" />
        </div>
      ))}
    </div>
  </div>
);

export const ChallengesSkeleton = () => (
  <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
    <Skeleton className="h-5 w-36 rounded mb-4" />
    <div className="space-y-3">
      {[0, 1].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <Skeleton className="h-4 w-10 rounded" />
        </div>
      ))}
    </div>
  </div>
);

export const TransactionsSkeleton = () => (
  <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
    <Skeleton className="h-5 w-28 rounded mb-4" />
    <div className="space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <Skeleton className="h-4 w-16 rounded" />
        </div>
      ))}
    </div>
  </div>
);
