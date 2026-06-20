import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Save,
  FileText,
  UserRound,
} from 'lucide-react';
import { usePatientStore } from '@/store/usePatientStore';
import { useUIStore } from '@/store/useUIStore';
import {
  AnnotationType,
  CASE_TYPE_LABEL,
  SECTION_ORDER,
  SectionKey,
  Measurement,
  MEASUREMENT_ENABLED_SECTIONS,
  MeasurementCategory,
} from '@/types';
import { SectionTabs } from '@/components/assessment/SectionTabs';
import { ThumbnailList } from '@/components/assessment/ThumbnailList';
import { ImageAnnotator } from '@/components/assessment/ImageAnnotator';
import { AnnotationPanel, ANNOTATION_TOOL_CONFIG } from '@/components/assessment/AnnotationPanel';
import { AnnotationToolbar } from '@/components/assessment/AnnotationToolbar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { generateConclusion } from '@/utils/conclusion';

const DEFAULT_CATEGORY_MAP: Record<SectionKey, Record<Measurement['type'], MeasurementCategory>> = {
  'centric-relation': { distance: 'occlusal-plane', 'reference-line': 'occlusal-plane' },
  'vertical-dimension': { distance: 'vertical-overbite', 'reference-line': 'occlusal-plane' },
  'overjet-overbite': { distance: 'horizontal-overjet', 'reference-line': 'occlusal-plane' },
  deviation: { distance: 'midline-deviation', 'reference-line': 'occlusal-plane' },
};

export const AssessmentDetail = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSection = searchParams.get('section') as SectionKey | null;
  const patient = usePatientStore((s) => s.getPatient(id));
  const addSectionImage = usePatientStore((s) => s.addSectionImage);
  const removeSectionImage = usePatientStore((s) => s.removeSectionImage);
  const addAnnotation = usePatientStore((s) => s.addAnnotation);
  const updateAnnotation = usePatientStore((s) => s.updateAnnotation);
  const removeAnnotation = usePatientStore((s) => s.removeAnnotation);
  const clearSectionAnnotations = usePatientStore(
    (s) => s.clearSectionAnnotations,
  );
  const addMeasurement = usePatientStore((s) => s.addMeasurement);
  const updateMeasurement = usePatientStore((s) => s.updateMeasurement);
  const removeMeasurement = usePatientStore((s) => s.removeMeasurement);
  const clearSectionMeasurements = usePatientStore(
    (s) => s.clearSectionMeasurements,
  );
  const touchPatient = usePatientStore((s) => s.touchPatient);
  const updatePatientStatus = usePatientStore((s) => s.updatePatientStatus);
  const showToast = useUIStore((s) => s.showToast);
  const setPendingConclusion = useUIStore((s) => s.setPendingConclusion);

  const [sectionKey, setSectionKey] = useState<SectionKey>(
    initialSection && SECTION_ORDER.includes(initialSection)
      ? initialSection
      : 'centric-relation',
  );
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<
    AnnotationType | 'pan' | 'measure-distance' | 'measure-line' | null
  >(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!patient) return;
    const section = patient.sections[sectionKey];
    if (section.images.length > 0 && !activeImageId) {
      setActiveImageId(section.images[0].id);
    }
    if (
      activeImageId &&
      !section.images.find((i) => i.id === activeImageId)
    ) {
      setActiveImageId(section.images[0]?.id || null);
    }
  }, [patient, sectionKey, activeImageId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        return;
      if (e.code === 'Space') {
        e.preventDefault();
        setActiveTool((t) => (t === 'pan' ? null : 'pan'));
      }
      ANNOTATION_TOOL_CONFIG.forEach((tool, i) => {
        if (e.key === String(i + 1)) {
          setActiveTool((t) => (t === tool.type ? null : tool.type));
        }
      });
      if (e.key === 'Escape') {
        setActiveTool(null);
        setSelectedAnnotationId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const currentSection = patient?.sections[sectionKey];
  const activeImage = useMemo(
    () => currentSection?.images.find((i) => i.id === activeImageId) || null,
    [currentSection, activeImageId],
  );

  if (!patient) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-ink-500 mb-4">病例不存在</p>
        <button className="btn-outline" onClick={() => navigate('/patients')}>
          <ArrowLeft className="w-4 h-4" /> 返回列表
        </button>
      </div>
    );
  }

  const currentIdx = SECTION_ORDER.indexOf(sectionKey);
  const handlePrev = () => {
    if (currentIdx > 0) setSectionKey(SECTION_ORDER[currentIdx - 1]);
  };
  const handleNext = () => {
    if (currentIdx < SECTION_ORDER.length - 1)
      setSectionKey(SECTION_ORDER[currentIdx + 1]);
  };

  const handleImageUpload = async (files: FileList) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        addSectionImage(patient.id, sectionKey, {
          url,
          name: file.name,
        });
      };
      reader.readAsDataURL(file);
    });
    showToast('success', `已添加 ${files.length} 张图像`);
  };

  const handleRemoveImage = (imageId: string) => {
    if (confirm('删除该图像将同时删除其上的所有标注，确认删除？')) {
      removeSectionImage(patient.id, sectionKey, imageId);
      showToast('info', '图像已删除');
    }
  };

  const handleAddAnnotation = ({ x, y }: { x: number; y: number }) => {
    if (!activeImage || !activeTool || activeTool === 'pan') return;
    const a = addAnnotation(patient.id, sectionKey, {
      imageId: activeImage.id,
      type: activeTool as AnnotationType,
      x,
      y,
    });
    setSelectedAnnotationId(a.id);
  };

  const handleAddMeasurement = (data: {
    type: Measurement['type'];
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }) => {
    if (!activeImage) return;
    const defaultCategory = DEFAULT_CATEGORY_MAP[sectionKey][data.type];
    const defaultLabel = data.type === 'distance' ? '距离测量' : '参考线';
    const m = addMeasurement(patient.id, sectionKey, {
      imageId: activeImage.id,
      type: data.type,
      category: defaultCategory,
      x1: data.x1,
      y1: data.y1,
      x2: data.x2,
      y2: data.y2,
      label: defaultLabel,
      valueMm: 0,
      direction: 'none',
      note: '',
    });
    setSelectedAnnotationId(m.id);
    showToast('success', '测量已添加，可在右侧面板编辑毫米数和方向');
  };

  const handleSave = () => {
    touchPatient(patient.id);
    showToast('success', '草稿已保存');
  };

  const handleGenerateConclusion = () => {
    const total = SECTION_ORDER.reduce(
      (sum, k) => sum + patient.sections[k].annotations.length,
      0,
    );
    if (total === 0) {
      showToast('warning', '尚未进行任何标注，请先完成评估');
      return;
    }
    setPendingConclusion({ patientId: patient.id });
    setTimeout(() => {
      generateConclusion(patient);
      updatePatientStatus(patient.id, 'completed');
      setPendingConclusion(null);
      navigate(`/patients/${patient.id}/report`);
    }, 900);
  };

  return (
    <div className="h-full flex flex-col bg-ink-50">
      <div className="no-print h-14 bg-white border-b border-ink-100 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            className="p-1.5 rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-800 transition-colors"
            onClick={() => navigate('/patients')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-ink-200" />
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold ${
                patient.gender === 'male' ? 'bg-primary-600' : 'bg-accent-500'
              }`}
            >
              <UserRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink-800">
                  {patient.name}
                </span>
                <span className="text-xs text-ink-500">
                  {patient.gender === 'male' ? '男' : '女'} · {patient.age}岁
                </span>
                <span className="badge bg-primary-50 text-primary-700 border border-primary-100">
                  {CASE_TYPE_LABEL[patient.caseType]}
                </span>
                <StatusBadge status={patient.status} />
              </div>
              <p className="text-xs text-ink-500 mt-0.5">
                病例编号 {patient.id.toUpperCase()} · 更新于 {patient.updatedAt}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-outline btn-sm" onClick={handleSave}>
            <Save className="w-3.5 h-3.5" /> 保存草稿
          </button>
          <button className="btn-accent btn-sm" onClick={handleGenerateConclusion}>
            <FileText className="w-3.5 h-3.5" /> 生成评估结论
          </button>
        </div>
      </div>

      <SectionTabs
        active={sectionKey}
        onChange={(k) => {
          setSectionKey(k);
          setActiveImageId(null);
          setSelectedAnnotationId(null);
        }}
        getCount={(k) => patient.sections[k].annotations.length}
      />

      <div className="flex-1 min-h-0 flex">
        {currentSection && (
          <ThumbnailList
            images={currentSection.images}
            activeId={activeImageId}
            onSelect={setActiveImageId}
            onUpload={handleImageUpload}
            onRemove={handleRemoveImage}
          />
        )}

        <div className="flex-1 relative flex flex-col min-w-0">
          <AnnotationToolbar
            activeTool={activeTool}
            onChange={setActiveTool}
            sectionKey={sectionKey}
          />
          {currentSection && (
            <ImageAnnotator
              image={activeImage}
              annotations={currentSection.annotations}
              measurements={currentSection.measurements}
              activeTool={activeTool}
              onAddAnnotation={handleAddAnnotation}
              onAddMeasurement={handleAddMeasurement}
              onSelectAnnotation={setSelectedAnnotationId}
              selectedAnnotationId={selectedAnnotationId}
            />
          )}

          <div className="no-print h-12 border-t border-ink-100 bg-white flex items-center justify-between px-4 shrink-0">
            <div className="text-xs text-ink-500">
              {activeTool ? (
                activeTool === 'pan' ? (
                  <span>当前：平移视图 · 点击图像区域拖拽移动</span>
                ) : activeTool === 'measure-distance' ? (
                  <span>
                    当前工具：<span className="font-medium text-primary-600">距离测量</span>
                    {'  ·  在图像上点击两点完成测量（按 Esc 取消）'}
                  </span>
                ) : activeTool === 'measure-line' ? (
                  <span>
                    当前工具：<span className="font-medium text-primary-600">参考线</span>
                    {'  ·  在图像上点击两点绘制参考线（按 Esc 取消）'}
                  </span>
                ) : (
                  <span>
                    当前标注工具：
                    <span className="font-medium text-ink-700">
                      {
                        ANNOTATION_TOOL_CONFIG.find(
                          (t) => t.type === activeTool,
                        )?.label
                      }
                    </span>
                    {'  ·  点击图像添加标注点（按 Esc 取消）'}
                  </span>
                )
              ) : (
                <span>
                  快捷键：1-4 切换标注工具 · 空格 平移 · Esc 取消选择
                  {(MEASUREMENT_ENABLED_SECTIONS as readonly string[]).includes(sectionKey) && ' · 测量工具见右侧工具栏'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn-outline btn-sm"
                onClick={handlePrev}
                disabled={currentIdx === 0}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> 上一分区
              </button>
              <button
                className="btn-primary btn-sm"
                onClick={handleNext}
                disabled={currentIdx === SECTION_ORDER.length - 1}
              >
                下一分区 <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {currentSection && (
          <AnnotationPanel
            sectionKey={sectionKey}
            annotations={currentSection.annotations}
            measurements={currentSection.measurements}
            selectedId={selectedAnnotationId}
            onSelect={setSelectedAnnotationId}
            onUpdateNote={(id, note) =>
              updateAnnotation(patient.id, sectionKey, id, { note })
            }
            onRemove={(id) => {
              removeAnnotation(patient.id, sectionKey, id);
              if (selectedAnnotationId === id) setSelectedAnnotationId(null);
            }}
            onClearAll={() => {
              clearSectionAnnotations(patient.id, sectionKey);
              setSelectedAnnotationId(null);
            }}
            onUpdateMeasurement={(id, data) =>
              updateMeasurement(patient.id, sectionKey, id, data)
            }
            onRemoveMeasurement={(id) => {
              removeMeasurement(patient.id, sectionKey, id);
              if (selectedAnnotationId === id) setSelectedAnnotationId(null);
            }}
            onClearMeasurements={() => {
              clearSectionMeasurements(patient.id, sectionKey);
            }}
          />
        )}
      </div>
    </div>
  );
};
