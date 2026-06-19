import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  FileCheck,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import {
  AssessmentConclusion,
  CONCLUSION_STATUS_LABEL,
  ConclusionStatus,
} from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  conclusion: AssessmentConclusion;
  onStatusChange?: (status: ConclusionStatus) => void;
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

const ALL_STATUSES: ConclusionStatus[] = [
  'ready-for-design',
  'review-required',
  'adjustment-recommended',
];

export const ConclusionCard = ({ conclusion, onStatusChange }: Props) => {
  const [showDropdown, setShowDropdown] = useState(false);
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
          <div className="flex items-center gap-2 flex-wrap">
            {onStatusChange ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown((v) => !v)}
                  className={cn(
                    'text-xl font-bold flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-white/40 transition-colors',
                    cfg.text,
                  )}
                >
                  {CONCLUSION_STATUS_LABEL[conclusion.status]}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-lg shadow-card border border-ink-100 py-1 min-w-[160px]">
                      {ALL_STATUSES.map((status) => {
                        const sCfg = STATUS_CONFIG[status];
                        const SIcon = sCfg.icon;
                        return (
                          <button
                            key={status}
                            onClick={() => {
                              onStatusChange(status);
                              setShowDropdown(false);
                            }}
                            className={cn(
                              'w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-ink-50 transition-colors',
                              status === conclusion.status
                                ? sCfg.text + ' font-medium'
                                : 'text-ink-700',
                            )}
                          >
                            <SIcon className="w-4 h-4" />
                            {CONCLUSION_STATUS_LABEL[status]}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <h2 className={cn('text-xl font-bold', cfg.text)}>
                {CONCLUSION_STATUS_LABEL[conclusion.status]}
              </h2>
            )}
            <span className="badge bg-white/60 text-ink-600">
              <FileCheck className="w-3 h-3 mr-1" />
              生成于 {conclusion.generatedAt}
            </span>
            {onStatusChange && (
              <span className="text-xs text-ink-500">
                （点击结论可修改）
              </span>
            )}
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
