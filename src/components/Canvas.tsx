import { useEffect, useRef, useState } from "react";

class Vector2 {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

const GRID_ROWS = 10;
const GRID_COLS = 10;

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [p2, setP2] = useState<Vector2 | null>(null);

  function drawPoint(ctx: CanvasRenderingContext2D, p: Vector2, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, 2 * Math.PI);
    ctx.fill();
  }

  function strokeLine(
    ctx: CanvasRenderingContext2D,
    p1: Vector2,
    p2: Vector2,
    color: string,
  ) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  function onMouseMove(e: MouseEvent) {
    setP2(new Vector2(e.offsetX, e.offsetY));
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const cellWidth = ctx.canvas.width / GRID_COLS;
    const cellHeight = ctx.canvas.height / GRID_ROWS;
    for (let i = 1; i < GRID_COLS; i++) {
      strokeLine(
        ctx,
        new Vector2(i * cellWidth, 0),
        new Vector2(i * cellWidth, ctx.canvas.height),
        "oklch(44.6% 0.03 256.802)",
      );
    }
    for (let i = 1; i < GRID_ROWS; i++) {
      strokeLine(
        ctx,
        new Vector2(0, i * cellHeight),
        new Vector2(ctx.canvas.width, i * cellHeight),
        "oklch(44.6% 0.03 256.802)",
      );
    }

    const p1 = new Vector2(5 * cellWidth, 5 * cellHeight);
    drawPoint(ctx, p1, "oklch(63.7% 0.237 25.331)");
    if (p2) {
      drawPoint(ctx, p2, "oklch(63.7% 0.237 25.331)");
      strokeLine(ctx, p1, p2, "oklch(63.7% 0.237 25.331)");
    }

    canvas.addEventListener("mousemove", onMouseMove);
    return () => canvas.removeEventListener("mousemove", onMouseMove);
  }, [p2]);

  return (
    <canvas
      ref={canvasRef}
      id="canvas"
      className="absolute top-1/2 left-1/2 -translate-1/2 bg-gray-900"
      width="600px"
      height="600px"
    ></canvas>
  );
}
