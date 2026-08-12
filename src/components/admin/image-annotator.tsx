"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  Move,
  PenTool,
  Undo,
  Trash2,
  Maximize,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Point {
  x: number;
  y: number;
}

interface Line {
  points: Point[];
  color: string;
  width: number;
}

interface ImageAnnotatorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  title: string;
}

export function ImageAnnotatorDialog({
  isOpen,
  onOpenChange,
  imageUrl,
  title,
}: ImageAnnotatorDialogProps) {
  const [mode, setMode] = useState<"pan" | "draw">("pan");
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [lines, setLines] = useState<Line[]>([]);
  const [currentLine, setCurrentLine] = useState<Line | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allLines = currentLine ? [...lines, currentLine] : lines;

    allLines.forEach((line) => {
      if (line.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.moveTo(line.points[0].x, line.points[0].y);
      for (let i = 1; i < line.points.length; i++) {
        ctx.lineTo(line.points[i].x, line.points[i].y);
      }
      ctx.stroke();
    });
  }, [lines, currentLine]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  };

  const activePointers = useRef<Map<number, { x: number; y: number }>>(
    new Map(),
  );
  const initialPinchDist = useRef<number | null>(null);
  const initialPinchScale = useRef<number | null>(null);

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.current.size === 2) {
      // Setup pinch to zoom
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialPinchDist.current = dist;
      initialPinchScale.current = scale;

      // Cancel drawing if second finger touches
      if (mode === "draw") setCurrentLine(null);
      return;
    }

    if (activePointers.current.size === 1) {
      if (mode === "pan") {
        setIsDragging(true);
        setDragStart({
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        });
      } else if (mode === "draw") {
        const pt = getCanvasPoint(e);
        if (pt) {
          setCurrentLine({
            points: [pt],
            color: "#ef4444",
            width: 4,
          });
        }
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointers.current.has(e.pointerId)) {
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (activePointers.current.size === 2) {
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);

      if (initialPinchDist.current && initialPinchScale.current) {
        const scaleChange = dist / initialPinchDist.current;
        const newScale = Math.min(
          Math.max(initialPinchScale.current * scaleChange, 0.5),
          5,
        );
        setScale(newScale);
      }
      return;
    }

    if (activePointers.current.size === 1) {
      if (mode === "pan" && isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      } else if (mode === "draw" && currentLine) {
        const pt = getCanvasPoint(e);
        if (pt) {
          setCurrentLine((prev) =>
            prev
              ? {
                  ...prev,
                  points: [...prev.points, pt],
                }
              : null,
          );
        }
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    activePointers.current.delete(e.pointerId);

    if (activePointers.current.size < 2) {
      initialPinchDist.current = null;
      initialPinchScale.current = null;
    }

    if (mode === "pan") {
      if (activePointers.current.size === 0) setIsDragging(false);
    } else if (mode === "draw" && currentLine) {
      setLines((prev) => [...prev, currentLine]);
      setCurrentLine(null);
    }
  };

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.5, 5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.5, 0.5));
  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleUndo = () => setLines((prev) => prev.slice(0, -1));
  const handleClear = () => setLines([]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full h-[90vh] flex flex-col p-0 overflow-hidden bg-zinc-950 border-zinc-800">
        <DialogHeader className="p-4 border-b border-zinc-800 flex flex-row items-center justify-between sticky top-0 bg-zinc-950/80 backdrop-blur-sm z-50 text-zinc-100 shrink-0">
          <DialogTitle className="text-zinc-100">{title}</DialogTitle>
          <div className="flex items-center gap-1 sm:gap-2 mr-8">
            <div className="flex bg-zinc-900 rounded-md p-1 border border-zinc-800">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMode("pan")}
                className={cn(
                  "h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800",
                  mode === "pan" && "bg-zinc-800 text-zinc-100",
                )}
                title="Pan Tool"
              >
                <Move className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMode("draw")}
                className={cn(
                  "h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800",
                  mode === "draw" && "bg-zinc-800 text-zinc-100",
                )}
                title="Draw Tool"
              >
                <PenTool className="h-4 w-4" />
              </Button>
            </div>

            <div className="w-px h-6 bg-zinc-800 mx-1" />

            <div className="flex bg-zinc-900 rounded-md p-1 border border-zinc-800">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetZoom}
                className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                title="Reset Zoom"
              >
                <Maximize className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <div className="w-px h-6 bg-zinc-800 mx-1" />

            <div className="flex bg-zinc-900 rounded-md p-1 border border-zinc-800">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUndo}
                disabled={lines.length === 0}
                className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                title="Undo"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClear}
                disabled={lines.length === 0}
                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950"
                title="Clear All"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div
          className="flex-1 overflow-hidden relative bg-zinc-950 flex items-center justify-center select-none"
          ref={containerRef}
          onWheel={handleWheel}
        >
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: "center",
              transition: isDragging ? "none" : "transform 0.1s ease-out",
              position: "relative",
            }}
          >
            {imageUrl && (
              <img
                src={imageUrl}
                alt={title}
                onLoad={handleImageLoad}
                className="max-w-none shadow-2xl pointer-events-none"
                style={{
                  maxHeight: "80vh",
                  objectFit: "contain",
                }}
              />
            )}
            {imageSize.width > 0 && imageUrl && (
              <canvas
                ref={canvasRef}
                width={imageSize.width}
                height={imageSize.height}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  cursor:
                    mode === "pan"
                      ? isDragging
                        ? "grabbing"
                        : "grab"
                      : "crosshair",
                  touchAction: "none",
                }}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
