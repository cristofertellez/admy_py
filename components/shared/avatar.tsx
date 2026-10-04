import { cn } from "@/lib/utils";
import Image from "next/image";

interface UserAvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}

function getInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

export function resolveAvatarSrc(avatar: string | null | undefined): string | null {
  if (!avatar) return null;
  if (/^https?:\/\//i.test(avatar)) return avatar;
  return `/api/avatars/${avatar.split("/").map(encodeURIComponent).join("/")}`;
}

export function UserAvatar({ name, src, size = 64, className }: UserAvatarProps) {
  const resolvedSrc = resolveAvatarSrc(src);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-card-elevated text-title-md text-body-strong",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {resolvedSrc ? (
        resolvedSrc.startsWith("/") ? (
          // Historia 14.10 — local avatar paths go through next/image.
          <Image
            src={resolvedSrc}
            alt={name}
            width={size}
            height={size}
            className="h-full w-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- remote signed URLs are incompatible with next/image config
          <img src={resolvedSrc} alt={name} className="h-full w-full object-cover" />
        )
      ) : (
        <span aria-hidden="true">{getInitials(name)}</span>
      )}
    </span>
  );
}
