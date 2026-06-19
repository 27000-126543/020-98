import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  FileCheck,
} from 'lucide-react';
import { AssessmentConclusion, CONCLUSION_STATUS_LABEL } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  conclusion: AssessmentConclusion;
}

const STATUS_CONFIG = {
  'ready-for-design': {
    icon: CheckCircle2,
    bg: 'bg-accent-50',
    border: 'border-accent-200',
    iconBg: 'bg-accent-500',
    text: 'text-accent-800',
    subText: 'text-accent-700',
  },
  'review-required': {
    icon: AlertTriangle,
    bg: 'bg-warning-50',
    border: 'border-warning-200',
    iconBg: 'bg-warning-500',
    text: 'text-warning-800',
    subText: 'text-warning-700',
  },
  'adjustment-recommended': {
    icon: ShieldAlert,
    bg: 'bg-danger-50',
    border: 'border-danger-200',
    iconBg: 'bg-danger-500',
    text: 'text-danger-800',
    subText: 'text-danger-700',
  },
};

export const ConclusionCard = ({ conclusion }: Props) => {
  const cfg = STATUS_CONFIG[conclusion.status];
  const Icon = cfg.icon;

  return (
    <div className={cn('rounded-xl border-2 p-6', cfg.bg, cfg.border)}>
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-lg',
            cfg.iconBg,
          )}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className={cn('text-xl font-bold', cfg.text)}>
              {CONCLUSION_STATUS_LABEL[conclusion.status]}
            </h2>
            <span className="badge bg-white/60 text-ink-600">
              <FileCheck className="w-3 h-3 mr-1" />
              生成于 {conclusion.generatedAt}
            </span>
          </div>
          <ul className="mt-3 space-y-1.5">
            {conclusion.summary.map((s, i) => (
              <li
                key={i}
                className={cn(
                  'text-sm leading-relaxed flex gap-2',
                  cfg.subText,
                )}
              >
                <span className="shrink-0 mt-0.5">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
