import type {
  AutomationActionConfig,
  AutomationConditions,
  AutomationRuleConfig,
} from "@/schemas/integrations";

export type AutomationAction = "notify_project_audience" | "webhook_forward";

export interface AutomationRuleRow {
  id: string;
  name: string;
  event: string;
  action: AutomationAction;
  config: string;
  active: number;
  created_by: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AutomationRuleView {
  id: string;
  name: string;
  event: string;
  action: AutomationAction;
  config: AutomationRuleConfig;
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AutomationEventDefinition {
  type: string;
  label: string;
  description: string;
  category: "project" | "task" | "milestone" | "collaboration";
  samplePayload: Record<string, unknown>;
  supportsStatusFilter: boolean;
  availableStatuses?: { value: string; label: string }[];
  supportsPriorityFilter?: boolean;
}

export const AUTOMATION_EVENT_DEFINITIONS: AutomationEventDefinition[] = [
  {
    type: "project.created",
    label: "Proyecto Creado",
    description: "Se dispara inmediatamente al registrar un nuevo proyecto.",
    category: "project",
    samplePayload: {
      projectId: "proj-101",
      projectName: "Portal Web V2",
      clientName: "Acme Corp",
      status: "active",
    },
    supportsStatusFilter: false,
  },
  {
    type: "project.status_changed",
    label: "Estado de Proyecto Modificado",
    description: "Se dispara cuando el estado de un proyecto cambia de fase.",
    category: "project",
    samplePayload: {
      projectId: "proj-101",
      projectName: "Portal Web V2",
      status: "in_progress",
      previousStatus: "planning",
    },
    supportsStatusFilter: true,
    availableStatuses: [
      { value: "planning", label: "Planificación" },
      { value: "active", label: "Activo" },
      { value: "on_hold", label: "En Pausa" },
      { value: "completed", label: "Completado" },
      { value: "archived", label: "Archivado" },
    ],
  },
  {
    type: "project.completed",
    label: "Proyecto Finalizado",
    description: "Se dispara cuando un proyecto pasa al estado completado o 100%.",
    category: "project",
    samplePayload: {
      projectId: "proj-101",
      projectName: "Portal Web V2",
      status: "completed",
    },
    supportsStatusFilter: false,
  },
  {
    type: "task.created",
    label: "Nueva Tarea Creada",
    description: "Se dispara cuando se añade una nueva tarea a un proyecto.",
    category: "task",
    samplePayload: {
      projectId: "proj-101",
      taskId: "task-202",
      taskTitle: "Diseñar arquitectura DB",
      status: "todo",
      priority: "high",
    },
    supportsStatusFilter: false,
    supportsPriorityFilter: true,
  },
  {
    type: "task.status_changed",
    label: "Estado de Tarea Modificado",
    description: "Se dispara cuando una tarea cambia de columna o estado.",
    category: "task",
    samplePayload: {
      projectId: "proj-101",
      taskId: "task-202",
      taskTitle: "Diseñar arquitectura DB",
      status: "done",
      previousStatus: "in_progress",
      priority: "urgent",
    },
    supportsStatusFilter: true,
    availableStatuses: [
      { value: "todo", label: "Por Hacer (To Do)" },
      { value: "in_progress", label: "En Progreso" },
      { value: "review", label: "En Revisión" },
      { value: "done", label: "Hecho / Completada" },
      { value: "blocked", label: "Bloqueada" },
    ],
    supportsPriorityFilter: true,
  },
  {
    type: "task.assigned",
    label: "Tarea Asignada",
    description: "Se dispara cuando se asigna o reasigna un responsable a una tarea.",
    category: "task",
    samplePayload: {
      projectId: "proj-101",
      taskId: "task-202",
      taskTitle: "Diseñar arquitectura DB",
      assigneeName: "Carlos Pérez",
    },
    supportsStatusFilter: false,
  },
  {
    type: "milestone.completed",
    label: "Hito Completado",
    description: "Se dispara cuando todos los entregables de un hito se marcan como finalizados.",
    category: "milestone",
    samplePayload: {
      projectId: "proj-101",
      milestoneId: "m-303",
      milestoneTitle: "Fase 1: MVP Backend",
      status: "completed",
    },
    supportsStatusFilter: false,
  },
  {
    type: "comment.created",
    label: "Nuevo Comentario Publicado",
    description: "Se dispara cuando un usuario o cliente agrega un comentario.",
    category: "collaboration",
    samplePayload: {
      projectId: "proj-101",
      userName: "Ana Gómez",
      commentSnippet: "Se subieron los requerimientos de la API.",
    },
    supportsStatusFilter: false,
  },
  {
    type: "file.uploaded",
    label: "Archivo Subido",
    description: "Se dispara cuando se adjunta un nuevo documento o activo.",
    category: "collaboration",
    samplePayload: {
      projectId: "proj-101",
      fileName: "especificaciones_v2.pdf",
      userName: "Carlos Pérez",
    },
    supportsStatusFilter: false,
  },
];

export interface AutomationActionDefinition {
  value: AutomationAction;
  label: string;
  description: string;
  iconName: string;
}

export const AUTOMATION_ACTION_DEFINITIONS: AutomationActionDefinition[] = [
  {
    value: "notify_project_audience",
    label: "Notificar a la audiencia del proyecto",
    description: "Envía una notificación in-app personalizada a los miembros y clientes asignados.",
    iconName: "bell",
  },
  {
    value: "webhook_forward",
    label: "Reenviar evento a Webhook",
    description: "Envía el payload firmado inmediatamente a tus endpoints externos configurados.",
    iconName: "webhook",
  },
];

export interface AutomationTestResult {
  success: boolean;
  ruleName: string;
  event: string;
  conditionsPassed: boolean;
  conditionDetails: string;
  actionExecuted: AutomationAction;
  actionDetails: string;
  simulatedPayload: Record<string, unknown>;
  evaluatedMessage?: string;
  error?: string;
}

export type { AutomationActionConfig, AutomationConditions, AutomationRuleConfig };
