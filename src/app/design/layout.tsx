import { DesignNav } from "@/components/design/design-nav";
import "@/components/design/scoreboard-variants.css";
import { isDevMockDataEnabled } from "@/lib/dev/mock-data";
import { notFound } from "next/navigation";

export default function DesignLayout({ children }: { children: React.ReactNode }) {
  if (!isDevMockDataEnabled()) {
    notFound();
  }

  return (
    <div className="design-shell">
      <DesignNav />
      {children}
    </div>
  );
}
