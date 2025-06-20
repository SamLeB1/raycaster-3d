import { Vector2 } from "../components/Canvas";

export function isValidIndex(i: Vector2, nRows: number, nCols: number) {
  return i.x >= 0 && i.x < nCols && i.y >= 0 && i.y < nRows;
}
