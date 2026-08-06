export type CreatedByBrief = {
  id: number;
  name: string | null;
  email: string | null;
};

export type AppKeyResponse = {
  id: number;
  name: string;
  description: string | null;
  key_prefix: string;
  is_active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: CreatedByBrief | null;
  roles: string[];
};

export type AppKeyCreatedResponse = AppKeyResponse & {
  full_key: string;
};

export type AppKeyListResponse = {
  data: AppKeyResponse[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
};

export type CreateAppKeyRequest = {
  name: string;
  description?: string | null;
  expires_at?: string | null;
  roles: string[];
};

export type UpdateAppKeyRequest = {
  name?: string;
  description?: string | null;
  expires_at?: string | null;
};

export type UpdateAppKeyRolesRequest = {
  roles: string[];
};
