interface HeaderProps {
  children?: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-hairline bg-canvas px-6">
      <div className="flex items-center gap-4">
        <span className="text-title-md font-semibold text-ink">AdmiPy</span>
      </div>
      <div className="flex items-center gap-3">{children}</div>
    </header>
  );
}
