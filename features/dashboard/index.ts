export {
  DashboardService,
  assessAtRiskProject,
  getCommentContextHref,
} from "./dashboard.service";
export {
  getPanelWidgets,
  parseWidgetLayout,
  resolveWidgetLayout,
} from "./dashboard-widgets";
export type {
  DashboardFilters,
  AdminOverview,
  AdminUserStats,
  RoleDistributionItem,
  RecentLogin,
  DueSoonProject,
  IntermediaryPanelData,
  IntermediaryPanelStats,
  PendingTaskSummary,
  CommentContextType,
  RecentCommentItem,
  RecentFileItem,
  ProjectStatusCount,
  DashboardAtRiskProject,
  DeveloperDashboardData,
  ClientDashboardProject,
  ClientDashboardData,
} from "./dashboard.service";
export type {
  DashboardPanelId,
  DashboardWidgetConfig,
  DashboardWidgetDefinition,
  WidgetLayoutMap,
} from "./dashboard-widgets";
