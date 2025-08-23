import { Vector2 } from "./Vector2";
import type { Scene } from "../scenes";

export function generateMaze(width: number, height: number): Scene {
  if (width < 5) width = 5;
  if (width > 249) width = 249;
  if (height < 5) height = 5;
  if (height > 249) height = 249;
  if (width % 2 === 0) width++;
  if (height % 2 === 0) height++;
  const maze: number[][] = Array(height)
    .fill(0)
    .map(() => Array(width).fill(1));
  const startX = 1;
  const startY = 1;
  const walls: { x: number; y: number; dx: number; dy: number }[] = [];
  maze[startY][startX] = 0;
  addWalls(startX, startY);

  while (walls.length > 0) {
    const randomIndex = Math.floor(Math.random() * walls.length);
    const { x, y, dx, dy } = walls.splice(randomIndex, 1)[0];
    const newX = x + dx;
    const newY = y + dy;
    if (
      newX >= 0 &&
      newX < width &&
      newY >= 0 &&
      newY < height &&
      maze[newY][newX] === 1
    ) {
      maze[y][x] = 0;
      maze[newY][newX] = 0;
      addWalls(newX, newY);
    }
  }
  const { start, end } = getRandomStartEndCoords();
  maze[end.y][end.x] = 2;
  return {
    scene: maze,
    size: new Vector2(width, height),
    start,
  };

  function addWalls(cx: number, cy: number) {
    const directions = [
      { x: cx + 1, y: cy, dx: 1, dy: 0 },
      { x: cx - 1, y: cy, dx: -1, dy: 0 },
      { x: cx, y: cy + 1, dx: 0, dy: 1 },
      { x: cx, y: cy - 1, dx: 0, dy: -1 },
    ];

    for (const dir of directions) {
      const wallX = dir.x;
      const wallY = dir.y;
      const pathX = dir.x + dir.dx;
      const pathY = dir.y + dir.dy;

      if (wallX >= 0 && wallX < width && wallY >= 0 && wallY < height) {
        if (
          maze[wallY][wallX] === 1 &&
          pathX >= 0 &&
          pathX < width &&
          pathY >= 0 &&
          pathY < height &&
          maze[pathY][pathX] === 1
        ) {
          walls.push({ x: wallX, y: wallY, dx: dir.dx, dy: dir.dy });
        }
      }
    }
  }

  function getRandomStartEndCoords() {
    if (Math.floor(Math.random() * 2)) {
      const endX = Math.floor(Math.random() * 2) ? 0 : width - 1;
      let endY = Math.floor(Math.random() * (height - 1)) + 1;
      if (endY % 2 === 0) endY--;

      const startX = endX === 0 ? width - 1.5 : 1.5;
      let startY = Math.floor(Math.random() * (height - 1)) + 1;
      if (startY % 2 === 0) startY--;
      startY += 0.5;

      return {
        start: new Vector2(startX, startY),
        end: new Vector2(endX, endY),
      };
    } else {
      let endX = Math.floor(Math.random() * (width - 1)) + 1;
      if (endX % 2 === 0) endX--;
      const endY = Math.floor(Math.random() * 2) ? 0 : height - 1;

      let startX = Math.floor(Math.random() * (width - 1)) + 1;
      if (startX % 2 === 0) startX--;
      startX += 0.5;
      const startY = endY === 0 ? height - 1.5 : 1.5;

      return {
        start: new Vector2(startX, startY),
        end: new Vector2(endX, endY),
      };
    }
  }
}
