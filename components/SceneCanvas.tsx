"use client";

import { useEffect, useMemo, useRef } from "react";

type SceneCanvasProps = {
  accent: string;
  background: string;
  beat: number;
};

const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function SceneCanvas({ accent, background, beat }: SceneCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const palette = useMemo(
    () => ({ accentColor: accent || "#ff3f8e", backgroundColor: background || "#050508" }),
    [accent, background]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrame: number;

    const resize = () => {
      const { clientWidth, clientHeight } = canvas;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = clientWidth * dpr;
      canvas.height = clientHeight * dpr;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr, dpr);
    };

    resize();

    const render = (time: number) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      context.clearRect(0, 0, width, height);

      const t = (time / 1000) * 0.35 + beat * 0.6;
      const centerX = width / 2;
      const centerY = height / 2;

      const gradient = context.createRadialGradient(centerX, centerY, 18, centerX, centerY, Math.max(width, height));
      gradient.addColorStop(0, hexToRgba(palette.accentColor, 0.34));
      gradient.addColorStop(0.45, hexToRgba(palette.accentColor, 0.12));
      gradient.addColorStop(1, palette.backgroundColor);

      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      const rings = 7;
      for (let i = 0; i < rings; i += 1) {
        const radius = (Math.max(width, height) * (i + 1)) / rings;
        const wobble = Math.sin(t * (0.8 + i * 0.1)) * 12 * (i / rings);
        context.beginPath();
        context.ellipse(centerX, centerY, radius + wobble, radius + wobble * 0.6, 0, 0, Math.PI * 2);
        context.strokeStyle = hexToRgba(palette.accentColor, Math.max(0.08, 0.38 - i * 0.05));
        context.lineWidth = 1.5 + i * 0.4;
        context.globalAlpha = 0.6 - i * 0.08;
        context.stroke();
      }

      const shards = 64;
      context.globalAlpha = 0.35;
      for (let i = 0; i < shards; i += 1) {
        const angle = (i / shards) * Math.PI * 2 + t * 0.5;
        const length = (Math.sin(t * 2 + i) + 1.5) * 35;
        const startR = Math.max(width, height) * 0.15;
        const endR = startR + length;
        const startX = centerX + Math.cos(angle) * startR;
        const startY = centerY + Math.sin(angle) * startR;
        const endX = centerX + Math.cos(angle) * endR;
        const endY = centerY + Math.sin(angle) * endR;
        const gradientLine = context.createLinearGradient(startX, startY, endX, endY);
        gradientLine.addColorStop(0, hexToRgba(palette.accentColor, 0));
        gradientLine.addColorStop(1, hexToRgba(palette.accentColor, 0.66));
        context.strokeStyle = gradientLine;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(endX, endY);
        context.stroke();
      }

      animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, [beat, palette]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}
