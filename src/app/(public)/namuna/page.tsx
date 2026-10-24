"use client";

import { notFound } from "next/navigation";
import { HOME } from "@/lib/home";
import HomePage from "../page";

/** The demo portfolio when the orders deployment gives "/" to the product page (NEXT_PUBLIC_HOME_PATH). */
export default function DemoHome() {
  if (HOME !== "/namuna") notFound();
  return <HomePage />;
}
