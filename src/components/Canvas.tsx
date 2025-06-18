import { useEffect, useRef, useState } from "react";

type KeysPressed = {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
  left: boolean;
  right: boolean;
};

class Vector2 {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  static fromAngle(angle: number) {
    return new Vector2(Math.cos(angle), Math.sin(angle));
  }
  add(that: Vector2) {
    return new Vector2(this.x + that.x, this.y + that.y);
  }
  sub(that: Vector2) {
    return new Vector2(this.x - that.x, this.y - that.y);
  }
  scale(n: number) {
    return new Vector2(this.x * n, this.y * n);
  }
  rot90() {
    return new Vector2(-this.y, this.x);
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
  equals(that: Vector2) {
    return this.x === that.x && this.y === that.y;
  }
}

class Player {
  position: Vector2;
  direction: number;
  speedMove: number;
  speedTurn: number;
  constructor(
    position: Vector2,
    direction: number,
    speedMove: number,
    speedTurn: number,
  ) {
    this.position = position;
    this.direction = direction;
    this.speedMove = speedMove;
    this.speedTurn = speedTurn;
  }
  update(keysPressed: KeysPressed) {
    let updatedPosition = { ...this.position };
    let updatedDirection = this.direction;
    if (keysPressed.w) updatedPosition.y -= this.speedMove;
    if (keysPressed.a) updatedPosition.x -= this.speedMove;
    if (keysPressed.s) updatedPosition.y += this.speedMove;
    if (keysPressed.d) updatedPosition.x += this.speedMove;
    if (keysPressed.left) updatedDirection -= this.speedTurn;
    if (keysPressed.right) updatedDirection += this.speedTurn;
    return new Player(
      new Vector2(updatedPosition.x, updatedPosition.y),
      updatedDirection,
      this.speedMove,
      this.speedTurn,
    );
  }
}

const GRID_ROWS = 10;
const GRID_COLS = 10;
const EPS = 1e-3;
const NEAR_CLIPPING_PLANE = 0.5;
const FOV = Math.PI / 2;

let scene: number[][] = Array(GRID_ROWS)
  .fill(0)
  .map(() => Array(GRID_COLS).fill(0));
scene[1][1] = 1;

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestId = useRef<number>(null);
  const keysPressed = useRef<KeysPressed>({
    w: false,
    a: false,
    s: false,
    d: false,
    left: false,
    right: false,
  });
  const [player, setPlayer] = useState(
    new Player(new Vector2(5, 5), 0, 0.05, Math.PI / 90),
  );

  function snap(x: number, dx: number) {
    if (dx > 0) return Math.ceil(x + Math.sign(dx) * EPS);
    else if (dx < 0) return Math.floor(x + Math.sign(dx) * EPS);
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

  function getCellHit(p1: Vector2, p2: Vector2) {
    const d = p2.sub(p1);
    return new Vector2(
      Math.floor(p2.x + Math.sign(d.x) * EPS),
      Math.floor(p2.y + Math.sign(d.y) * EPS),
    );
  }

  function isValidIndex(i: Vector2) {
    return i.x >= 0 && i.x < GRID_COLS && i.y >= 0 && i.y < GRID_ROWS;
  }

  function getCellSize(ctx: CanvasRenderingContext2D) {
    const xCellSize = ctx.canvas.width / GRID_COLS;
    const yCellSize = ctx.canvas.height / GRID_ROWS;
    return Math.min(xCellSize, yCellSize);
  }

  function drawPoint(
    ctx: CanvasRenderingContext2D,
    p: Vector2,
    radius: number,
    color: string,
    isGrid = false,
  ) {
    ctx.fillStyle = color;
    ctx.beginPath();
    if (isGrid) {
      const cellSize = getCellSize(ctx);
      ctx.arc(p.x * cellSize, p.y * cellSize, radius, 0, 2 * Math.PI);
    } else ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
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

  function renderMinimap(ctx: CanvasRenderingContext2D, scale: number) {
    const cellSize = getCellSize(ctx) * scale;
    const minimapSize = new Vector2(cellSize * GRID_COLS, cellSize * GRID_ROWS);
    const gridColor = "#fff";
    ctx.fillStyle = gridColor;
    for (let i = 0; i < GRID_ROWS; i++)
      for (let j = 0; j < GRID_COLS; j++)
        if (scene[i][j] === 1)
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
    for (let i = 1; i < GRID_COLS; i++) {
      strokeLine(
        ctx,
        new Vector2(i * cellSize, 0),
        new Vector2(i * cellSize, minimapSize.y),
        gridColor,
      );
    }
    for (let i = 1; i < GRID_ROWS; i++) {
      strokeLine(
        ctx,
        new Vector2(0, i * cellSize),
        new Vector2(minimapSize.x, i * cellSize),
        gridColor,
      );
    }

    const opp = Math.tan(FOV / 2) * NEAR_CLIPPING_PLANE;
    const pFront = player.position.add(
      Vector2.fromAngle(player.direction).scale(NEAR_CLIPPING_PLANE),
    );
    const pLeft = pFront.sub(
      pFront.sub(player.position).rot90().normalize().scale(opp),
    );
    const pRight = pFront.add(
      pFront.sub(player.position).rot90().normalize().scale(opp),
    );

    const radius = cellSize / 4;
    drawPoint(
      ctx,
      player.position.scale(scale),
      radius,
      "oklch(63.7% 0.237 25.331)",
      true,
    );
    drawPoint(
      ctx,
      pLeft.scale(scale),
      radius / 2,
      "oklch(62.3% 0.214 259.815)",
      true,
    );
    drawPoint(
      ctx,
      pRight.scale(scale),
      radius / 2,
      "oklch(62.3% 0.214 259.815)",
      true,
    );

    /* if (p2) {
      let pPrev = p1;
      let pCurr = p2.scale(1 / cellSize);
      if (pPrev.equals(pCurr)) return;
      while (true) {
        drawPoint(
          ctx,
          pCurr.scale(scale),
          radius,
          "oklch(63.7% 0.237 25.331)",
          true,
        );
        strokeLine(
          ctx,
          pPrev.scale(scale),
          pCurr.scale(scale),
          "oklch(63.7% 0.237 25.331)",
          true,
        );

        const cellHit = getCellHit(pPrev, pCurr);
        if (!isValidIndex(cellHit) || scene[cellHit.y][cellHit.x] === 1) break;

        const pNext = rayStep(pPrev, pCurr);
        pPrev = pCurr;
        pCurr = pNext;
      }
    } */
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.code === "KeyW") keysPressed.current.w = true;
    if (e.code === "KeyA") keysPressed.current.a = true;
    if (e.code === "KeyS") keysPressed.current.s = true;
    if (e.code === "KeyD") keysPressed.current.d = true;
    if (e.code === "ArrowLeft") keysPressed.current.left = true;
    if (e.code === "ArrowRight") keysPressed.current.right = true;
  }

  function onKeyUp(e: KeyboardEvent) {
    if (e.code === "KeyW") keysPressed.current.w = false;
    if (e.code === "KeyA") keysPressed.current.a = false;
    if (e.code === "KeyS") keysPressed.current.s = false;
    if (e.code === "KeyD") keysPressed.current.d = false;
    if (e.code === "ArrowLeft") keysPressed.current.left = false;
    if (e.code === "ArrowRight") keysPressed.current.right = false;
  }

  useEffect(() => {
    function gameLoop() {
      if (!ctx) return;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      setPlayer(player.update(keysPressed.current));
      renderMinimap(ctx, 0.5);

      requestId.current = requestAnimationFrame(gameLoop);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    requestId.current = requestAnimationFrame(gameLoop);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      if (requestId.current) cancelAnimationFrame(requestId.current);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [player]);

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
