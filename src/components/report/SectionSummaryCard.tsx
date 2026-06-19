import { AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  SectionKey,
  SECTION_LABEL,
  SectionSummary,
  RiskLevel,
} from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  summaries: Record<SectionKey, SectionSummary>;
}

const RISK_CONFIG: Record<RiskLevel, { label: string; className: string; dot: string }> = {
  normal: {
    label: '未见异常',
    className: 'text-accent-700 bg-accent-50 border-accent-100',
    dot: 'bg-accent-500',
  },
  mild: {
    label: '轻度',
    className: 'text-primary-700 bg-primary-50 border-primary-100',
    dot: 'bg-primary-500',
  },
  moderate: {
    label: '中度',
    className: 'text-warning-700 bg-warning-50 border-warning-100',
    dot: 'bg-warning-500',
  },
  severe: {
    label: '显著异常',
    className: 'text-danger-700 bg-danger-50 border-danger-100',
    dot: 'bg-danger-500',
  },
};

const SECTION_ORDER: SectionKey[] = [
  'centric-relation',
  'vertical-dimension',
  'overjet-overbite',
  'deviation',
];

export const SectionSummaryCard = ({ summaries }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {SECTION_ORDER.map((key) => {
        const s = summaries[key];
        const risk = RISK_CONFIG[s.riskLevel];
        return (
          <div
            key={key}
            className="card p-4 hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-ink-800">
                {SECTION_LABEL[key]}
              </h3>
              <span className={cn('badge border', risk.className)}>
                <span
                  className={cn('w-1.5 h-1.5 rounded-full mr-1.5', risk.dot)}
                />
                {risk.label}
              </span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-2xl font-bold font-mono text-ink-800">
                {s.annotationCount}
              </div>
              <div className="text-xs text-ink-500 leading-tight">
                处标注
                <br />
                {s.annotationCount > 0 ? '需关注' : '状态良好'}
              </div>
            </div>
            <ul className="space-y-1 pt-3 border-t border-ink-100">
              {s.keyFindings.map((f, i) => (
                <li
                  key={i}
                  className="text-xs text-ink-600 leading-relaxed flex items-start gap-1.5"
                >
                  {s.riskLevel === 'normal' ? (
                    <CheckCircle2 className="w-3 h-3 text-accent-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-warning-500 shrink-0 mt-0.5" />
                  )}
                  {f}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
};
