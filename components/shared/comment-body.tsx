"use client";

// Historia 9.5 / 9.6 — Rich comment rendering: basic Markdown and @mentions.
// Kept intentionally small: bold, italic, inline code, links and lists are the
// only constructs enabled per BACKLOG 9.5.

import type { ReactNode } from "react";

const MENTION_PATTERN = /@([a-zA-Z0-9_.-]+)/g;

function renderInline(text: string, mentions: string[]): ReactNode[] {
  const nodes: ReactNode[] = [];
  const mentionSet = new Set(mentions);

  // Split on markdown inline tokens and mentions. Simpler, ordered handling:
  // we walk the string and emit recognized spans.
  let buffer = "";
  let i = 0;

  const flush = () => {
    if (buffer) {
      nodes.push(buffer);
      buffer = "";
    }
  };

  while (i < text.length) {
    const rest = text.slice(i);
    const mentionMatch = rest.match(/^@([a-zA-Z0-9_.-]+)/);
    const boldMatch = rest.match(/^\*\*([^*]+)\*\*/);
    const italicMatch = rest.match(/^_([^_]+)_/);
    const codeMatch = rest.match(/^`([^`]+)`/);
    const linkMatch = rest.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/);

    if (mentionMatch && mentionSet.has(mentionMatch[1])) {
      flush();
      nodes.push(
        <span key={`m-${i}`} className="rounded bg-primary/10 px-1 font-medium text-primary">
          @{mentionMatch[1]}
        </span>,
      );
      i += mentionMatch[0].length;
      continue;
    }

    if (boldMatch) {
      flush();
      nodes.push(<strong key={`b-${i}`}>{boldMatch[1]}</strong>);
      i += boldMatch[0].length;
      continue;
    }

    if (italicMatch) {
      flush();
      nodes.push(<em key={`i-${i}`}>{italicMatch[1]}</em>);
      i += italicMatch[0].length;
      continue;
    }

    if (codeMatch) {
      flush();
      nodes.push(
        <code key={`c-${i}`} className="rounded bg-surface-card-elevated px-1 font-mono text-caption">
          {codeMatch[1]}
        </code>,
      );
      i += codeMatch[0].length;
      continue;
    }

    if (linkMatch) {
      flush();
      nodes.push(
        <a
          key={`l-${i}`}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary underline"
        >
          {linkMatch[1]}
        </a>,
      );
      i += linkMatch[0].length;
      continue;
    }

    buffer += text[i];
    i += 1;
  }

  if (buffer) nodes.push(buffer);
  return nodes;
}

function renderBlocks(text: string, mentions: string[]): ReactNode[] {
  // Only unordered lists are intentionally supported for block-level content.
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (key: number) => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`ul-${key}`} className="my-1 list-inside list-disc space-y-1">
        {listItems.map((item, idx) => (
          <li key={`li-${key}-${idx}`}>{renderInline(item, mentions)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const listMatch = trimmed.match(/^[-*]\s+(.+)$/);

    if (listMatch) {
      listItems.push(listMatch[1]);
      return;
    }

    flushList(index);

    if (trimmed === "") {
      return;
    }

    blocks.push(
      <p key={`p-${index}`} className="whitespace-pre-line break-words">
        {renderInline(trimmed, mentions)}
      </p>,
    );
  });

  flushList(lines.length);
  return blocks;
}

export function CommentBody({ value, mentions = [] }: { value: string; mentions?: string[] }) {
  return <div className="text-body-sm text-body">{renderBlocks(value, mentions)}</div>;
}

export function extractMentionStrings(value: string): string[] {
  return Array.from(value.matchAll(MENTION_PATTERN), (m) => m[1]);
}
