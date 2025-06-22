import { Vector2 } from "./Vector2";

export function isValidIndex(i: Vector2, nRows: number, nCols: number) {
  return i.x >= 0 && i.x < nCols && i.y >= 0 && i.y < nRows;
}
