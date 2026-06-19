import { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Hand, MousePointer2, X } from 'lucide-react';
import {
  Annotation,
  AnnotationType,
  ANNOTATION_COLOR,
  ANNOTATION_TYPE_LABEL,
  Measurement,
  MeasurementType,
  SectionImage,
} from '@/types';
import { cn } from '@/lib/utils';
import { clampPercent } from '@/utils/annotation';

interface Props {
  image: SectionImage | null;
  annotations: Annotation[];
  measurements: Measurement[];
  activeTool: AnnotationType | 'pan' | 'measure-distance' | 'measure-line' | null;
  onAddAnnotation: (data: { x: number; y: number }) => void;
  onAddMeasurement: (data: {
    type: MeasurementType;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }) => void;
  onSelectAnnotation: (id: string) => void;
  selectedAnnotationId: string | null;
}

export const ImageAnnotator = ({
  image,
  annotations,
  measurements,
  activeTool,
  onAddAnnotation,
  onAddMeasurement,
  onSelectAnnotation,
  selectedAnnotationId,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [pulseKey, setPulseKey] = useState<string | null>(null);

  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measurePreview, setMeasurePreview] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

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
      if (e.button === 1) {
        e.preventDefault();
        setIsDragging(true);
        dragStart.current = {
          x: e.clientX,
          y: e.clientY,
          ox: offset.x,
          oy: offset.y,
        };
        return;
      }
      if (activeTool === 'pan') {
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
        return;
      }

      if (
        (activeTool === 'measure-distance' || activeTool === 'measure-line') &&
        measureStart &&
        image &&
        stageRef.current
      ) {
        const stageRect = stageRef.current.getBoundingClientRect();
        const x = ((e.clientX - stageRect.left) / stageRect.width) * 100;
        const y = ((e.clientY - stageRect.top) / stageRect.height) * 100;
        setMeasurePreview({
          x1: measureStart.x,
          y1: measureStart.y,
          x2: clampPercent(x),
          y2: clampPercent(y),
        });
      }
    },
    [isDragging, activeTool, measureStart, image],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    resetView();
    setMeasureStart(null);
    setMeasurePreview(null);
  }, [image?.id, resetView]);

  const getImageRelativeCoords = useCallback(
    (e: React.MouseEvent) => {
      if (!stageRef.current) return null;
      const stageRect = stageRef.current.getBoundingClientRect();
      const x = ((e.clientX - stageRect.left) / stageRect.width) * 100;
      const y = ((e.clientY - stageRect.top) / stageRect.height) * 100;

      if (x < 0 || x > 100 || y < 0 || y > 100) {
        return null;
      }
      return { x: clampPercent(x), y: clampPercent(y) };
    },
    [],
  );

  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!image || !activeTool || activeTool === 'pan') return;
    if (isDragging) return;

    const coords = getImageRelativeCoords(e);
    if (!coords) return;

    if (activeTool === 'measure-distance' || activeTool === 'measure-line') {
      if (!measureStart) {
        setMeasureStart({ x: coords.x, y: coords.y });
        return;
      }
      const type: MeasurementType =
        activeTool === 'measure-distance' ? 'distance' : 'reference-line';
      onAddMeasurement({
        type,
        x1: measureStart.x,
        y1: measureStart.y,
        x2: coords.x,
        y2: coords.y,
      });
      setMeasureStart(null);
      setMeasurePreview(null);
      return;
    }

    onAddAnnotation({ x: coords.x, y: coords.y });
    setTimeout(() => setPulseKey(null), 800);
  };

  const handleCancelMeasure = () => {
    setMeasureStart(null);
    setMeasurePreview(null);
  };

  const cursorStyle =
    isDragging
      ? 'cursor-grabbing'
      : activeTool === 'pan'
        ? 'cursor-grab'
        : activeTool === 'measure-distance' || activeTool === 'measure-line'
          ? 'cursor-crosshair'
          : activeTool
            ? 'cursor-crosshair'
            : 'cursor-default';

  const imageAnnotations = annotations.filter((a) => a.imageId === image?.id);
  const imageMeasurements = measurements.filter((m) => m.imageId === image?.id);

  const getPixelDistance = (m: Measurement): string => {
    if (!imgRef.current) return '';
    const { naturalWidth, naturalHeight } = imgRef.current;
    const dx = ((m.x2 - m.x1) / 100) * naturalWidth;
    const dy = ((m.y2 - m.y1) / 100) * naturalHeight;
    const px = Math.sqrt(dx * dx + dy * dy);
    return px.toFixed(1);
  };

  const getLineMidpoint = (x1: number, y1: number, x2: number, y2: number) => ({
    x: (x1 + x2) / 2,
    y: (y1 + y2) / 2,
  });

  return (
    <div
      ref={containerRef}
      className="relative flex-1 bg-ink-900 overflow-hidden select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        handleMouseUp();
      }}
    >
      <div
        className="absolute inset-0 opacity-10"
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
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            cursorStyle,
          )}
          onClick={handleStageClick}
        >
          <div
            className="relative"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            <div ref={stageRef} className="relative shadow-2xl">
              <img
                ref={imgRef}
                src={image.url}
                alt={image.name}
                draggable={false}
                className="max-w-[90%] max-h-[78vh] object-contain rounded-sm block"
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              />

              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ pointerEvents: 'none' }}
              >
                {imageMeasurements.map((m) => {
                  const selected = selectedAnnotationId === m.id;
                  const mid = getLineMidpoint(m.x1, m.y1, m.x2, m.y2);
                  const px = getPixelDistance(m);
                  return (
                    <g key={m.id}>
                      <line
                        x1={`${m.x1}%`}
                        y1={`${m.y1}%`}
                        x2={`${m.x2}%`}
                        y2={`${m.y2}%`}
                        stroke={selected ? '#2A9D8F' : '#E9C46A'}
                        strokeWidth={selected ? 3 : 2}
                        strokeDasharray={m.type === 'reference-line' ? '6 3' : '0'}
                        style={{
                          filter: selected
                            ? 'drop-shadow(0 0 4px rgba(42,157,143,0.6))'
                            : 'none',
                        }}
                      />
                      <circle
                        cx={`${m.x1}%`}
                        cy={`${m.y1}%`}
                        r={selected ? 5 : 4}
                        fill={selected ? '#2A9D8F' : '#E9C46A'}
                        stroke="#fff"
                        strokeWidth={1.5}
                      />
                      <circle
                        cx={`${m.x2}%`}
                        cy={`${m.y2}%`}
                        r={selected ? 5 : 4}
                        fill={selected ? '#2A9D8F' : '#E9C46A'}
                        stroke="#fff"
                        strokeWidth={1.5}
                      />
                      <g
                        className="cursor-pointer"
                        style={{ pointerEvents: 'auto' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAnnotation(m.id);
                        }}
                      >
                        <rect
                          x={`${mid.x}%`}
                          y={`${mid.y}%`}
                          transform="translate(-28, -12)"
                          width="56"
                          height="24"
                          rx="4"
                          fill={selected ? '#2A9D8F' : 'rgba(233,196,106,0.95)'}
                        />
                        <text
                          x={`${mid.x}%`}
                          y={`${mid.y}%`}
                          dominantBaseline="middle"
                          textAnchor="middle"
                          fill="#14171c"
                          fontSize="11"
                          fontWeight="600"
                          fontFamily="'Roboto Mono', monospace"
                        >
                          {px}px
                        </text>
                      </g>
                      {pulseKey === m.id && (
                        <circle
                          cx={`${mid.x}%`}
                          cy={`${mid.y}%`}
                          r={12}
                          fill="none"
                          stroke={selected ? '#2A9D8F' : '#E9C46A'}
                          strokeWidth={2}
                          className="animate-pulse-ring"
                        />
                      )}
                    </g>
                  );
                })}

                {measurePreview && (
                  <g>
                    <line
                      x1={`${measurePreview.x1}%`}
                      y1={`${measurePreview.y1}%`}
                      x2={`${measurePreview.x2}%`}
                      y2={`${measurePreview.y2}%`}
                      stroke="#ffffff"
                      strokeWidth={2}
                      strokeDasharray="4 3"
                      opacity="0.9"
                    />
                    <circle
                      cx={`${measurePreview.x1}%`}
                      cy={`${measurePreview.y1}%`}
                      r={4}
                      fill="#ffffff"
                      stroke="#2A9D8F"
                      strokeWidth={2}
                    />
                    <circle
                      cx={`${measurePreview.x2}%`}
                      cy={`${measurePreview.y2}%`}
                      r={4}
                      fill="#ffffff"
                      stroke="#2A9D8F"
                      strokeWidth={2}
                    />
                  </g>
                )}
              </svg>

              <div className="absolute inset-0 pointer-events-none">
                {imageAnnotations
                  .sort((a, b) => a.orderNum - b.orderNum)
                  .map((a) => {
                    const color = ANNOTATION_COLOR[a.type];
                    const selected = selectedAnnotationId === a.id;
                    return (
                      <div
                        key={a.id}
                        className={cn(
                          'absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer',
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
        </div>
      )}

      {image && (
        <>
          {measureStart && (
            <div className="no-print absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-accent-500 text-white px-3 py-1.5 rounded-lg shadow-lg text-sm animate-fade-in-up">
              <span>请在图像上点击第二点完成测量</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelMeasure();
                }}
                className="p-0.5 rounded hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

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
