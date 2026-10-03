import { AsyncLocalStorage } from "node:async_hooks";
import type { SessionProfile } from "@/lib/auth";

// Épica 17 (17.1/17.2) — server-only actor context for API-key requests.
// lib/auth-scope.ts reads the store through globalThis (see the note there)
// so this Node module never enters client bundles.

const ACTOR_CONTEXT_KEY = "__admipyActorContext";

type ActorContext = AsyncLocalStorage<SessionProfile>;

function resolveContext(): ActorContext {
  const globalScope = globalThis as Record<string, unknown>;
  const existing = globalScope[ACTOR_CONTEXT_KEY] as ActorContext | undefined;
  if (existing) return existing;

  const created = new AsyncLocalStorage<SessionProfile>();
  globalScope[ACTOR_CONTEXT_KEY] = created;
  return created;
}

/**
 * Runs `handler` with `actor` as the effective user for every data-layer
 * scope (requireScopedUser / projectScope / clientScope / ...).
 */
export function withActor<T>(actor: SessionProfile, handler: () => Promise<T>): Promise<T> {
  return resolveContext().run(actor, handler);
}
