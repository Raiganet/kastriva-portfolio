"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number };
type LightningBolt = { paths: Path2D[]; born: number; lifetime: number };

/** Brief blue lightning bolts branch out between mouse positions. */
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
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const buildBolt = (start: Point, end: Point, depth = 0): Path2D[] => {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.hypot(dx, dy);
      const steps = Math.max(3, Math.min(12, Math.ceil(distance / 13)));
      const normalX = -dy / Math.max(distance, 1);
      const normalY = dx / Math.max(distance, 1);
      const points: Point[] = [start];

      for (let step = 1; step < steps; step++) {
        const progress = step / steps;
        const envelope = Math.sin(progress * Math.PI);
        const jitter = (Math.random() - 0.5) * Math.min(42, distance * 0.55) * envelope;
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

      if (depth < 2 && distance > 20) {
        const branchChance = depth === 0 ? 0.52 : 0.24;
        points.slice(1, -1).forEach((point, index) => {
          if (index % 2 === 0 && Math.random() < branchChance) {
            const direction = Math.atan2(dy, dx) + (Math.random() < 0.5 ? -1 : 1) * (0.65 + Math.random() * 0.85);
            const branchLength = distance * (depth === 0 ? 0.34 : 0.22) * (0.55 + Math.random() * 0.45);
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
      if (lastPoint && Math.hypot(current.x - lastPoint.x, current.y - lastPoint.y) >= 7) {
        bolts.push({ paths: buildBolt(lastPoint, current), born: performance.now(), lifetime: 360 });
        if (bolts.length > 24) bolts.shift();
      }
      lastPoint = current;
    };

    const onPointerLeave = () => {
      cursorPoint = null;
      lastPoint = null;
    };

    const draw = (now: number) => {
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
        context.shadowBlur = 22;
        context.lineWidth = 5;
        bolt.paths.forEach((path) => context.stroke(path));
        context.strokeStyle = "#70c8ff";
        context.shadowColor = "#54b9ff";
        context.shadowBlur = 10;
        context.lineWidth = 2;
        bolt.paths.forEach((path) => context.stroke(path));
        context.strokeStyle = "#e8f7ff";
        context.shadowBlur = 4;
        context.lineWidth = 0.8;
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
        context.shadowBlur = 18;
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

        const rotation = now / 1500;
        context.strokeStyle = "#72caff";
        context.lineWidth = 1.3;
        context.lineCap = "round";
        for (let spark = 0; spark < 4; spark++) {
          const angle = rotation + spark * (Math.PI / 2);
          const innerRadius = 10;
          const outerRadius = spark % 2 === 0 ? 15 : 13;
          context.beginPath();
          context.moveTo(x + Math.cos(angle) * innerRadius, y + Math.sin(angle) * innerRadius);
          context.lineTo(x + Math.cos(angle + 0.16) * (outerRadius - 2), y + Math.sin(angle + 0.16) * (outerRadius - 2));
          context.lineTo(x + Math.cos(angle + 0.3) * outerRadius, y + Math.sin(angle + 0.3) * outerRadius);
          context.stroke();
        }
        context.restore();
      }
      frame = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    frame = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="neon-cursor-trail" style={{ pointerEvents: "none" }} />;
}
