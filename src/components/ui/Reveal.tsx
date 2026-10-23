"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { useEntrance } from "@/lib/design-context";

interface RevealProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  delay?: number;
  y?: number;
  once?: boolean;
  className?: string;
}

/** Animates into view when scrolled to, using the site's motion setting. Respects prefers-reduced-motion. */
export function Reveal({ children, delay = 0, y = 22, once = true, className, ...rest }: RevealProps) {
  const { from, to, time } = useEntrance();
  return (
    <motion.div
      initial={from(y)}
      whileInView={to}
      viewport={{ once, margin: "0px 0px -10% 0px" }}
      transition={{ duration: time(0.6), ease: [0.22, 1, 0.36, 1], delay: time(delay) }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Stagger children reveals. */
export function RevealGroup({ children, className, stagger = 0.08 }: { children: ReactNode; className?: string; stagger?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  );
}

export const revealItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};
