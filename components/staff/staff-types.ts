export type StaffAction =
  | "suspend"
  | "reactivate"
  | "restore"
  | "archive"
  | "revoke-sessions"
  | "cancel-invitation";

export interface StaffRole {
  id: string;
  key: string;
  name: string;
  description?: string;
  permissionKeys?: string[];
  isSystem?: boolean;
  isActive?: boolean;
}

export interface StaffMember {
  id: string;
  publicId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  roleKeys?: string[];
  roles?: StaffRole[];
  permissions?: string[];
  status?: string;
  scopeType?: string;
  stateIds?: string[];
  hubIds?: string[];
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  account?: {
    id?: string;
    publicId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    isActive?: boolean;
    isEmailVerified?: boolean;
    lastLoginAt?: string;
  } | null;
}

export interface StaffListResponse {
  data: StaffMember[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
