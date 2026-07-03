export type Trend = "up" | "down" | "flat";

export interface StatCardData {
  label: string;
  value: string;
  delta: string;
  trend: Trend;
  caption: string;
  sparkline: number[];
}
