import { cn } from '@/lib/utils';
import { AssessmentStatus, ConclusionStatus } from '@/types';

interface StatusBadgeProps {
  status: AssessmentStatus | ConclusionStatus;
  className?: string;
}

const STYLE_MAP: Record<string, string> = {
  draft: 'bg-ink-100 text-ink-600',
  'in-progress': 'bg-accent-50 text-accent-700 border border-accent-200',
  completed: 'bg-primary-100 text-primary-700',
  'review-required': 'bg-warning-100 text-warning-800',
  'ready-for-design': 'bg-accent-100 text-accent-800',
  'adjustment-recommended': 'bg-danger-100 text-danger-700',
};

const LABEL_MAP: Record<string, string> = {
  draft: '草稿',
  'in-progress': '评估中',
  completed: '已完成',
  'review-required': '需复核',
  'ready-for-design': '可进入修复设计',
  'adjustment-recommended': '建议先行调整',
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => (
  <span className={cn('badge', STYLE_MAP[status], className)}>
    {LABEL_MAP[status]}
  </span>
);
