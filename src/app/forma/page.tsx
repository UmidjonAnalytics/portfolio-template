"use client";

import { notFound } from "next/navigation";
import { Suspense } from "react";
import { IntakeForm } from "@/components/intake/IntakeForm";
import { intakeEnabled } from "@/lib/intake/types";

/**
 * Customer intake form, Uzbek only. Exists only on the owner's own deployment
 * (NEXT_PUBLIC_INTAKE_ENABLED=true); customer sites built from this template return 404.
 */
export default function FormaPage() {
  if (!intakeEnabled()) notFound();
  return (
    <Suspense fallback={null}>
      <IntakeForm />
    </Suspense>
  );
}
