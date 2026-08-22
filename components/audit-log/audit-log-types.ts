export interface AuditLogEvent {
  id: string;
  publicId?: string;
  actorType: string;
  actorId: string;
  actorPublicId?: string;
  actorName?: string | null;
  actorEmail?: string | null;
  actorAccountType?: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  entityPublicId?: string;
  stateId?: string;
  hubId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: string;
}

export interface AuditLogListResponse {
  data: AuditLogEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
