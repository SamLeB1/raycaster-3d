export class Vector2 {
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
  lerp(that: Vector2, t: number) {
    return that.sub(this).scale(t).add(this);
  }
}
