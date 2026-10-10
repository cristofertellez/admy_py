import Link from "next/link";

interface HeaderProps {
  children?: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-hairline/80 bg-canvas/80 backdrop-blur-md px-4 sm:px-6 transition-colors lg:pl-72">
      <div className="flex items-center gap-3 lg:hidden">
        <Link href="/dashboard" className="group flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0" />
            </svg>
          </div>
          <span className="text-title-md font-bold tracking-tight text-ink transition-colors group-hover:text-emerald-400">
            Donezo
          </span>
        </Link>
      </div>
      <div className="flex w-full items-center justify-end gap-3">{children}</div>
    </header>
  );
}
