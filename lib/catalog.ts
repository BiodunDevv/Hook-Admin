export interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CatalogMedia {
  publicId: string;
  deliveryUrl?: string;
  secureUrl?: string;
  width?: number;
  height?: number;
}

export interface ProductSubmission {
  id: string;
  publicId: string;
  basicTitle: string;
  imageUrl?: string;
  status: "draft" | "submitted" | "in_review" | "changes_requested" | "approved" | "rejected";
  marketId: string;
  marketVendorId?: string;
  marketVendor?: { publicId: string; businessName: string; contactName: string } | null;
  internalSellerReference?: string;
  sourceStateId: string;
  categorySuggestionId: string;
  notes?: string;
  mediaIds: string[];
  basePriceMinor: number;
  currency: string;
  variants: Array<{ size?: string; colour?: string; attributes: Record<string, string>; active: boolean }>;
  availabilityStatus: string;
  availabilityNote?: string;
  approvedProduct?: {
    publicId: string;
    sellingPriceMinor: number;
    minimumPriceMinor: number;
    observedCostMinor: number;
    currency: string;
    status: string;
    publishedAt?: string;
  } | null;
  reviewNotes: Array<{
    action: string;
    message?: string;
    fields?: string[];
    createdAt: string;
  }>;
  media?: CatalogMedia[];
  market?: { publicId: string; name: string };
  category?: { publicId: string; name: string };
  version: number;
  updatedAt: string;
}

export interface CommercialProduct {
  id: string;
  publicId: string;
  title: string;
  slug: string;
  description?: string;
  status: string;
  catalogVersion: number;
  images?: string[];
  pricing?: {
    basePriceMinor: number;
    sellingPriceMinor: number;
    discountMinor: number;
    effectivePriceMinor: number;
    markupMinor: number;
    marginMinor: number;
    marginPercentage: number;
  };
  negotiationRules?: {
    enabled: boolean;
    minimumNegotiablePriceMinor?: number;
    maximumDiscountMinor?: number;
    maximumCustomerOffers: number;
    acceptedQuoteExpiryMinutes: number;
  };
  category?: { publicId: string; name: string };
  market?: { publicId: string; name: string };
  variants?: Array<{ publicId: string; size?: string; colour?: string; active: boolean }>;
  media?: CatalogMedia[];
  sourceStateId?: string;
  updatedAt: string;
}

export function money(minor?: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format((minor || 0) / 100);
}
