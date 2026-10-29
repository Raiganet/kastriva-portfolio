"use client";

import { useEffect, useRef } from "react";

type TrailPoint = { x: number; y: number; time: number };

/** A subtle neon ribbon that follows a mouse without intercepting page input. */
export default function NeonCursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const media = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!media.matches) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    const points: TrailPoint[] = [];
    const lifetime = 900;

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

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const last = points[points.length - 1];
      if (last && Math.hypot(event.clientX - last.x, event.clientY - last.y) < 3) return;
      points.push({ x: event.clientX, y: event.clientY, time: performance.now() });
      if (points.length > 36) points.shift();
    };

    const draw = (now: number) => {
      context.clearRect(0, 0, width, height);
      while (points.length && now - points[0].time > lifetime) points.shift();

      if (points.length > 1) {
        const age = now - points[0].time;
        const fade = Math.max(0, 1 - age / lifetime);
        const path = new Path2D();
        path.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 1; i++) {
          const midpointX = (points[i].x + points[i + 1].x) / 2;
          const midpointY = (points[i].y + points[i + 1].y) / 2;
          path.quadraticCurveTo(points[i].x, points[i].y, midpointX, midpointY);
        }
        const last = points[points.length - 1];
        path.lineTo(last.x, last.y);

        const gradient = context.createLinearGradient(points[0].x, points[0].y, last.x, last.y);
        gradient.addColorStop(0, "#ff4fd8");
        gradient.addColorStop(0.48, "#8b5cf6");
        gradient.addColorStop(1, "#39f5c7");

        context.save();
        context.globalAlpha = fade * 0.72;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = gradient;
        context.shadowColor = "#a855f7";
        context.shadowBlur = 18;
        context.lineWidth = 5;
        context.stroke(path);
        context.globalAlpha = fade * 0.95;
        context.shadowBlur = 7;
        context.lineWidth = 1.5;
        context.stroke(path);
        context.restore();
      }

      frame = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    frame = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="neon-cursor-trail" />;
}

