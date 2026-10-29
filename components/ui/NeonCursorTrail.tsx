"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number };
type LightningBolt = { paths: Path2D[]; born: number; lifetime: number };

/** Lightweight blue lightning bolts branch out between mouse positions. */
export default function NeonCursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const motionPreference = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!motionPreference.matches) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let lastPoint: Point | null = null;
    let cursorPoint: Point | null = null;
    const bolts: LightningBolt[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      requestDraw();
    };

    const buildBolt = (start: Point, end: Point, depth = 0): Path2D[] => {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.hypot(dx, dy);
      const steps = Math.max(2, Math.min(6, Math.ceil(distance / 24)));
      const normalX = -dy / Math.max(distance, 1);
      const normalY = dx / Math.max(distance, 1);
      const points: Point[] = [start];

      for (let step = 1; step < steps; step++) {
        const progress = step / steps;
        const envelope = Math.sin(progress * Math.PI);
        const jitter = (Math.random() - 0.5) * Math.min(20, distance * 0.3) * envelope;
        points.push({
          x: start.x + dx * progress + normalX * jitter,
          y: start.y + dy * progress + normalY * jitter,
        });
      }
      points.push(end);

      const path = new Path2D();
      path.moveTo(start.x, start.y);
      for (const point of points.slice(1)) path.lineTo(point.x, point.y);
      const paths = [path];

      if (depth === 0 && distance > 36) {
        const branchChance = 0.18;
        points.slice(1, -1).forEach((point, index) => {
          if (index % 2 === 0 && Math.random() < branchChance) {
            const direction = Math.atan2(dy, dx) + (Math.random() < 0.5 ? -1 : 1) * (0.8 + Math.random() * 0.45);
            const branchLength = distance * 0.2 * (0.6 + Math.random() * 0.35);
            paths.push(...buildBolt(point, {
              x: point.x + Math.cos(direction) * branchLength,
              y: point.y + Math.sin(direction) * branchLength,
            }, depth + 1));
          }
        });
      }

      return paths;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const current = { x: event.clientX, y: event.clientY };
      cursorPoint = current;
      if (lastPoint && Math.hypot(current.x - lastPoint.x, current.y - lastPoint.y) >= 12) {
        bolts.push({ paths: buildBolt(lastPoint, current), born: performance.now(), lifetime: 190 });
        if (bolts.length > 8) bolts.shift();
      }
      lastPoint = current;
      requestDraw();
    };

    const onPointerLeave = () => {
      cursorPoint = null;
      lastPoint = null;
      bolts.length = 0;
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      context.clearRect(0, 0, width, height);
    };

    const draw = (now: number) => {
      frame = 0;
      context.clearRect(0, 0, width, height);
      for (let index = bolts.length - 1; index >= 0; index--) {
        const bolt = bolts[index];
        const opacity = Math.max(0, 1 - (now - bolt.born) / bolt.lifetime);
        if (!opacity) {
          bolts.splice(index, 1);
          continue;
        }

        context.save();
        context.globalAlpha = opacity;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = "#168bff";
        context.shadowColor = "#168bff";
        context.shadowBlur = 8;
        context.lineWidth = 2.4;
        bolt.paths.forEach((path) => context.stroke(path));
        context.strokeStyle = "#70c8ff";
        context.shadowColor = "#54b9ff";
        context.shadowBlur = 3;
        context.lineWidth = 1;
        bolt.paths.forEach((path) => context.stroke(path));
        context.restore();
      }

      if (cursorPoint) {
        const { x, y } = cursorPoint;
        const orb = context.createRadialGradient(x - 2, y - 2, 0, x, y, 10);
        orb.addColorStop(0, "#f2fbff");
        orb.addColorStop(0.24, "#9bdcff");
        orb.addColorStop(0.62, "#249aff");
        orb.addColorStop(1, "rgb(36 154 255 / 0)");

        context.save();
        context.fillStyle = orb;
        context.shadowColor = "#168bff";
        context.shadowBlur = 8;
        context.beginPath();
        context.arc(x, y, 10, 0, Math.PI * 2);
        context.fill();

        context.globalAlpha = 0.9;
        context.strokeStyle = "#c7edff";
        context.lineWidth = 1.2;
        context.shadowBlur = 8;
        context.beginPath();
        context.arc(x, y, 7, 0, Math.PI * 2);
        context.stroke();

        context.restore();
      }
      // Redraw only while a bolt is fading; a stationary cursor needs no continuous animation.
      if (bolts.length) frame = window.requestAnimationFrame(draw);
    };

    const requestDraw = () => {
      if (!frame) frame = window.requestAnimationFrame(draw);
    };

    resize();
    requestDraw();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="neon-cursor-trail" style={{ pointerEvents: "none" }} />;
}
