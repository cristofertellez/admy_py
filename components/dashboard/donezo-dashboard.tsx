"use client";

import { useState, useEffect, useId } from "react";
import Link from "next/link";
import type { DeveloperDashboardData } from "@/features/dashboard";

interface DonezoDashboardProps {
  data: DeveloperDashboardData;
  filterSlot?: React.ReactNode;
  additionalWidgetsSlot?: React.ReactNode;
}

export function DonezoDashboard({
  data,
  filterSlot,
  additionalWidgetsSlot,
}: DonezoDashboardProps) {
  const { stats } = data;
  const patternId = useId();

  // Interactive Live Time Tracker state (starting at 01:24:08 = 5048 seconds)
  const [timerSeconds, setTimerSeconds] = useState(5048);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  // Projects list: real projects from DB or aesthetic fallbacks
  const projectsList =
    data.recentProjects && data.recentProjects.length > 0
      ? data.recentProjects.slice(0, 5)
      : [
          { id: "p1", name: "Develop API Endpoints", estimated_end_date: "2024-11-26", status: "In Progress" },
          { id: "p2", name: "Onboarding Flow", estimated_end_date: "2024-11-28", status: "In Progress" },
          { id: "p3", name: "Build Dashboard", estimated_end_date: "2024-11-30", status: "Completed" },
          { id: "p4", name: "Optimize Page Load", estimated_end_date: "2024-12-05", status: "In Progress" },
          { id: "p5", name: "Cross-Browser Testing", estimated_end_date: "2024-12-06", status: "Pending" },
        ];

  // Team collaboration items: real assigned tasks or aesthetic fallbacks
  const teamList =
    data.teamCollaboration && data.teamCollaboration.length > 0
      ? data.teamCollaboration.slice(0, 4)
      : [
          {
            id: "m1",
            first_name: "Alexandra",
            last_name: "Deff",
            avatar: null,
            task_title: "Github Project Repository",
            task_status: "Completed",
          },
          {
            id: "m2",
            first_name: "Edwin",
            last_name: "Adenike",
            avatar: null,
            task_title: "Integrate User Authentication System",
            task_status: "In Progress",
          },
          {
            id: "m3",
            first_name: "Isaac",
            last_name: "Oluwatemilorun",
            avatar: null,
            task_title: "Develop Search and Filter Functionality",
            task_status: "Pending",
          },
          {
            id: "m4",
            first_name: "David",
            last_name: "Oshodi",
            avatar: null,
            task_title: "Responsive Layout for Homepage",
            task_status: "In Progress",
          },
        ];

  // Reminder info from upcoming milestones or fallback
  const reminder =
    data.upcomingMilestones && data.upcomingMilestones.length > 0
      ? {
          title: `Milestone: ${data.upcomingMilestones[0].title}`,
          time: `Due: ${new Date(data.upcomingMilestones[0].estimated_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
          href: data.upcomingMilestones[0].project_id
            ? `/dashboard/projects/${data.upcomingMilestones[0].project_id}/milestones`
            : "/dashboard/projects",
        }
      : {
          title: "Meeting with Arc Company",
          time: "Time : 02.00 pm - 04.00 pm",
          href: "/dashboard/projects",
        };

  // Metrics calculation
  const totalProjects = stats.totalProjects || 24;
  const completedProjects = stats.completedProjects || 10;
  const activeProjects = stats.activeProjects || 12;
  const pendingProjects =
    stats.totalProjects > 0
      ? Math.max(stats.totalProjects - stats.activeProjects - stats.completedProjects, 0)
      : 2;
  const progressPercent = Math.round(stats.averageProgress || 41);

  return (
    <div className="space-y-6">
      {/* 1. DASHBOARD HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Plan, prioritize, and accomplish your tasks with ease.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {filterSlot && (
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 rounded-full border border-hairline/90 bg-surface-card px-4 py-2.5 text-xs font-medium text-ink transition-colors hover:bg-surface-card-elevated"
            >
              <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {showFilters ? "Hide Filters" : "Filters"}
            </button>
          )}

          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-2 rounded-full bg-[#133827] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#1a4b35] hover:shadow-md"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Project
          </Link>

          <Link
            href="/dashboard/import"
            className="inline-flex items-center gap-2 rounded-full border border-hairline-strong bg-transparent px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-card-elevated"
          >
            Import Data
          </Link>
        </div>
      </div>

      {/* FILTER BAR EXPANDED */}
      {showFilters && filterSlot && (
        <div className="rounded-2xl border border-hairline/80 bg-surface-card p-4 transition-all">
          {filterSlot}
        </div>
      )}

      {/* 2. TOP METRIC CARDS (4 COLUMNS) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* CARD 1: Total Projects (Featured Hero Card) */}
        <Link
          href="/dashboard/projects"
          className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#1d4635] bg-[#112d20] p-6 text-white shadow-md transition-all duration-200 hover:border-emerald-600/50 hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-200/90">Total Projects</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-transform duration-200 group-hover:scale-110 group-hover:bg-white/20">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </div>
          </div>
          <div className="my-3 text-4xl font-bold tracking-tight text-white lg:text-5xl">
            {totalProjects}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
              Increased from last month
            </span>
          </div>
        </Link>

        {/* CARD 2: Ended Projects */}
        <Link
          href="/dashboard/projects?status=Completed"
          className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-hairline/80 bg-surface-card p-6 shadow-xs transition-all duration-200 hover:border-hairline-strong hover:bg-surface-card-elevated"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">Ended Projects</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline bg-transparent text-muted transition-colors group-hover:border-hairline-strong group-hover:text-ink">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </div>
          </div>
          <div className="my-3 text-4xl font-bold tracking-tight text-ink lg:text-5xl">
            {completedProjects}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-card-elevated px-2.5 py-0.5 text-xs font-medium text-muted">
              <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
              Increased from last month
            </span>
          </div>
        </Link>

        {/* CARD 3: Running Projects */}
        <Link
          href="/dashboard/projects?status=In+Progress"
          className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-hairline/80 bg-surface-card p-6 shadow-xs transition-all duration-200 hover:border-hairline-strong hover:bg-surface-card-elevated"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">Running Projects</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline bg-transparent text-muted transition-colors group-hover:border-hairline-strong group-hover:text-ink">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </div>
          </div>
          <div className="my-3 text-4xl font-bold tracking-tight text-ink lg:text-5xl">
            {activeProjects}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-card-elevated px-2.5 py-0.5 text-xs font-medium text-muted">
              <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
              Increased from last month
            </span>
          </div>
        </Link>

        {/* CARD 4: Pending Project */}
        <Link
          href="/dashboard/projects?status=Pending"
          className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-hairline/80 bg-surface-card p-6 shadow-xs transition-all duration-200 hover:border-hairline-strong hover:bg-surface-card-elevated"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">Pending Project</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline bg-transparent text-muted transition-colors group-hover:border-hairline-strong group-hover:text-ink">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </div>
          </div>
          <div className="my-3 text-4xl font-bold tracking-tight text-ink lg:text-5xl">
            {pendingProjects}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted">On Discuss</span>
          </div>
        </Link>
      </div>

      {/* 3. MIDDLE ROW (3 COLUMNS) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* COL 1: Project Analytics (Pill Bar Chart) */}
        <div className="flex flex-col justify-between rounded-3xl border border-hairline/80 bg-surface-card p-6 shadow-xs lg:col-span-4">
          <h2 className="text-base font-semibold text-ink">Project Analytics</h2>

          {/* 7-DAY PILL CHART CONTAINER */}
          <div className="my-4 flex h-48 items-end justify-between gap-2 px-1 sm:px-2">
            {/* Sunday (S) - Striped */}
            <div className="flex flex-1 flex-col items-center">
              <div
                className="w-full max-w-[36px] rounded-full border border-dashed border-white/20 transition-all hover:border-white/40"
                style={{
                  height: "90px",
                  background:
                    "repeating-linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.06) 5px, transparent 5px, transparent 10px)",
                }}
              />
              <span className="mt-3 text-xs font-medium text-muted">S</span>
            </div>

            {/* Monday (M) - Solid dark green */}
            <div className="flex flex-1 flex-col items-center">
              <div
                className="w-full max-w-[36px] rounded-full bg-[#123826] transition-all hover:bg-[#184a33]"
                style={{ height: "130px" }}
              />
              <span className="mt-3 text-xs font-medium text-muted">M</span>
            </div>

            {/* Tuesday (T) - Solid bright green with floating tooltip */}
            <div className="flex flex-1 flex-col items-center">
              <div className="relative flex flex-col items-center">
                <span className="absolute -top-7 rounded-full border border-hairline bg-surface-card-elevated px-2 py-0.5 text-[10px] font-semibold text-emerald-400 shadow-sm">
                  74%
                </span>
                <div
                  className="w-full max-w-[36px] rounded-full bg-[#34d399] transition-all hover:bg-[#10b981]"
                  style={{ height: "108px", width: "36px" }}
                />
              </div>
              <span className="mt-3 text-xs font-medium text-muted">T</span>
            </div>

            {/* Wednesday (W) - Deepest dark green (tallest) */}
            <div className="flex flex-1 flex-col items-center">
              <div
                className="w-full max-w-[36px] rounded-full bg-[#0a2318] transition-all hover:bg-[#0f3223]"
                style={{ height: "148px" }}
              />
              <span className="mt-3 text-xs font-medium text-muted">W</span>
            </div>

            {/* Thursday (T) - Striped */}
            <div className="flex flex-1 flex-col items-center">
              <div
                className="w-full max-w-[36px] rounded-full border border-dashed border-white/20 transition-all hover:border-white/40"
                style={{
                  height: "98px",
                  background:
                    "repeating-linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.06) 5px, transparent 5px, transparent 10px)",
                }}
              />
              <span className="mt-3 text-xs font-medium text-muted">T</span>
            </div>

            {/* Friday (F) - Striped */}
            <div className="flex flex-1 flex-col items-center">
              <div
                className="w-full max-w-[36px] rounded-full border border-dashed border-white/20 transition-all hover:border-white/40"
                style={{
                  height: "78px",
                  background:
                    "repeating-linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.06) 5px, transparent 5px, transparent 10px)",
                }}
              />
              <span className="mt-3 text-xs font-medium text-muted">F</span>
            </div>

            {/* Saturday (S) - Striped */}
            <div className="flex flex-1 flex-col items-center">
              <div
                className="w-full max-w-[36px] rounded-full border border-dashed border-white/20 transition-all hover:border-white/40"
                style={{
                  height: "88px",
                  background:
                    "repeating-linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.06) 5px, transparent 5px, transparent 10px)",
                }}
              />
              <span className="mt-3 text-xs font-medium text-muted">S</span>
            </div>
          </div>
        </div>

        {/* COL 2: Reminders Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-hairline/80 bg-surface-card p-6 shadow-xs lg:col-span-4">
          <h2 className="text-base font-semibold text-ink">Reminders</h2>

          <div className="my-auto py-4">
            <h3 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              {reminder.title}
            </h3>
            <p className="mt-2 text-sm text-muted">{reminder.time}</p>
          </div>

          <Link
            href={reminder.href}
            className="flex w-full items-center justify-center gap-2.5 rounded-full bg-[#133827] py-3.5 px-6 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#1a4b35] hover:shadow-md"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
            </svg>
            Start Meeting
          </Link>
        </div>

        {/* COL 3: Project List */}
        <div className="flex flex-col rounded-3xl border border-hairline/80 bg-surface-card p-6 shadow-xs lg:col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Project</h2>
            <Link
              href="/dashboard/projects"
              className="rounded-full border border-hairline px-3 py-1 text-xs font-medium text-body-strong transition-colors hover:border-hairline-strong hover:bg-surface-card-elevated hover:text-ink"
            >
              + New
            </Link>
          </div>

          <div className="space-y-3.5">
            {projectsList.map((project, idx) => (
              <Link
                key={`${project.id}-${idx}`}
                href={`/dashboard/projects/${project.id}`}
                className="group flex items-center gap-3.5 rounded-xl p-1.5 transition-colors hover:bg-surface-card-elevated/50"
              >
                {/* Custom Geometric Icons matching the design */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-card-elevated">
                  {idx % 5 === 0 && (
                    <svg className="h-5 w-5 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 4h3l-5 16H1L6 4zm7 0h3l-5 16h-3L13 4zm7 0h3l-5 16h-3L20 4z" />
                    </svg>
                  )}
                  {idx % 5 === 1 && (
                    <svg className="h-5 w-5 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <circle cx="12" cy="12" r="9" />
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                  )}
                  {idx % 5 === 2 && (
                    <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
                    </svg>
                  )}
                  {idx % 5 === 3 && (
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                    </svg>
                  )}
                  {idx % 5 === 4 && (
                    <svg className="h-5 w-5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="6" cy="8" r="4" />
                      <circle cx="18" cy="8" r="4" />
                      <circle cx="12" cy="17" r="4" />
                    </svg>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink transition-colors group-hover:text-emerald-400">
                    {project.name}
                  </p>
                  <p className="truncate text-xs text-muted">
                    Due date:{" "}
                    {project.estimated_end_date
                      ? new Date(project.estimated_end_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Pending"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 4. BOTTOM ROW (3 COLUMNS) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* COL 1: Team Collaboration */}
        <div className="flex flex-col rounded-3xl border border-hairline/80 bg-surface-card p-6 shadow-xs lg:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Team Collaboration</h2>
            <Link
              href="/dashboard/users"
              className="rounded-full border border-hairline px-3 py-1 text-xs font-medium text-body-strong transition-colors hover:border-hairline-strong hover:bg-surface-card-elevated hover:text-ink"
            >
              + Add Member
            </Link>
          </div>

          <div className="space-y-3.5">
            {teamList.map((member, idx) => {
              const fullName = `${member.first_name} ${member.last_name}`.trim();
              const isCompleted = member.task_status === "Completed";
              const isPending = member.task_status === "Pending" || member.task_status === "Blocked";

              return (
                <div key={`${member.id}-${idx}`} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {/* Avatar with distinctive background tone */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${
                        idx === 0
                          ? "bg-rose-900/60 text-rose-200 border border-rose-700/50"
                          : idx === 1
                          ? "bg-emerald-900/60 text-emerald-200 border border-emerald-700/50"
                          : idx === 2
                          ? "bg-indigo-900/60 text-indigo-200 border border-indigo-700/50"
                          : "bg-amber-900/60 text-amber-200 border border-amber-700/50"
                      }`}
                    >
                      {member.first_name[0]}
                      {member.last_name[0] ?? ""}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{fullName}</p>
                      <p className="truncate text-xs text-muted">
                        Working on{" "}
                        <span className="text-body-strong font-normal">{member.task_title}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Pill Badge */}
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      isCompleted
                        ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                        : isPending
                        ? "border border-rose-500/20 bg-rose-500/10 text-rose-400"
                        : "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {member.task_status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* COL 2: Project Progress (Semi-circle Gauge) */}
        <div className="flex flex-col justify-between rounded-3xl border border-hairline/80 bg-surface-card p-6 shadow-xs lg:col-span-4">
          <h2 className="text-base font-semibold text-ink">Project Progress</h2>

          {/* SVG SEMI-CIRCULAR GAUGE */}
          <div className="relative my-auto flex flex-col items-center justify-center pt-2">
            <svg viewBox="0 0 240 135" className="w-56 max-w-full">
              <defs>
                <pattern
                  id={`${patternId}-gauge-stripes`}
                  width="8"
                  height="8"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                </pattern>
              </defs>

              {/* Base background arc track */}
              <path
                d="M 30 120 A 90 90 0 0 1 210 120"
                fill="none"
                stroke="#18231e"
                strokeWidth="24"
                strokeLinecap="round"
              />

              {/* Segment 3: Pending (Striped pattern) */}
              <path
                d="M 160 38 A 90 90 0 0 1 210 120"
                fill="none"
                stroke={`url(#${patternId}-gauge-stripes)`}
                strokeWidth="24"
                strokeLinecap="round"
              />

              {/* Segment 2: In Progress (Vibrant Emerald) */}
              <path
                d="M 90 35 A 90 90 0 0 1 165 40"
                fill="none"
                stroke="#10b981"
                strokeWidth="24"
              />

              {/* Segment 1: Completed (Deep Forest Emerald) */}
              <path
                d="M 30 120 A 90 90 0 0 1 95 36"
                fill="none"
                stroke="#0f3d28"
                strokeWidth="24"
                strokeLinecap="round"
              />
            </svg>

            {/* Value in the center of the arc */}
            <div className="absolute top-16 text-center">
              <span className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
                {progressPercent}%
              </span>
              <p className="text-xs font-medium text-muted">Project Ended</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-muted">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#0f3d28]" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full border border-dashed border-white/40"
                style={{
                  background:
                    "repeating-linear-gradient(45deg, rgba(255,255,255,0.3), rgba(255,255,255,0.3) 2px, transparent 2px, transparent 4px)",
                }}
              />
              <span>Pending</span>
            </div>
          </div>
        </div>

        {/* COL 3: Time Tracker */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-emerald-900/30 bg-[#081a12] p-6 shadow-md min-h-[220px] lg:col-span-3">
          {/* Abstract topographic wavy contours in the background */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
            viewBox="0 0 300 240"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M0 50 C 80 20, 150 90, 300 30"
              stroke="#34d399"
              strokeWidth="2"
            />
            <path
              d="M0 90 C 100 60, 180 130, 300 70"
              stroke="#34d399"
              strokeWidth="2"
            />
            <path
              d="M0 130 C 90 100, 200 170, 300 110"
              stroke="#34d399"
              strokeWidth="2"
            />
            <path
              d="M0 170 C 110 140, 190 210, 300 150"
              stroke="#34d399"
              strokeWidth="2"
            />
            <path
              d="M0 210 C 100 180, 220 240, 300 190"
              stroke="#34d399"
              strokeWidth="2"
            />
          </svg>

          <span className="z-10 text-sm font-medium text-white/90">Time Tracker</span>

          {/* Glowing Monospace Timer */}
          <div className="z-10 my-4 text-center">
            <span className="font-mono text-3xl font-bold tracking-widest text-white sm:text-4xl drop-shadow-[0_2px_10px_rgba(52,211,153,0.3)]">
              {formatTimer(timerSeconds)}
            </span>
          </div>

          {/* Interactive Controls */}
          <div className="z-10 flex items-center justify-center gap-4">
            {/* Pause / Play Button */}
            <button
              type="button"
              onClick={() => setIsTimerRunning((prev) => !prev)}
              aria-label={isTimerRunning ? "Pause time tracker" : "Resume time tracker"}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-md transition-all hover:scale-105 active:scale-95"
            >
              {isTimerRunning ? (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Stop / Reset Button */}
            <button
              type="button"
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(0);
              }}
              aria-label="Stop and reset time tracker"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ef4444] text-white shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 5. OPTIONAL ADDITIONAL CONFIGURED WIDGETS (Historia 11.11 personalizable widgets) */}
      {additionalWidgetsSlot && (
        <div className="pt-6">
          <div className="mb-4 flex items-center gap-2 border-t border-hairline pt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
              System Widgets & Analytics
            </h3>
          </div>
          {additionalWidgetsSlot}
        </div>
      )}
    </div>
  );
}
