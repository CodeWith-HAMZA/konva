import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";

export default function ImageZoneCanvas() {
  const canvasRef = useRef(null);
  const [selectedZone, setSelectedZone] = useState(null);

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 500,
      backgroundColor: "#f9f9f9",
    });

    // Background image
    fabric.Image.fromURL("/bg.jpg", (img) => {
      img.selectable = false;
      img.evented = false;
      img.scaleToWidth(canvas.width);
      canvas.add(img);
      canvas.sendToBack(img);
    });

    // Zones
    const zones = {
      A: { left: 100, top: 100, width: 150, height: 100 },
      B: { left: 300, top: 200, width: 150, height: 100 },
      C: { left: 500, top: 150, width: 150, height: 100 },
    };

    Object.values(zones).forEach((pos) => {
      const rect = new fabric.Rect({
        ...pos,
        stroke: "blue",
        strokeDashArray: [5, 5],
        fill: "transparent",
        selectable: false,
        evented: false,
      });
      canvas.add(rect);
    });

    canvasRef.current = canvas;
    return () => canvas.dispose();
  }, []);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedZone || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const reader = new FileReader();
    reader.onload = function (f) {
      fabric.Image.fromURL(f.target.result, (img) => {
        const zones = {
          A: { left: 100, top: 100, width: 150, height: 100 },
          B: { left: 300, top: 200, width: 150, height: 100 },
          C: { left: 500, top: 150, width: 150, height: 100 },
        };
        const zone = zones[selectedZone];
        img.scaleToWidth(zone.width);
        img.scaleToHeight(zone.height);
        img.left = zone.left;
        img.top = zone.top;
        img.clipPath = new fabric.Rect({
          left: zone.left,
          top: zone.top,
          width: zone.width,
          height: zone.height,
          absolutePositioned: true,
        });
        canvas.add(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <div className="flex gap-3 mb-3">
        <button onClick={() => setSelectedZone("A")}>Select A</button>
        <button onClick={() => setSelectedZone("B")}>Select B</button>
        <button onClick={() => setSelectedZone("C")}>Select C</button>
      </div>
      <input type="file" onChange={handleUpload} />
      <canvas ref={canvasRef} />
    </div>
  );
}
