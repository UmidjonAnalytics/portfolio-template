"use client";

import { DesignDemo, designDemoEnabled } from "@/components/public/DesignDemo";
import { Footer } from "@/components/public/Footer";
import { Header } from "@/components/public/Header";
import { SeoSync } from "@/components/public/SeoSync";
import { SiteDataProvider } from "@/lib/site-data";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteDataProvider mode="public">
      <SeoSync />
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      {designDemoEnabled() && <DesignDemo />}
    </SiteDataProvider>
  );
}
