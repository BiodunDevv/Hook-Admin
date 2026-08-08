"use client";

import { useParams } from "next/navigation";
import { RunnerMarketDetailWorkspace } from "@/components/runner/RunnerMarketDetailWorkspace";

export default function RunnerMarketDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <RunnerMarketDetailWorkspace id={id} />;
}
