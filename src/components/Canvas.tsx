import { useEffect, useRef, useState } from "react";

class Vector2 {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  add(that: Vector2) {
    return new Vector2(this.x + that.x, this.y + that.y);
  }
  sub(that: Vector2) {
    return new Vector2(this.x - that.x, this.y - that.y);
  }
  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  distanceTo(that: Vector2) {
    return that.sub(this).magnitude();
  }
  normalize() {
    const m = this.magnitude();
    if (m === 0) return new Vector2(0, 0);
    else return new Vector2(this.x / m, this.y / m);
  }
}

const GRID_ROWS = 10;
const GRID_COLS = 10;

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [p2, setP2] = useState<Vector2 | null>(null);

  function snap(x: number, dx: number) {
    if (dx > 0) return Math.ceil(x);
    else if (dx < 0) return Math.floor(x);
    else return x;
  }

  function rayStep(p1: Vector2, p2: Vector2) {
    const d = p2.sub(p1);
    if (d.x !== 0) {
      const m = d.y / d.x;
      const b = p1.y - m * p1.x;

      const x3v = snap(p2.x, d.x);
      const y3v = m * x3v + b;
      const p3v = new Vector2(x3v, y3v);

      if (m !== 0) {
        const y3h = snap(p2.y, d.y);
        const x3h = (y3h - b) / m;
        const p3h = new Vector2(x3h, y3h);

        return p2.distanceTo(p3v) <= p2.distanceTo(p3h) ? p3v : p3h;
      } else return p3v;
    } else {
      const y3h = snap(p2.y, d.y);
      return new Vector2(p2.x, y3h);
    }
  }

  function getCellSize(ctx: CanvasRenderingContext2D) {
    return ctx.canvas.width / GRID_COLS;
  }

  function drawPoint(
    ctx: CanvasRenderingContext2D,
    p: Vector2,
    color: string,
    isGrid = false,
  ) {
    ctx.fillStyle = color;
    ctx.beginPath();
    if (isGrid) {
      const cellSize = getCellSize(ctx);
      ctx.arc(p.x * cellSize, p.y * cellSize, 10, 0, 2 * Math.PI);
    } else ctx.arc(p.x, p.y, 10, 0, 2 * Math.PI);
    ctx.fill();
  }

  function strokeLine(
    ctx: CanvasRenderingContext2D,
    p1: Vector2,
    p2: Vector2,
    color: string,
    isGrid = false,
  ) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    if (isGrid) {
      const cellSize = getCellSize(ctx);
      ctx.moveTo(p1.x * cellSize, p1.y * cellSize);
      ctx.lineTo(p2.x * cellSize, p2.y * cellSize);
    } else {
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();
  }

  function onMouseMove(e: MouseEvent, ctx: CanvasRenderingContext2D) {
    const cellSize = getCellSize(ctx);
    setP2(new Vector2(e.offsetX / cellSize, e.offsetY / cellSize));
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const cellSize = getCellSize(ctx);
    for (let i = 1; i < GRID_COLS; i++) {
      strokeLine(
        ctx,
        new Vector2(i * cellSize, 0),
        new Vector2(i * cellSize, ctx.canvas.height),
        "oklch(44.6% 0.03 256.802)",
      );
    }
    for (let i = 1; i < GRID_ROWS; i++) {
      strokeLine(
        ctx,
        new Vector2(0, i * cellSize),
        new Vector2(ctx.canvas.width, i * cellSize),
        "oklch(44.6% 0.03 256.802)",
      );
    }

    const p1 = new Vector2(5, 5);
    drawPoint(ctx, p1, "oklch(63.7% 0.237 25.331)", true);
    if (p2) {
      drawPoint(ctx, p2, "oklch(63.7% 0.237 25.331)", true);
      strokeLine(ctx, p1, p2, "oklch(63.7% 0.237 25.331)", true);
      const p3 = rayStep(p1, p2);
      drawPoint(ctx, p3, "oklch(63.7% 0.237 25.331)", true);
      strokeLine(ctx, p2, p3, "oklch(63.7% 0.237 25.331)", true);
    }

    canvas.addEventListener("mousemove", (e) => onMouseMove(e, ctx));
    return () =>
      canvas.removeEventListener("mousemove", (e) => onMouseMove(e, ctx));
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
