import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";

interface LayoutWrapperProps {
  children: ReactNode;
  /** When true, removes content padding so the page can render fullscreen (e.g. hero). */
  fullscreen?: boolean;
}

const LayoutWrapper = ({ children, fullscreen }: LayoutWrapperProps) => {
  return (
    <div className="min-h-screen bg-[hsl(var(--bg-deep))] text-cream">
      <AppSidebar />
      <main
        className={
          fullscreen
            ? "lg:pl-[280px] md:pl-[88px] min-h-screen"
            : "lg:pl-[280px] md:pl-[88px] min-h-screen px-4 sm:px-6 lg:px-10 py-8 pt-20 lg:pt-8"
        }
      >
        {children}
      </main>
    </div>
  );
};

export default LayoutWrapper;