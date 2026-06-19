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
  Ruler,
} from 'lucide-react';
import {
  Annotation,
  AnnotationType,
  ANNOTATION_COLOR,
  ANNOTATION_TYPE_LABEL,
  SECTION_HINT,
  SectionKey,
  Measurement,
  MEASUREMENT_ENABLED_SECTIONS,
  MeasurementDirection,
  MeasurementCategory,
  MEASUREMENT_CATEGORY_LABEL,
} from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  sectionKey: SectionKey;
  annotations: Annotation[];
  measurements: Measurement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onUpdateMeasurement: (id: string, data: Partial<Measurement>) => void;
  onRemoveMeasurement: (id: string) => void;
  onClearMeasurements: () => void;
}

const CATEGORY_OPTIONS: Array<{ value: MeasurementCategory; label: string }> = [
  { value: 'horizontal-overjet', label: MEASUREMENT_CATEGORY_LABEL['horizontal-overjet'] },
  { value: 'vertical-overbite', label: MEASUREMENT_CATEGORY_LABEL['vertical-overbite'] },
  { value: 'midline-deviation', label: MEASUREMENT_CATEGORY_LABEL['midline-deviation'] },
  { value: 'occlusal-plane', label: MEASUREMENT_CATEGORY_LABEL['occlusal-plane'] },
];

const DIRECTION_OPTIONS: Array<{ value: MeasurementDirection; label: string }> = [
  { value: 'none', label: '无方向' },
  { value: 'horizontal', label: '水平' },
  { value: 'vertical', label: '垂直' },
  { value: 'left', label: '向左偏移' },
  { value: 'right', label: '向右偏移' },
];

export const AnnotationPanel = ({
  sectionKey,
  annotations,
  measurements,
  selectedId,
  onSelect,
  onUpdateNote,
  onRemove,
  onClearAll,
  onUpdateMeasurement,
  onRemoveMeasurement,
  onClearMeasurements,
}: Props) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMeasurementId, setEditingMeasurementId] = useState<string | null>(
    null,
  );
  const [draftNote, setDraftNote] = useState('');
  const [draftMeasurement, setDraftMeasurement] = useState<Partial<Measurement> & { category?: MeasurementCategory }>({});
  const [collapsed, setCollapsed] = useState(false);
  const [measurementsCollapsed, setMeasurementsCollapsed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMeasurementEnabled =
    (MEASUREMENT_ENABLED_SECTIONS as readonly string[]).includes(sectionKey);

  useEffect(() => {
    if (editingId && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editingId]);

  const sortedAnnotations = [...annotations].sort((a, b) => a.orderNum - b.orderNum);
  const sortedMeasurements = [...measurements].sort((a, b) => a.orderNum - b.orderNum);

  const startEdit = (a: Annotation) => {
    setEditingId(a.id);
    setDraftNote(a.note);
    setEditingMeasurementId(null);
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

  const startEditMeasurement = (m: Measurement) => {
    setEditingMeasurementId(m.id);
    setDraftMeasurement({
      label: m.label,
      valueMm: m.valueMm,
      direction: m.direction,
      category: m.category,
      note: m.note,
    });
    setEditingId(null);
  };

  const saveEditMeasurement = () => {
    if (editingMeasurementId) {
      onUpdateMeasurement(editingMeasurementId, draftMeasurement);
      setEditingMeasurementId(null);
      setDraftMeasurement({});
    }
  };

  const cancelEditMeasurement = () => {
    setEditingMeasurementId(null);
    setDraftMeasurement({});
  };

  return (
    <aside className="no-print w-[360px] bg-white border-l border-ink-100 flex flex-col shrink-0">
      {/* Annotation Section */}
      <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink-800">标注观察记录</h3>
          <p className="text-xs text-ink-500 mt-0.5">
            当前分区共 {sortedAnnotations.length} 处标注
          </p>
        </div>
        <div className="flex items-center gap-1">
          {sortedAnnotations.length > 0 && (
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
        <div className="flex-1 flex flex-col min-h-0">
          <div className="mx-4 mt-3 p-3 rounded-md bg-accent-50 border border-accent-100">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-accent-600 shrink-0 mt-0.5" />
              <p className="text-xs text-accent-700 leading-relaxed">
                {SECTION_HINT[sectionKey]}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-2.5">
            {sortedAnnotations.length === 0 ? (
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
              sortedAnnotations.map((a) => {
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
        </div>
      )}

      {/* Measurements Section */}
      {isMeasurementEnabled && (
        <>
          <div className="border-t border-ink-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary-100 flex items-center justify-center">
                <Ruler className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink-800">测量记录</h3>
                <p className="text-xs text-ink-500 mt-0.5">
                  共 {sortedMeasurements.length} 项测量
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {sortedMeasurements.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('确认清空当前分区所有测量？')) onClearMeasurements();
                  }}
                  className="p-1.5 rounded-md text-ink-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
                  title="清空所有测量"
                >
                  <Trash className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setMeasurementsCollapsed((v) => !v)}
                className="p-1.5 rounded-md text-ink-400 hover:bg-ink-100"
              >
                {measurementsCollapsed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {!measurementsCollapsed && (
            <div className="overflow-y-auto scrollbar-thin px-4 py-3 space-y-2.5 max-h-[300px] border-b border-ink-100">
              {sortedMeasurements.length === 0 ? (
                <div className="py-6 text-center">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-ink-50 flex items-center justify-center">
                    <Ruler className="w-4 h-4 text-ink-300" />
                  </div>
                  <p className="text-xs text-ink-400">暂无测量记录</p>
                  <p className="text-[11px] text-ink-400 mt-0.5">
                    选择工具栏中的测量工具，在图像上点击两点完成测量
                  </p>
                </div>
              ) : (
                sortedMeasurements.map((m) => {
                  const isEditing = editingMeasurementId === m.id;
                  const isSelected = selectedId === m.id;
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        'rounded-lg border transition-all p-3 group',
                        isSelected
                          ? 'border-primary-400 bg-primary-50/50 shadow-card'
                          : 'border-ink-100 bg-white hover:border-ink-200',
                      )}
                      onClick={() => onSelect(m.id)}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={cn(
                            'w-6 h-6 rounded shrink-0 flex items-center justify-center text-white text-[10px] font-bold font-mono shadow-sm',
                            m.type === 'distance' ? 'bg-primary-500' : 'bg-ink-500',
                          )}
                        >
                          {m.orderNum}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-primary-700">
                                {m.label || (m.type === 'distance' ? '距离测量' : '参考线')}
                              </span>
                              {m.category && (
                                <span className="text-[10px] text-accent-700 bg-accent-100 px-1.5 py-0.5 rounded">
                                  {MEASUREMENT_CATEGORY_LABEL[m.category]}
                                </span>
                              )}
                              {m.type === 'distance' && m.valueMm > 0 && (
                                <span className="text-[11px] font-mono text-primary-600 font-semibold bg-primary-100 px-1.5 py-0.5 rounded">
                                  {m.valueMm.toFixed(1)} mm
                                </span>
                              )}
                              {m.direction && m.direction !== 'none' && (
                                <span className="text-[10px] text-ink-500 bg-ink-100 px-1.5 py-0.5 rounded">
                                  {DIRECTION_OPTIONS.find((d) => d.value === m.direction)?.label}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!isEditing && (
                                <button
                                  className="p-1 rounded text-ink-400 hover:text-primary-700 hover:bg-primary-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditMeasurement(m);
                                  }}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                className="p-1 rounded text-ink-400 hover:text-danger-600 hover:bg-danger-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('删除此条测量记录？'))
                                    onRemoveMeasurement(m.id);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {isEditing ? (
                            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-[10px] text-ink-500 mb-0.5">标签</label>
                                  <input
                                    className="input text-xs w-full"
                                    value={draftMeasurement.label || ''}
                                    onChange={(e) =>
                                      setDraftMeasurement({
                                        ...draftMeasurement,
                                        label: e.target.value,
                                      })
                                    }
                                    placeholder="测量标签"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-ink-500 mb-0.5">分类</label>
                                  <select
                                    className="input text-xs w-full"
                                    value={draftMeasurement.category || ''}
                                    onChange={(e) =>
                                      setDraftMeasurement({
                                        ...draftMeasurement,
                                        category: e.target.value as MeasurementCategory,
                                      })
                                    }
                                  >
                                    <option value="">未分类</option>
                                    {CATEGORY_OPTIONS.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                {m.type === 'distance' && (
                                  <div>
                                    <label className="block text-[10px] text-ink-500 mb-0.5">毫米数 (mm)</label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      className="input text-xs w-full"
                                      value={
                                        draftMeasurement.valueMm !== undefined
                                          ? draftMeasurement.valueMm
                                          : ''
                                      }
                                      onChange={(e) =>
                                        setDraftMeasurement({
                                          ...draftMeasurement,
                                          valueMm: parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      placeholder="输入实际毫米数"
                                    />
                                  </div>
                                )}
                                <div>
                                  <label className="block text-[10px] text-ink-500 mb-0.5">偏移方向</label>
                                  <select
                                    className="input text-xs w-full"
                                    value={draftMeasurement.direction || 'none'}
                                    onChange={(e) =>
                                      setDraftMeasurement({
                                        ...draftMeasurement,
                                        direction: e.target.value as MeasurementDirection,
                                      })
                                    }
                                  >
                                    {DIRECTION_OPTIONS.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] text-ink-500 mb-0.5">备注</label>
                                  <textarea
                                    className="textarea text-xs w-full"
                                    value={draftMeasurement.note || ''}
                                    onChange={(e) =>
                                      setDraftMeasurement({
                                        ...draftMeasurement,
                                        note: e.target.value,
                                      })
                                    }
                                    placeholder="测量说明"
                                    rows={2}
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-1 mt-2">
                                <button
                                  className="btn-outline btn-sm"
                                  onClick={cancelEditMeasurement}
                                >
                                  <X className="w-3 h-3" /> 取消
                                </button>
                                <button
                                  className="btn-accent btn-sm"
                                  onClick={saveEditMeasurement}
                                >
                                  <Check className="w-3 h-3" /> 保存
                                </button>
                              </div>
                            </div>
                          ) : (
                            m.note && (
                              <p className="mt-1 text-xs text-ink-600 leading-relaxed">
                                {m.note}
                              </p>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
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
