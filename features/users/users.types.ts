export interface UserWithRole {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role_id: string;
  role_name?: string;
  last_login: string | null;
  is_active: boolean;
  created_at: string;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: "active" | "inactive";
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
