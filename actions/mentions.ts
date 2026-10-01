"use server";

import { UsersService } from "@/features/users";
import { getUser } from "@/lib/auth";

export async function searchMentionCandidates(search: string) {
  const user = await getUser();
  if (!user) return [];

  const term = (search ?? "").trim();
  return UsersService.listMentionCandidates(term);
}