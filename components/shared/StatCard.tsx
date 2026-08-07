import { MetricCard } from "@/components/shared/MetricCard";
import type { StatCardData } from "@/lib/data";

export default function StatCard({ data }: { data: StatCardData }) {
  return <MetricCard {...data} />;
}
