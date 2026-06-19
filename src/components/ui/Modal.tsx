import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ open, onClose, title, children, footer, className }, ref) => {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-[fade-in-up_0.15s_ease-out]"
          onClick={onClose}
        />
        <div
          ref={ref}
          className={cn(
            'relative z-10 w-full max-w-lg bg-white rounded-lg shadow-soft-lg border border-ink-100 animate-fade-in-up',
            className,
          )}
        >
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-ink-100">
            <h3 className="text-base font-semibold text-ink-800">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-ink-400 hover:text-ink-700 hover:bg-ink-50 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="px-5 py-4">{children}</div>
          {footer && (
            <div className="px-5 py-3 border-t border-ink-100 flex justify-end gap-2 bg-ink-50/50 rounded-b-lg">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  },
);

Modal.displayName = 'Modal';
