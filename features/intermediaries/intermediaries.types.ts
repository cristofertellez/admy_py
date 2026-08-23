import type { Client } from "@/types";

export interface IntermediaryWithRelations {
  id: string;
  company: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  status: string;
  clients_count?: number;
  projects_count?: number;
  clients?: Client[];
}
