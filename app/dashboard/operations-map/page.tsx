"use client";

import { ArrowLeft, Map } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { MapboxOperationsMap } from "@/components/dashboard/MapboxOperationsMap";

export default function OperationsMapPage() {
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-4rem)] overflow-y-auto p-2 pb-6 sm:p-4 sm:pb-8">
      <PageHeader
        title="Operations Map"
        description="Live delivery movement with 3D city context."
        actions={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft size={15} /> Back
          </Button>
        }
      />
      <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 shadow-sm">
        <Map size={15} className="text-emerald-500" />
        3D Mapbox view uses active dispatch coordinates from the backend.
      </div>
      <MapboxOperationsMap />
    </div>
  );
}
