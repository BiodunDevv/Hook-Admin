export type PartnerAction =
  | "suspend"
  | "reactivate"
  | "restore"
  | "archive"
  | "revoke-sessions"
  | "cancel-invitation"
  | "delete";

export interface PartnerAccount {
  id?: string;
  publicId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  accountType?: string;
  accountStatus?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface Partner {
  id: string;
  publicId?: string;
  accountId?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status?: string;
  stateId?: string;
  cityId?: string;
  zoneId?: string;
  marketId?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  account?: PartnerAccount | null;
}

export interface PartnerListResponse {
  data: Partner[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PartnerAnalyticsBucket {
  today: number;
  week: number;
  month: number;
  allTime: number;
}

export interface PartnerAnalytics {
  orders: PartnerAnalyticsBucket;
  revenueMinor: PartnerAnalyticsBucket;
  customersCreated: PartnerAnalyticsBucket;
  averageOrderValueMinor: number;
  lastOrderAt?: string | null;
}
