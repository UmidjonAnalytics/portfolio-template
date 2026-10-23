"use client";

import { useReducedMotion, type TargetAndTransition } from "framer-motion";
import { createContext, useContext } from "react";
import { defaultDesign, type LayoutBlock, type LayoutOf, type SiteDesign } from "./design";

const DesignContext = createContext<SiteDesign>(defaultDesign());

/** Provided by SiteDataProvider; outside it (admin) the default design applies. */
export const DesignProvider = DesignContext.Provider;

export function useDesign(): SiteDesign {
  return useContext(DesignContext);
}

export function useLayout<K extends LayoutBlock>(block: K): LayoutOf<K> {
  return useDesign().layouts[block];
}

const SPEED = { slow: 1.6, normal: 1, fast: 0.55 } as const;

/**
 * The entrance animation chosen in Design → Motion. `from(distance)` is the starting state, or
 * false when motion is off (by the owner or by the visitor's reduced-motion setting).
 */
export function useEntrance() {
  const { motion, speed } = useDesign();
  const reduce = useReducedMotion();
  const off = !!reduce || motion === "none";
  const k = SPEED[speed];
  const from = (distance = 22): TargetAndTransition | false => {
    if (off) return false;
    if (motion === "fade") return { opacity: 0 };
    if (motion === "slide") return { opacity: 0, x: -distance * 1.8 };
    if (motion === "zoom") return { opacity: 0, scale: 0.93 };
    return { opacity: 0, y: distance };
  };
  return {
    off,
    from,
    to: { opacity: 1, x: 0, y: 0, scale: 1 },
    /** Scales a duration or delay by the chosen speed. */
    time: (seconds: number) => seconds * k,
  };
}
