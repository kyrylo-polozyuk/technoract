import { useEffect, useRef } from "react";

export type ObservableCanvasInterface = {
  element: HTMLCanvasElement;
  context: CanvasRenderingContext2D | null;
  offscreen: HTMLCanvasElement;
  offscreenContext: CanvasRenderingContext2D | null;
  resize: () => void;
  onResize: (callback: () => void) => void;
};

type ObservableCanvasProps = {
  onCanvasReady: (canvas: ObservableCanvasInterface) => void;
};

const MAX_SIZE = 1080;

export const ObservableCanvasInterface = ({ onCanvasReady }: ObservableCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const resizeCallbackRef = useRef<(() => void) | undefined>(undefined);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const element = canvasRef.current;
    const container = containerRef.current;
    if (!element || !container) {
      return;
    }

    const context = element.getContext("2d", {
      willReadFrequently: true,
      alpha: true,
    });

    const offscreen = document.createElement("canvas");
    const offscreenContext = offscreen.getContext("2d", {
      willReadFrequently: true,
      alpha: true,
    });
    offscreenRef.current = offscreen;

    const resize = () => {
      const rect = element.getBoundingClientRect();
      const width = rect.width * window.devicePixelRatio;
      const height = rect.height * window.devicePixelRatio;
      element.width = width;
      element.height = height;
      offscreen.width = width;
      offscreen.height = height;
      resizeCallbackRef.current?.();
    };

    const observer = new ResizeObserver(() => {
      resize();
    });

    observer.observe(container);
    observerRef.current = observer;

    const observableCanvas: ObservableCanvasInterface = {
      element,
      context,
      offscreen,
      offscreenContext,
      resize,
      onResize: (callback) => {
        resizeCallbackRef.current = callback;
      },
    };

    resize();
    onCanvasReady(observableCanvas);

    return () => {
      observer.disconnect();
    };
  }, [onCanvasReady]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", display: "flex", maxWidth: MAX_SIZE + 'px', maxHeight: MAX_SIZE + 'px' }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};
