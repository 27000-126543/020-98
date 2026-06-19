import {
  Hand,
  CircleDot,
  Activity,
  ArrowLeftRight,
  Unlink,
  Ruler,
  Minus,
} from 'lucide-react';
import {
  AnnotationType,
  ANNOTATION_COLOR,
  ANNOTATION_TYPE_LABEL,
  MeasurementType,
  SECTION_LABEL,
  SectionKey,
  MEASUREMENT_ENABLED_SECTIONS,
} from '@/types';
import { cn } from '@/lib/utils';
import { ANNOTATION_TOOL_CONFIG } from './AnnotationPanel';

interface Props {
  activeTool:
    | AnnotationType
    | 'pan'
    | 'measure-distance'
    | 'measure-line'
    | null;
  onChange: (
    t:
      | AnnotationType
      | 'pan'
      | 'measure-distance'
      | 'measure-line'
      | null,
  ) => void;
  sectionKey: SectionKey;
}

const ICON_MAP: Record<string, any> = {
  pan: Hand,
  'early-contact': CircleDot,
  'occlusal-interference': Activity,
  'midline-deviation': ArrowLeftRight,
  'jaw-instability': Unlink,
  'measure-distance': Ruler,
  'measure-line': Minus,
};

const MEASUREMENT_CONFIG = [
  {
    type: 'measure-distance' as const,
    label: '距离测量',
    hint: '在图像上拉一条线，记录两点间距离',
  },
  {
    type: 'measure-line' as const,
    label: '参考线',
    hint: '绘制参考辅助线（如面中线、咬合平面）',
  },
];

export const AnnotationToolbar = ({
  activeTool,
  onChange,
  sectionKey,
}: Props) => {
  const isMeasurementEnabled =
    (MEASUREMENT_ENABLED_SECTIONS as readonly string[]).includes(sectionKey);

  return (
    <div className="no-print absolute top-4 right-4 flex flex-col gap-1 bg-ink-800/95 backdrop-blur rounded-lg p-1.5 shadow-soft-lg z-10">
      <button
        className={cn(
          'w-10 h-10 rounded-md flex items-center justify-center text-ink-300 transition-all',
          activeTool === 'pan'
            ? 'bg-ink-600 text-white'
            : 'hover:bg-ink-700 hover:text-white',
        )}
        onClick={() => onChange(activeTool === 'pan' ? null : 'pan')}
        title="平移视图 (空格)"
      >
        <Hand className="w-[18px] h-[18px]" />
      </button>
      <div className="h-px bg-ink-600 my-0.5" />
      {ANNOTATION_TOOL_CONFIG.map(({ type, label, hint }) => {
        const Icon = ICON_MAP[type];
        const color = ANNOTATION_COLOR[type];
        const active = activeTool === type;
        return (
          <button
            key={type}
            className={cn(
              'w-10 h-10 rounded-md flex items-center justify-center transition-all relative group',
              active
                ? 'text-white shadow-md'
                : 'text-ink-300 hover:bg-ink-700 hover:text-white',
            )}
            style={active ? { backgroundColor: color } : {}}
            onClick={() => onChange(active ? null : type)}
            title={`${ANNOTATION_TYPE_LABEL[type]} - ${hint}`}
          >
            <Icon className="w-[18px] h-[18px]" />
            <span className="absolute right-full mr-2 px-2 py-1 bg-ink-900 text-white text-xs whitespace-nowrap rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
              {label}
            </span>
          </button>
        );
      })}
      {isMeasurementEnabled && (
        <>
          <div className="h-px bg-ink-600 my-0.5" />
          <div className="text-[9px] text-ink-400 text-center px-1 pt-0.5">
            测量工具
          </div>
          {MEASUREMENT_CONFIG.map(({ type, label, hint }) => {
            const Icon = ICON_MAP[type];
            const active = activeTool === type;
            return (
              <button
                key={type}
                className={cn(
                  'w-10 h-10 rounded-md flex items-center justify-center transition-all relative group',
                  active
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-ink-300 hover:bg-ink-700 hover:text-white',
                )}
                onClick={() => onChange(active ? null : type)}
                title={`${label} - ${hint}`}
              >
                <Icon className="w-[18px] h-[18px]" />
                <span className="absolute right-full mr-2 px-2 py-1 bg-ink-900 text-white text-xs whitespace-nowrap rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  {label}
                </span>
              </button>
            );
          })}
        </>
      )}
    </div>
  );
};
