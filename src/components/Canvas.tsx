import { useEffect, useRef, useState } from "react";
import { Vector2 } from "../utils/Vector2";
import { isValidIndex } from "../utils";
import { scene1 as scene } from "../scenes";

type KeysPressed = {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
  left: boolean;
  right: boolean;
};

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
    if (keysPressed.w) {
      updatedPosition.x += Math.cos(this.direction) * this.speedMove;
      updatedPosition.y += Math.sin(this.direction) * this.speedMove;
    }
    if (keysPressed.a) {
      const angle = this.direction - Math.PI / 2;
      updatedPosition.x += Math.cos(angle) * this.speedMove;
      updatedPosition.y += Math.sin(angle) * this.speedMove;
    }
    if (keysPressed.s) {
      const angle = this.direction + Math.PI;
      updatedPosition.x += Math.cos(angle) * this.speedMove;
      updatedPosition.y += Math.sin(angle) * this.speedMove;
    }
    if (keysPressed.d) {
      const angle = this.direction + Math.PI / 2;
      updatedPosition.x += Math.cos(angle) * this.speedMove;
      updatedPosition.y += Math.sin(angle) * this.speedMove;
    }
    if (keysPressed.left) updatedDirection -= this.speedTurn;
    if (keysPressed.right) updatedDirection += this.speedTurn;

    const currCell = new Vector2(
      Math.floor(updatedPosition.x),
      Math.floor(updatedPosition.y),
    );
    if (
      !isValidIndex(currCell, scene.size.y, scene.size.x) ||
      scene.scene[currCell.y][currCell.x] === 1
    )
      updatedPosition = this.position;

    return new Player(
      new Vector2(updatedPosition.x, updatedPosition.y),
      updatedDirection,
      this.speedMove,
      this.speedTurn,
    );
  }
  fovRange() {
    const opp = Math.tan(FOV / 2) * NEAR_CLIPPING_PLANE;
    const pFront = this.position.add(
      Vector2.fromAngle(this.direction).scale(NEAR_CLIPPING_PLANE),
    );
    const pLeft = pFront.sub(
      pFront.sub(this.position).rot90().normalize().scale(opp),
    );
    const pRight = pFront.add(
      pFront.sub(this.position).rot90().normalize().scale(opp),
    );
    return [pLeft, pRight];
  }
}

const EPS = 1e-3;
const NEAR_CLIPPING_PLANE = 0.5;
const FAR_CLIPPING_PLANE = 10;
const FOV = Math.PI / 2;
const RES = 600;

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
    new Player(scene.start, 0, 0.05, Math.PI / 90),
  );
  const [showMinimap, setShowMinimap] = useState(true);

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

  function castRay(p1: Vector2, p2: Vector2) {
    while (true) {
      if (p1.equals(p2)) return p1;
      const cellHit = getCellHit(p1, p2);
      if (
        !isValidIndex(cellHit, scene.size.y, scene.size.x) ||
        scene.scene[cellHit.y][cellHit.x] === 1
      )
        return p2;
      const p3 = rayStep(p1, p2);
      p1 = p2;
      p2 = p3;
    }
  }

  function getCellHit(p1: Vector2, p2: Vector2) {
    const d = p2.sub(p1);
    return new Vector2(
      Math.floor(p2.x + Math.sign(d.x) * EPS),
      Math.floor(p2.y + Math.sign(d.y) * EPS),
    );
  }

  function getCellSize(ctx: CanvasRenderingContext2D) {
    const xCellSize = ctx.canvas.width / scene.size.x;
    const yCellSize = ctx.canvas.height / scene.size.y;
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
    lineWidth: number,
    color: string,
    isGrid = false,
  ) {
    ctx.lineWidth = lineWidth;
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
    const minimapSize = new Vector2(
      cellSize * scene.size.x,
      cellSize * scene.size.y,
    );
    const gridColor = "#fff";

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, minimapSize.x, minimapSize.y);
    ctx.fillStyle = gridColor;
    for (let i = 0; i < scene.size.y; i++)
      for (let j = 0; j < scene.size.x; j++)
        if (scene.scene[i][j] === 1)
          ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
    for (let i = 1; i < scene.size.x; i++) {
      strokeLine(
        ctx,
        new Vector2(i * cellSize, 0),
        new Vector2(i * cellSize, minimapSize.y),
        1,
        gridColor,
      );
    }
    for (let i = 1; i < scene.size.y; i++) {
      strokeLine(
        ctx,
        new Vector2(0, i * cellSize),
        new Vector2(minimapSize.x, i * cellSize),
        1,
        gridColor,
      );
    }

    const [pLeft, pRight] = player.fovRange();
    const radius = cellSize / 4;
    strokeLine(
      ctx,
      player.position.scale(scale),
      pLeft.scale(scale),
      2,
      "oklch(88.5% 0.062 18.334)",
      true,
    );
    strokeLine(
      ctx,
      player.position.scale(scale),
      pRight.scale(scale),
      2,
      "oklch(88.5% 0.062 18.334)",
      true,
    );
    strokeLine(
      ctx,
      pLeft.scale(scale),
      pRight.scale(scale),
      2,
      "oklch(88.5% 0.062 18.334)",
      true,
    );
    drawPoint(
      ctx,
      player.position.scale(scale),
      radius,
      "oklch(63.7% 0.237 25.331)",
      true,
    );
  }

  function renderGame(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#fff";
    const stripWidth = ctx.canvas.width / RES;
    const [pLeft, pRight] = player.fovRange();
    for (let i = 0; i < RES; i++) {
      const p = castRay(player.position, pLeft.lerp(pRight, i / RES));
      const cellHit = getCellHit(player.position, p);
      if (isValidIndex(cellHit, scene.size.y, scene.size.x)) {
        const perpWallDist = p
          .sub(player.position)
          .dot(Vector2.fromAngle(player.direction));
        const t = 1 - perpWallDist / FAR_CLIPPING_PLANE;
        if (t > 0) {
          const stripHeight = ctx.canvas.height / perpWallDist;
          ctx.fillStyle = `hsl(0, 0%, ${t * 100}%)`;
          ctx.fillRect(
            i * stripWidth,
            (ctx.canvas.height - stripHeight) / 2,
            stripWidth,
            stripHeight,
          );
        }
      }
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.code === "KeyW") keysPressed.current.w = true;
    if (e.code === "KeyA") keysPressed.current.a = true;
    if (e.code === "KeyS") keysPressed.current.s = true;
    if (e.code === "KeyD") keysPressed.current.d = true;
    if (e.code === "ArrowLeft") keysPressed.current.left = true;
    if (e.code === "ArrowRight") keysPressed.current.right = true;
    if (e.code === "KeyM" && !e.repeat) setShowMinimap(!showMinimap);
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
      renderGame(ctx);
      if (showMinimap) renderMinimap(ctx, 0.5);

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
      className="absolute top-1/2 left-1/2 -translate-1/2 bg-black"
      width="600px"
      height="600px"
    ></canvas>
  );
}
