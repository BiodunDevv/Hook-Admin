export type MarketRecord = {
  id: string;
  publicId?: string;
  name: string;
  address: string;
  imageUrl?: string;
  shortDisplayName?: string;
  discoveryColor?: string;
  isFeatured?: boolean;
  displayPriority?: number;
  status?: string;
  stateId?: string;
  cityId?: string;
  zoneId?: string;
  hubId?: string;
  stateName?: string | null;
  cityName?: string | null;
  zoneName?: string | null;
  hubName?: string | null;
  state?: { publicId?: string; name?: string; code?: string } | null;
  city?: { publicId?: string; name?: string; code?: string } | null;
  zone?: { publicId?: string; name?: string; code?: string } | null;
  hub?: { publicId?: string; name?: string } | null;
  notes?: string;
  coordinates?: { lat?: number; lng?: number };
  operatingHours?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type LookupRecord = {
  id?: string;
  publicId?: string;
  name: string;
  code?: string;
  stateId?: string;
  cityId?: string;
};

export type CollectionResponse<T> = {
  data: T[];
  total?: number;
};

export function recordIdentifier(record?: { id?: string; publicId?: string } | null) {
  return record?.publicId || record?.id || "";
}

export function relationIdentifier(
  record: MarketRecord | null | undefined,
  field: "state" | "city" | "zone" | "hub",
) {
  const nested = record?.[field];
  const direct = record?.[`${field}Id` as keyof MarketRecord];
  if (nested && typeof nested === "object") {
    return String(nested.publicId || "");
  }
  return typeof direct === "string" ? direct : "";
}
