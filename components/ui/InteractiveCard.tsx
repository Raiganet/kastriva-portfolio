"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type TargetAndTransition,
} from "framer-motion";

type InteractiveCardProps = {
  children: ReactNode;
  className?: string;
  /** Maximum tilt on each axis, in degrees. Set to 0 to disable tilt. */
  tilt?: number;
  /** How far the card lifts on hover, in pixels. */
  lift?: number;
  /** Soft light that follows the pointer across the card. */
  spotlight?: boolean;
  /** RGB triplet used for the pointer light. */
  spotlightColor?: string;
  /** Entrance delay in seconds, for staggered grids. */
  delay?: number;
  /** Set false when a parent already animates this card into view. */
  entrance?: boolean;
  animate?: TargetAndTransition;
  exit?: TargetAndTransition;
  layout?: boolean;
  onClick?: () => void;
};

const SPRING = { stiffness: 220, damping: 22, mass: 0.4 };

export default function InteractiveCard({
  children,
  className = "",
  tilt = 7,
  lift = 6,
  spotlight = true,
  spotlightColor = "108, 92, 231",
  delay = 0,
  entrance = true,
  animate,
  exit,
  layout = false,
  onClick,
}: InteractiveCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  const rotateX = useSpring(0, SPRING);
  const rotateY = useSpring(0, SPRING);
  const lightX = useMotionValue(50);
  const lightY = useMotionValue(50);
  const light = useMotionTemplate`radial-gradient(260px circle at ${lightX}% ${lightY}%, rgba(${spotlightColor}, 0.2), transparent 72%)`;

  const interactive = !reduceMotion;

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node || !interactive || tilt === 0) return;
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dx = (event.clientX - rect.left) / rect.width - 0.5;
    const dy = (event.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(-dy * tilt * 2);
    rotateY.set(dx * tilt * 2);
    lightX.set((dx + 0.5) * 100);
    lightY.set((dy + 0.5) * 100);
  };

  const handlePointerEnter = () => {
    if (interactive) setHovered(true);
  };

  const reset = () => {
    setHovered(false);
    rotateX.set(0);
    rotateY.set(0);
    lightX.set(50);
    lightY.set(50);
  };

  return (
    <motion.div
      ref={ref}
      layout={layout}
      initial={entrance ? { opacity: 0, y: 26 } : false}
      whileInView={entrance ? { opacity: 1, y: 0 } : undefined}
      viewport={entrance ? { once: true, margin: "-60px" } : undefined}
      animate={animate}
      exit={exit}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={
        interactive && lift > 0
          ? { y: -lift, transition: { type: "spring", stiffness: 300, damping: 24 } }
          : undefined
      }
      whileTap={interactive ? { scale: 0.985, transition: { duration: 0.12 } } : undefined}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={reset}
      onPointerCancel={reset}
      onClick={onClick}
      style={{
        rotateX: interactive ? rotateX : 0,
        rotateY: interactive ? rotateY : 0,
        transformPerspective: 1000,
        isolation: "isolate",
      }}
      className={`relative ${className}`}
    >
      {spotlight && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit]"
          style={{ backgroundImage: light }}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.25 }}
        />
      )}
      {children}
    </motion.div>
  );
}
