import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 ml-64 p-6 custom-scrollbar overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
