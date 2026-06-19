import { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Hand, MousePointer2 } from 'lucide-react';
import {
  Annotation,
  AnnotationType,
  ANNOTATION_COLOR,
  ANNOTATION_TYPE_LABEL,
  SectionImage,
} from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  image: SectionImage | null;
  annotations: Annotation[];
  activeTool: AnnotationType | 'pan' | null;
  onAddAnnotation: (data: { x: number; y: number }) => void;
  onSelectAnnotation: (id: string) => void;
  selectedAnnotationId: string | null;
}

export const ImageAnnotator = ({
  image,
  annotations,
  activeTool,
  onAddAnnotation,
  onSelectAnnotation,
  selectedAnnotationId,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [pulseKey, setPulseKey] = useState<string | null>(null);

  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((s) => Math.max(0.5, Math.min(3, s + delta)));
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool === 'pan' || e.button === 1) {
        setIsDragging(true);
        dragStart.current = {
          x: e.clientX,
          y: e.clientY,
          ox: offset.x,
          oy: offset.y,
        };
      }
    },
    [activeTool, offset],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setOffset({
          x: dragStart.current.ox + (e.clientX - dragStart.current.x),
          y: dragStart.current.oy + (e.clientY - dragStart.current.y),
        });
      }
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    resetView();
  }, [image?.id, resetView]);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!image || !activeTool || activeTool === 'pan') return;
    if (isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onAddAnnotation({ x, y });
    setTimeout(() => setPulseKey(null), 800);
  };

  const cursorStyle =
    activeTool === 'pan'
      ? isDragging
        ? 'cursor-grabbing'
        : 'cursor-grab'
      : activeTool
        ? 'cursor-crosshair'
        : 'cursor-default';

  const imageAnnotations = annotations.filter((a) => a.imageId === image?.id);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 bg-ink-900 overflow-hidden select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle, #334e68 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {!image ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-500">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-ink-600 flex items-center justify-center mb-3">
            <MousePointer2 className="w-7 h-7 opacity-50" />
          </div>
          <p className="text-sm">从左侧选择或添加图像开始标注</p>
          <p className="text-xs text-ink-600 mt-1">
            选择右上方标注工具后，在图像上点击即可圈选异常点
          </p>
        </div>
      ) : (
        <div
          ref={imgRef}
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            cursorStyle,
          )}
          onClick={handleImageClick}
        >
          <div
            className="relative shadow-2xl"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            <img
              src={image.url}
              alt={image.name}
              draggable={false}
              className="max-w-[90%] max-h-[78vh] object-contain rounded-sm"
              style={{ userSelect: 'none', pointerEvents: 'none' }}
            />

            <div className="absolute inset-0">
              {imageAnnotations
                .sort((a, b) => a.orderNum - b.orderNum)
                .map((a) => {
                  const color = ANNOTATION_COLOR[a.type];
                  const selected = selectedAnnotationId === a.id;
                  return (
                    <div
                      key={a.id}
                      className={cn(
                        'absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer',
                        selected && 'z-10',
                      )}
                      style={{ left: `${a.x}%`, top: `${a.y}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAnnotation(a.id);
                      }}
                    >
                      {pulseKey === a.id && (
                        <span
                          className="absolute inset-0 rounded-full animate-pulse-ring"
                          style={{ backgroundColor: color }}
                        />
                      )}
                      <div
                        className={cn(
                          'relative w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold font-mono shadow-lg transition-all',
                          selected
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-ink-900 scale-110'
                            : 'hover:scale-110',
                        )}
                        style={{ backgroundColor: color }}
                        title={`${ANNOTATION_TYPE_LABEL[a.type]}${a.note ? '：' + a.note : ''}`}
                      >
                        {a.orderNum}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {image && (
        <>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-ink-800/90 backdrop-blur px-2 py-1.5 rounded-lg shadow-soft-lg no-print">
            <button
              className="p-1.5 rounded text-ink-300 hover:bg-ink-700 hover:text-white transition-colors"
              onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-ink-300 w-12 text-center font-mono">
              {Math.round(scale * 100)}%
            </span>
            <button
              className="p-1.5 rounded text-ink-300 hover:bg-ink-700 hover:text-white transition-colors"
              onClick={() => setScale((s) => Math.min(3, s + 0.2))}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-ink-600 mx-1" />
            <button
              className="p-1.5 rounded text-ink-300 hover:bg-ink-700 hover:text-white transition-colors"
              onClick={resetView}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute bottom-4 right-4 text-[11px] text-ink-500 no-print">
            <span className="inline-flex items-center gap-1">
              <Hand className="w-3 h-3" /> 按住空格或选择平移工具拖拽 · 滚轮缩放
            </span>
          </div>
        </>
      )}
    </div>
  );
};
