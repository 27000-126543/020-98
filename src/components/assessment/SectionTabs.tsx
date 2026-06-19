import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionKey, SECTION_LABEL, SECTION_ORDER } from '@/types';

interface Props {
  active: SectionKey;
  onChange: (k: SectionKey) => void;
  getCount: (k: SectionKey) => number;
}

export const SectionTabs = ({ active, onChange, getCount }: Props) => {
  const idx = SECTION_ORDER.indexOf(active);

  return (
    <div className="no-print border-b border-ink-200 bg-white px-6">
      <div className="flex items-center justify-between">
        <div className="flex">
          {SECTION_ORDER.map((k) => {
            const count = getCount(k);
            return (
              <button
                key={k}
                className={active === k ? 'tab-active' : 'tab'}
                onClick={() => onChange(k)}
              >
                <span className="inline-flex items-center gap-2">
                  {SECTION_LABEL[k]}
                  {count > 0 && (
                    <span
                      className={`w-5 h-5 inline-flex items-center justify-center rounded-full text-[11px] font-semibold ${
                        active === k
                          ? 'bg-accent-500 text-white'
                          : 'bg-ink-100 text-ink-600'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1 pb-2">
          <button
            className="p-1.5 rounded-md text-ink-500 hover:bg-ink-100 disabled:opacity-30"
            disabled={idx === 0}
            onClick={() => onChange(SECTION_ORDER[idx - 1])}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-ink-500 w-10 text-center">
            {idx + 1} / 4
          </span>
          <button
            className="p-1.5 rounded-md text-ink-500 hover:bg-ink-100 disabled:opacity-30"
            disabled={idx === SECTION_ORDER.length - 1}
            onClick={() => onChange(SECTION_ORDER[idx + 1])}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
