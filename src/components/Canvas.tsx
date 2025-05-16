import { useEffect, useRef } from "react";

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="canvas"
      className="bg-gray-900"
      width={window.innerWidth}
      height={window.innerHeight}
    ></canvas>
  );
}
