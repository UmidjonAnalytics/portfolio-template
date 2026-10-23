"use client";

import { About } from "@/components/public/About";
import { Blog } from "@/components/public/Blog";
import { Certificates } from "@/components/public/Certificates";
import { Contact } from "@/components/public/Contact";
import { Education } from "@/components/public/Education";
import { Experience } from "@/components/public/Experience";
import { Hero } from "@/components/public/Hero";
import { Projects } from "@/components/public/Projects";
import { Skills } from "@/components/public/Skills";
import { Testimonials } from "@/components/public/Testimonials";
import { SectionSkeleton } from "@/components/ui/Skeleton";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { intakeOnly } from "@/lib/intake/types";
import { useSiteData } from "@/lib/site-data";
import type { SectionKey } from "@/lib/types";

const SECTIONS: Record<SectionKey, { Component: () => React.ReactElement | null; cards: number }> = {
  skills: { Component: Skills, cards: 6 },
  projects: { Component: Projects, cards: 3 },
  experience: { Component: Experience, cards: 2 },
  certificates: { Component: Certificates, cards: 3 },
  education: { Component: Education, cards: 2 },
  testimonials: { Component: Testimonials, cards: 1 },
  blog: { Component: Blog, cards: 3 },
};

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    if (intakeOnly()) router.replace("/forma");
  }, [router]);
  if (intakeOnly()) return null;
  return <Home />;
}

function Home() {
  const { visibleSections, loading, settings } = useSiteData();

  return (
    <>
      <Hero />
      <About />
      {settings.design.order.map((key) => {
        const { Component, cards } = SECTIONS[key];
        if (loading[key] && settings.sections[key] !== false) return <SectionSkeleton key={key} cards={cards} />;
        if (!visibleSections.includes(key)) return null;
        return <Component key={key} />;
      })}
      <Contact />
    </>
  );
}
