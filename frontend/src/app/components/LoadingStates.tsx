import { Card, CardContent, CardHeader } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export function AdminDashboardSkeleton() {
  return <div className="space-y-6">
    <PageHeaderSkeleton />
    <div className="grid gap-4 xl:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => <Card key={index}>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[230px] w-full" />
        </CardContent>
      </Card>)}
    </div>
    <Skeleton className="h-12 w-80 rounded-lg" />
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, index) => <ListCardSkeleton key={index} />)}
    </div>
  </div>;
}

export function CustomerDashboardSkeleton() {
  return <div className="space-y-6">
    <PageHeaderSkeleton />
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-3 w-full" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20" />)}
        </div>
      </CardContent>
    </Card>
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, index) => <MetricSkeleton key={index} />)}
    </div>
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: 3 }).map((_, index) => <CampaignCardSkeleton key={index} />)}
    </div>
  </div>;
}

export function MarketplaceSkeleton() {
  return <div className="space-y-6">
    <PageHeaderSkeleton />
    <div className="grid sm:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, index) => <MetricSkeleton key={index} />)}
    </div>
    <Skeleton className="h-16 w-full rounded-lg" />
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, index) => <CampaignCardSkeleton key={index} />)}
    </div>
  </div>;
}

export function CollaboratorActivitySkeleton() {
  return <div className="space-y-6">
    <PageHeaderSkeleton />
    <div className="grid sm:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, index) => <MetricSkeleton key={index} />)}
    </div>
    <div className="grid sm:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => <MetricSkeleton key={index} />)}
    </div>
    <Skeleton className="h-12 w-96 max-w-full rounded-lg" />
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => <ListCardSkeleton key={index} />)}
    </div>
  </div>;
}

export function DetailSkeleton() {
  return <div className="space-y-6">
    <div className="flex justify-between">
      <Skeleton className="h-10 w-28" />
      <Skeleton className="h-10 w-24" />
    </div>
    <ListCardSkeleton />
    <div className="grid sm:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => <MetricSkeleton key={index} />)}
    </div>
    <ListCardSkeleton />
  </div>;
}

export function ProfileSkeleton() {
  return <div className="max-w-3xl mx-auto">
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, index) => <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>)}
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="flex justify-end">
          <Skeleton className="h-10 w-28" />
        </div>
      </CardContent>
    </Card>
  </div>;
}

function PageHeaderSkeleton() {
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96 max-w-full" />
    </div>
    <Skeleton className="h-10 w-28" />
  </div>;
}

function MetricSkeleton() {
  return <Card>
    <CardHeader className="pb-2">
      <Skeleton className="h-4 w-28" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-24" />
    </CardContent>
  </Card>;
}

function CampaignCardSkeleton() {
  return <Card className="overflow-hidden">
    <CardHeader className="space-y-2 border-b bg-slate-50">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent className="space-y-4 p-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-3 w-full" />
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <Skeleton className="h-10 w-32" />
    </CardContent>
  </Card>;
}

function ListCardSkeleton() {
  return <Card>
    <CardContent className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    </CardContent>
  </Card>;
}
