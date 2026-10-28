"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Delay before the section animates in, in seconds. */
  delay?: number;
  /** Distance travelled while fading in, in pixels. */
  y?: number;
  /** Fraction of the block that must be visible before it animates. */
  amount?: number;
  id?: string;
};

/**
 * Fades and lifts its children into view once, when they scroll into the viewport.
 * Motion is skipped entirely when the visitor prefers reduced motion.
 */
export default function Reveal({
  children,
  className = "",
  delay = 0,
  y = 28,
  amount = 0.15,
  id,
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div id={id} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
