interface SidebarProps {
  children?: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-64 flex-col border-r border-hairline bg-canvas lg:flex">
      <nav className="flex-1 overflow-y-auto p-4">{children}</nav>
    </aside>
  );
}
