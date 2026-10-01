// Pure utilities for mention handling (Historia 9.6).
// Kept free of framework imports so they can be reused and tested in isolation.

const MENTION_PATTERN = /@([a-zA-Z0-9_.-]+)/g;

export interface MentionToken {
  handle: string;
  start: number;
  end: number;
}

export function findMentions(message: string): MentionToken[] {
  const tokens: MentionToken[] = [];
  for (const match of message.matchAll(MENTION_PATTERN)) {
    const index = match.index ?? 0;
    tokens.push({
      handle: match[1],
      start: index,
      end: index + match[0].length,
    });
  }
  return tokens;
}

export function getMentionHandles(message: string): string[] {
  return findMentions(message).map((token) => token.handle);
}