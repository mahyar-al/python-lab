import React, { useState, useRef, useEffect, useCallback } from 'react';
import { removeBackgroundAuto, loadImage } from '../lib/bgRemoval';
import {
  X,
  Eraser,
  Paintbrush,
  Sparkles,
  Undo2,
  Redo2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  Check,
  AlertCircle,
  Loader2,
  Sliders,
  Move
} from 'lucide-react';

interface BackgroundRemovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImageUrl: string;
  onApply: (transparentPngUrl: string, originalImageUrl: string) => void;
}

type ToolMode = 'auto' | 'erase' | 'restore';

export const BackgroundRemovalModal: React.FC<BackgroundRemovalModalProps> = ({
  isOpen,
  onClose,
  initialImageUrl,
  onApply
}) => {
  const [toolMode, setToolMode] = useState<ToolMode>('erase');
  const [brushSize, setBrushSize] = useState<number>(24);
  const [brushHardness, setBrushHardness] = useState<number>(80); // 0 to 100
  const [autoTolerance, setAutoTolerance] = useState<number>(25);

  const [isProcessingAuto, setIsProcessingAuto] = useState<boolean>(false);
  const [autoError, setAutoError] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);

  // Zoom & Pan
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Canvases
  const viewportCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // History Stack for Undo / Redo
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize and load image
  useEffect(() => {
    if (!isOpen || !initialImageUrl) return;

    let isMounted = true;
    setIsProcessingAuto(false);
    setAutoError(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });

    loadImage(initialImageUrl)
      .then((img) => {
        if (!isMounted) return;
        originalImageRef.current = img;

        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;

        // Create Mask Canvas (255 = visible, 0 = erased)
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = w;
        maskCanvas.height = h;
        const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
        if (maskCtx) {
          maskCtx.fillStyle = '#FFFFFF';
          maskCtx.fillRect(0, 0, w, h);
          maskCanvasRef.current = maskCanvas;

          // Save initial mask state to history
          const initialMaskData = maskCtx.getImageData(0, 0, w, h);
          historyRef.current = [initialMaskData];
          historyIndexRef.current = 0;
          setCanUndo(false);
          setCanRedo(false);
        }

        renderViewport();
      })
      .catch((err) => {
        setAutoError('خطا در بارگذاری تصویر: ' + err.message);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialImageUrl]);

  const updateHistoryState = () => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  };

  const pushHistoryState = () => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
    if (!maskCtx) return;

    const currentData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    // Slice off any redo branch
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(currentData);
    if (historyRef.current.length > 20) {
      historyRef.current.shift();
    }
    historyIndexRef.current = historyRef.current.length - 1;
    updateHistoryState();
  };

  // Render combined view: Original Image filtered by Mask
  const renderViewport = useCallback(() => {
    const canvas = viewportCanvasRef.current;
    const img = originalImageRef.current;
    const maskCanvas = maskCanvasRef.current;

    if (!canvas || !img || !maskCanvas) return;

    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, w, h);

    if (showOriginal) {
      ctx.drawImage(img, 0, 0, w, h);
      return;
    }

    // Draw masked output:
    // 1. Draw original image
    ctx.drawImage(img, 0, 0, w, h);
    // 2. Multiply with mask
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(maskCanvas, 0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }, [showOriginal]);

  // Execute Auto AI Background Removal
  const handleAutoRemove = async () => {
    if (!originalImageRef.current) return;
    setIsProcessingAuto(true);
    setAutoError(null);

    try {
      const result = await removeBackgroundAuto(originalImageRef.current, {
        tolerance: autoTolerance,
        feather: 1.5
      });

      // Load processed result onto mask canvas
      const procImg = await loadImage(result.dataUrl);
      const maskCanvas = maskCanvasRef.current;
      if (maskCanvas) {
        const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
        if (maskCtx) {
          maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
          maskCtx.drawImage(procImg, 0, 0);
          pushHistoryState();
          renderViewport();
        }
      }
    } catch (err: any) {
      setAutoError('خطا در حذف خودکار پس‌زمینه: ' + (err.message || 'مشکل در پردازش تصویر'));
    } finally {
      setIsProcessingAuto(false);
    }
  };

  // Brush Painting on Mask Canvas
  const applyBrush = (x: number, y: number, isStarting: boolean) => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const isErase = toolMode === 'erase';

    ctx.save();
    if (isErase) {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#FFFFFF';
    }

    const radius = brushSize / 2;
    const hardnessFactor = brushHardness / 100;

    if (isStarting || !lastPointRef.current) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    ctx.restore();
    lastPointRef.current = { x, y };
    renderViewport();
  };

  // Coordinate mapping from screen / touch to canvas pixels
  const getCanvasCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = viewportCanvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    return { x, y };
  };

  // Mouse & Touch Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;

    isDrawingRef.current = true;
    lastPointRef.current = coords;
    applyBrush(coords.x, coords.y, true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning && panStartRef.current) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
      return;
    }

    if (!isDrawingRef.current) return;
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;

    applyBrush(coords.x, coords.y, false);
  };

  const handlePointerUp = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPointRef.current = null;
      pushHistoryState();
    }
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndexRef.current <= 0) return;
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    historyIndexRef.current--;
    const state = historyRef.current[historyIndexRef.current];
    ctx.putImageData(state, 0, 0);
    updateHistoryState();
    renderViewport();
  };

  const handleRedo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    historyIndexRef.current++;
    const state = historyRef.current[historyIndexRef.current];
    ctx.putImageData(state, 0, 0);
    updateHistoryState();
    renderViewport();
  };

  const handleResetMask = () => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    pushHistoryState();
    renderViewport();
  };

  // Export and transfer to customizer
  const handleConfirmAndApply = () => {
    const canvas = viewportCanvasRef.current;
    if (!canvas) return;

    // Export true alpha PNG
    const transparentDataUrl = canvas.toDataURL('image/png');
    onApply(transparentDataUrl, initialImageUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white border border-[#BFDDF0] rounded-[24px] w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden text-right">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#BFDDF0] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E4F5FF] border border-[#BFDDF0] flex items-center justify-center text-[#111110]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#111110]">
                ویرایشگر حذف پس‌زمینه تصویر (خودکار و دستی)
              </h2>
              <span className="text-[11px] text-[#4A5560] block">
                تولید خودکار طرح شفاف با هوش مصنوعی یا ویرایش دقیق با قلم‌های پاک‌کن و بازیابی
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleConfirmAndApply}
              className="px-4 py-2 rounded-xl bg-[#111110] text-white hover:bg-[#2A2A28] text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 text-green-400" />
              <span>تأیید و قرار دادن روی لباس</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-[#BFDDF0] hover:bg-gray-100 text-[#111110] transition-colors cursor-pointer"
              aria-label="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar & Options Bar */}
        <div className="p-3 bg-[#E4F5FF]/40 border-b border-[#BFDDF0] flex items-center justify-between gap-3 flex-wrap text-xs">
          
          {/* Main Action Modes */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-[#BFDDF0] rounded-xl shadow-2xs">
            <button
              onClick={handleAutoRemove}
              disabled={isProcessingAuto}
              className="px-3 py-1.5 rounded-lg bg-[#111110] text-white hover:bg-black font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isProcessingAuto ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال پردازش هوشمند...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>حذف خودکار پس‌زمینه</span>
                </>
              )}
            </button>

            <div className="w-[1px] h-5 bg-[#BFDDF0] mx-1" />

            <button
              onClick={() => {
                setToolMode('erase');
                setIsPanning(false);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                toolMode === 'erase' && !isPanning
                  ? 'bg-[#111110] text-white'
                  : 'text-[#4A5560] hover:text-[#111110]'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>قلم حذف (پاک‌کن)</span>
            </button>

            <button
              onClick={() => {
                setToolMode('restore');
                setIsPanning(false);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                toolMode === 'restore' && !isPanning
                  ? 'bg-[#111110] text-white'
                  : 'text-[#4A5560] hover:text-[#111110]'
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              <span>قلم بازیابی (بازگردانی)</span>
            </button>

            <button
              onClick={() => setIsPanning(!isPanning)}
              className={`px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                isPanning ? 'bg-[#111110] text-white' : 'text-[#4A5560] hover:text-[#111110]'
              }`}
              title="جابجایی تصویر (Pan)"
            >
              <Move className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sliders: Size & Hardness */}
          <div className="flex items-center gap-4 flex-wrap bg-white px-3 py-1.5 rounded-xl border border-[#BFDDF0]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#4A5560]">اندازه قلم:</span>
              <input
                type="range"
                min="4"
                max="80"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-20 sm:w-28 accent-[#111110]"
              />
              <span className="font-mono text-[11px] text-[#111110] w-6 text-center">{brushSize}px</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#4A5560]">حساسیت هوش مصنوعی:</span>
              <input
                type="range"
                min="5"
                max="60"
                value={autoTolerance}
                onChange={(e) => setAutoTolerance(Number(e.target.value))}
                className="w-16 sm:w-20 accent-[#111110]"
              />
              <span className="font-mono text-[11px] text-[#111110] w-6 text-center">{autoTolerance}%</span>
            </div>
          </div>

          {/* History & Preview Controls */}
          <div className="flex items-center gap-1.5">
            <button
              disabled={!canUndo}
              onClick={handleUndo}
              className="p-2 rounded-lg border border-[#BFDDF0] bg-white text-[#111110] hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="بازگشت تغییرات (Undo)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>

            <button
              disabled={!canRedo}
              onClick={handleRedo}
              className="p-2 rounded-lg border border-[#BFDDF0] bg-white text-[#111110] hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="تکرار تغییرات (Redo)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleResetMask}
              className="p-2 rounded-lg border border-[#BFDDF0] bg-white text-[#111110] hover:bg-gray-100 cursor-pointer"
              title="بازنشانی کامل به تصویر اولیه"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-5 bg-[#BFDDF0] mx-0.5" />

            <button
              onMouseDown={() => { setShowOriginal(true); renderViewport(); }}
              onMouseUp={() => { setShowOriginal(false); renderViewport(); }}
              onTouchStart={() => { setShowOriginal(true); renderViewport(); }}
              onTouchEnd={() => { setShowOriginal(false); renderViewport(); }}
              className="px-2.5 py-1.5 rounded-lg border border-[#BFDDF0] bg-white text-[#111110] hover:bg-gray-100 flex items-center gap-1 font-medium select-none cursor-pointer"
              title="برای مشاهده تصویر اصلی نگه دارید"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>دیدن اصل</span>
            </button>

            <div className="flex items-center border border-[#BFDDF0] bg-white rounded-lg overflow-hidden">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                className="p-1.5 hover:bg-gray-100 text-[#111110] cursor-pointer"
                title="کوچک‌نمایی"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] text-[#111110]">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                className="p-1.5 hover:bg-gray-100 text-[#111110] cursor-pointer"
                title="بزرگ‌نمایی"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Error message banner */}
        {autoError && (
          <div className="p-2.5 bg-[#A33A3A]/10 border-b border-[#A33A3A]/30 text-[#A33A3A] text-xs flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{autoError}</span>
            </div>
            <button onClick={() => setAutoError(null)} className="text-gray-500 hover:text-black">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Interactive Canvas Viewport with Transparency Checkerboard Pattern */}
        <div className="flex-1 bg-[#F5F8FA] overflow-hidden relative flex items-center justify-center p-4 select-none touch-none">
          
          {/* Transparency Checkerboard Container */}
          <div
            className="relative border border-[#BFDDF0] shadow-md rounded-xl overflow-hidden transition-transform duration-75"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              backgroundImage: `
                linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
                linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
                linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)
              `,
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
            }}
          >
            <canvas
              ref={viewportCanvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className={`block max-w-[70vw] max-h-[60vh] object-contain ${
                isPanning
                  ? 'cursor-grab active:cursor-grabbing'
                  : toolMode === 'erase'
                  ? 'cursor-crosshair'
                  : 'cursor-cell'
              }`}
            />
          </div>

          {/* Hint Overlay */}
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm border border-[#BFDDF0] px-3 py-1.5 rounded-xl text-[11px] text-[#4A5560] shadow-sm pointer-events-none">
            {isPanning
              ? 'در حال جابجایی تصویر (Pan). با ماوس بکشید.'
              : toolMode === 'erase'
              ? 'قلم پاک‌کن فعال است. روی بخش‌های پس‌زمینه بکشید تا شفاف شوند.'
              : 'قلم بازیابی فعال است. روی بخش‌های حذف‌شده بکشید تا برگردند.'}
          </div>

        </div>

        {/* Footer info & CTA */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#BFDDF0] flex items-center justify-between text-xs">
          <div className="text-[#4A5560] text-[11px]">
            فایل خروجی با فرمت PNG واقعی و کانال شفافیت Alpha مستقیماً بر روی لباس درج خواهد شد.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#BFDDF0] bg-white text-[#111110] hover:bg-gray-50 font-semibold cursor-pointer"
            >
              انصراف
            </button>
            <button
              onClick={handleConfirmAndApply}
              className="px-5 py-2 rounded-xl bg-[#111110] text-white hover:bg-[#2A2A28] font-bold shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-green-400" />
              <span>تأیید طرح نهایی</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
