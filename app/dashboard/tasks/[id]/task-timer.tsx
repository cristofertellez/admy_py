"use client";

import { useCallback, useEffect, useState } from "react";
import { createTimeEntry } from "@/actions/time-entries";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms";

// Running-timer state survives reloads and navigation through localStorage so
// tracked time is never lost mid-session (Historia 7.12 QA: persistencia).
interface StoredTimer {
  taskId: string;
  startedAt: number;
  accumulatedMs: number;
  running: boolean;
}

const TIMER_STORAGE_KEY = "pwa-task-timer-v1";
const MIN_LOGGABLE_HOURS = 0.01;

function readStoredTimer(): StoredTimer | null {
  try {
    const raw = window.localStorage.getItem(TIMER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredTimer) : null;
  } catch {
    return null;
  }
}

function persistTimer(timer: StoredTimer | null) {
  try {
    if (timer) {
      window.localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timer));
    } else {
      window.localStorage.removeItem(TIMER_STORAGE_KEY);
    }
  } catch {
    // Storage unavailable (private mode): timer keeps working in memory.
  }
}

function todayLocalDate(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function roundHours(ms: number): number {
  return Math.round(ms / 36_000) / 100;
}

interface Props {
  taskId: string;
}

export function TaskTimer({ taskId }: Props) {
  const [timer, setTimer] = useState<StoredTimer | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [showFinish, setShowFinish] = useState(false);
  const [description, setDescription] = useState("");
  const [feedback, setFeedback] = useState<{ success?: string; error?: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTimer(readStoredTimer());
  }, []);

  useEffect(() => {
    if (!timer?.running) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [timer?.running]);

  const elapsedMs = timer
    ? timer.accumulatedMs + (timer.running ? Math.max(0, now - timer.startedAt) : 0)
    : 0;

  const update = useCallback((next: StoredTimer | null) => {
    setTimer(next);
    persistTimer(next);
  }, []);

  function start() {
    setFeedback(null);
    update({ taskId, startedAt: Date.now(), accumulatedMs: 0, running: true });
    setNow(Date.now());
  }

  function pause() {
    if (!timer) return;
    update({
      ...timer,
      running: false,
      accumulatedMs: timer.accumulatedMs + Math.max(0, Date.now() - timer.startedAt),
    });
  }

  function resume() {
    if (!timer) return;
    update({ ...timer, running: true, startedAt: Date.now() });
    setNow(Date.now());
  }

  async function confirmFinish() {
    if (!timer) return;
    const hours = roundHours(elapsedMs);
    if (hours < MIN_LOGGABLE_HOURS) {
      setShowFinish(false);
      setFeedback({ error: "Elapsed time is too short to log." });
      update(null);
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.set("task_id", taskId);
      formData.set("date", todayLocalDate());
      formData.set("total_hours", String(hours));
      if (description.trim()) formData.set("description", description.trim());

      const result = await createTimeEntry(null, formData);
      if (result.error) {
        setFeedback({ error: result.error });
      } else {
        update(null);
        setShowFinish(false);
        setDescription("");
        setFeedback({ success: `Logged ${hours.toFixed(2)}h from timer.` });
      }
    } catch {
      setFeedback({ error: "Unexpected error. Please try again." });
    } finally {
      setIsSaving(false);
    }
  }

  const belongsToThisTask = timer?.taskId === taskId;

  return (
    <div className="rounded-lg bg-surface-hover p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-caption-uppercase font-semibold text-muted">Timer</p>
          <p className="mt-1 text-display-sm text-ink tabular-nums" aria-live="off">
            {formatElapsed(elapsedMs)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!timer && <Button onClick={start}>Start</Button>}
          {timer && !belongsToThisTask && (
            <span className="text-body-sm text-warning">Timer running on another task.</span>
          )}
          {belongsToThisTask && (
            <>
              {timer.running ? (
                <Button variant="secondary" onClick={pause}>Pause</Button>
              ) : (
                <Button variant="secondary" onClick={resume}>Resume</Button>
              )}
              {!showFinish && <Button onClick={() => setShowFinish(true)}>Finish</Button>}
            </>
          )}
        </div>
      </div>

      {showFinish && belongsToThisTask && (
        <div className="mt-4 space-y-3 border-t border-hairline-soft pt-4">
          <p className="text-body-sm text-body">
            Log <span className="font-semibold">{roundHours(elapsedMs).toFixed(2)}h</span> to this task?
          </p>
          <FormField
            label="Description (optional)"
            name="timer_description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What did you work on?"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowFinish(false)}
              disabled={isSaving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="button" onClick={confirmFinish} disabled={isSaving} className="flex-1">
              {isSaving ? "Saving..." : "Log time"}
            </Button>
          </div>
        </div>
      )}

      {(feedback?.success || feedback?.error) && (
        <p
          role="status"
          aria-live="polite"
          className={`mt-3 text-body-sm ${feedback.success ? "text-success" : "text-error"}`}
        >
          {feedback.success || feedback.error}
        </p>
      )}
    </div>
  );
}
