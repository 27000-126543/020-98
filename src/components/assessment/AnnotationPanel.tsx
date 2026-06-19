import { useState, useEffect, useRef } from 'react';
import {
  AlertCircle,
  Trash2,
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Trash,
} from 'lucide-react';
import {
  Annotation,
  AnnotationType,
  ANNOTATION_COLOR,
  ANNOTATION_TYPE_LABEL,
  SECTION_HINT,
  SectionKey,
} from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  sectionKey: SectionKey;
  annotations: Annotation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

export const AnnotationPanel = ({
  sectionKey,
  annotations,
  selectedId,
  onSelect,
  onUpdateNote,
  onRemove,
  onClearAll,
}: Props) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingId && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editingId]);

  const sorted = [...annotations].sort((a, b) => a.orderNum - b.orderNum);

  const startEdit = (a: Annotation) => {
    setEditingId(a.id);
    setDraftNote(a.note);
  };

  const saveEdit = () => {
    if (editingId) {
      onUpdateNote(editingId, draftNote);
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftNote('');
  };

  return (
    <aside className="no-print w-[340px] bg-white border-l border-ink-100 flex flex-col shrink-0">
      <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink-800">标注观察记录</h3>
          <p className="text-xs text-ink-500 mt-0.5">
            当前分区共 {sorted.length} 处标注
          </p>
        </div>
        <div className="flex items-center gap-1">
          {sorted.length > 0 && (
            <button
              onClick={() => {
                if (confirm('确认清空当前分区所有标注？')) onClearAll();
              }}
              className="p-1.5 rounded-md text-ink-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
              title="清空所有标注"
            >
              <Trash className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="p-1.5 rounded-md text-ink-400 hover:bg-ink-100"
          >
            {collapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="mx-4 mt-3 p-3 rounded-md bg-accent-50 border border-accent-100">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-accent-600 shrink-0 mt-0.5" />
              <p className="text-xs text-accent-700 leading-relaxed">
                {SECTION_HINT[sectionKey]}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-2.5">
            {sorted.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-ink-50 flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-ink-300" />
                </div>
                <p className="text-sm text-ink-400">暂无标注</p>
                <p className="text-xs text-ink-400 mt-1">
                  选择左侧工具后点击图像进行标注
                </p>
              </div>
            ) : (
              sorted.map((a) => {
                const color = ANNOTATION_COLOR[a.type];
                const isEditing = editingId === a.id;
                const isSelected = selectedId === a.id;
                return (
                  <div
                    key={a.id}
                    className={cn(
                      'rounded-lg border transition-all p-3 group',
                      isSelected
                        ? 'border-accent-400 bg-accent-50/50 shadow-card'
                        : 'border-ink-100 bg-white hover:border-ink-200',
                    )}
                    onClick={() => onSelect(a.id)}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold font-mono shadow-sm"
                        style={{ backgroundColor: color }}
                      >
                        {a.orderNum}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className="text-xs font-medium"
                            style={{ color }}
                          >
                            {ANNOTATION_TYPE_LABEL[a.type]}
                          </span>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!isEditing && (
                              <button
                                className="p-1 rounded text-ink-400 hover:text-primary-700 hover:bg-primary-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEdit(a);
                                }}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              className="p-1 rounded text-ink-400 hover:text-danger-600 hover:bg-danger-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('删除此条标注？')) onRemove(a.id);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                            <textarea
                              ref={textareaRef}
                              className="textarea text-xs"
                              value={draftNote}
                              onChange={(e) => setDraftNote(e.target.value)}
                              placeholder="填写观察依据..."
                              rows={3}
                            />
                            <div className="flex justify-end gap-1 mt-2">
                              <button
                                className="btn-outline btn-sm"
                                onClick={cancelEdit}
                              >
                                <X className="w-3 h-3" /> 取消
                              </button>
                              <button
                                className="btn-accent btn-sm"
                                onClick={saveEdit}
                              >
                                <Check className="w-3 h-3" /> 保存
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p
                            className={cn(
                              'mt-1 text-xs leading-relaxed',
                              a.note ? 'text-ink-700' : 'text-ink-400 italic',
                            )}
                          >
                            {a.note || '（点击编辑填写观察依据）'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </aside>
  );
};

export const ANNOTATION_TOOL_CONFIG: Array<{
  type: AnnotationType;
  label: string;
  hint: string;
}> = [
  {
    type: 'early-contact',
    label: '早接触',
    hint: '标记正中咬合时过早接触的牙尖或区域',
  },
  {
    type: 'occlusal-interference',
    label: '咬合干扰',
    hint: '标记前伸、侧方运动中的咬合障碍点',
  },
  {
    type: 'midline-deviation',
    label: '中线偏移',
    hint: '标记上下牙列中线不一致处',
  },
  {
    type: 'jaw-instability',
    label: '颌位不稳定',
    hint: '标记颌位记录不确定、易偏移的区域表现',
  },
];
