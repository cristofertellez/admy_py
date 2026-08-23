export const queryKeys = {
  clients: {
    all: ["clients"] as const,
    lists: () => [...queryKeys.clients.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.clients.lists(), filters] as const,
    details: () => [...queryKeys.clients.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.clients.details(), id] as const,
  },
  projects: {
    all: ["projects"] as const,
    lists: () => [...queryKeys.projects.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    lists: () => [...queryKeys.tasks.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
  },
  comments: {
    all: ["comments"] as const,
    byProject: (projectId: string) => ["comments", "project", projectId] as const,
    byTask: (taskId: string) => ["comments", "task", taskId] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    developerStats: () => ["dashboard", "developer", "stats"] as const,
  },
  activity: {
    all: ["activity"] as const,
    byEntity: (entity: string, entityId: string) => ["activity", entity, entityId] as const,
  },
} as const;
