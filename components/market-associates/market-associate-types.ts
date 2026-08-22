export type MarketAssociateAction =
  | "suspend"
  | "reactivate"
  | "restore"
  | "archive"
  | "revoke-sessions"
  | "cancel-invitation";

export interface MarketAssociateAccount {
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
  updatedAt?: string;
}

export interface MarketAssociateRelation {
  id?: string;
  publicId?: string;
  name?: string;
  code?: string;
  status?: string;
}

export interface MarketAssociateAssignment {
  id?: string;
  publicId?: string;
  market?: { id?: string; publicId?: string; name?: string } | null;
  isPrimary?: boolean;
  priority?: number;
  status?: string;
  activeFrom?: string;
  activeTo?: string;
}

export interface MarketAssociateMember {
  id: string;
  publicId?: string;
  accountId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status?: string;
  availability?: string;
  stateIds?: string[];
  hubIds?: string[];
  activeMarketCount?: number;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  account?: MarketAssociateAccount | null;
  states?: MarketAssociateRelation[];
  hubs?: MarketAssociateRelation[];
  assignments?: MarketAssociateAssignment[];
}

export interface MarketAssociateListResponse {
  data: MarketAssociateMember[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
