import { useNavigate } from 'react-router-dom';
import {
  MoreHorizontal,
  Trash2,
  ClipboardList,
  FileText,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Image,
  MapPin,
  Ruler,
} from 'lucide-react';
import {
  Patient,
  CASE_TYPE_LABEL,
  SECTION_ORDER,
  SECTION_LABEL,
  SectionKey,
} from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useState } from 'react';
import { usePatientStore } from '@/store/usePatientStore';
import { useUIStore } from '@/store/useUIStore';
import { cn } from '@/lib/utils';

interface Props {
  patient: Patient;
}

interface SectionCompleteness {
  key: SectionKey;
  label: string;
  hasImages: boolean;
  hasAnnotations: boolean;
  hasMeasurements: boolean;
  isComplete: boolean;
}

const getSectionCompleteness = (
  patient: Patient,
): SectionCompleteness[] => {
  return SECTION_ORDER.map((key) => {
    const section = patient.sections[key];
    const hasImages = section.images.length > 0;
    const hasAnnotations = section.annotations.length > 0;
    const hasMeasurements = section.measurements.length > 0;
    const isComplete = hasImages && hasAnnotations;
    return {
      key,
      label: SECTION_LABEL[key],
      hasImages,
      hasAnnotations,
      hasMeasurements,
      isComplete,
    };
  });
};

export const PatientCard = ({ patient }: Props) => {
  const navigate = useNavigate();
  const removePatient = usePatientStore((s) => s.removePatient);
  const showToast = useUIStore((s) => s.showToast);
  const [menuOpen, setMenuOpen] = useState(false);

  const completeness = getSectionCompleteness(patient);
  const totalAnnotations = SECTION_ORDER.reduce(
    (sum, k) => sum + patient.sections[k].annotations.length,
    0,
  );
  const totalImages = SECTION_ORDER.reduce(
    (sum, k) => sum + patient.sections[k].images.length,
    0,
  );
  const totalMeasurements = SECTION_ORDER.reduce(
    (sum, k) => sum + patient.sections[k].measurements.length,
    0,
  );
  const completedSections = completeness.filter((s) => s.isComplete).length;
  const progress = Math.round((completedSections / 4) * 100);
  const isReviewed = patient.reviewStatus === 'reviewed';

  const handleDelete = () => {
    if (confirm(`确认删除病例「${patient.name}」吗？此操作不可恢复。`)) {
      removePatient(patient.id);
      showToast('info', `已删除病例：${patient.name}`);
    }
    setMenuOpen(false);
  };

  const navigateToSection = (sectionKey: SectionKey) => {
    navigate(`/patients/${patient.id}/assessment?section=${sectionKey}`);
  };

  return (
    <div className="card p-5 hover:shadow-card-hover transition-all duration-200 group cursor-pointer relative">
      <div
        className="flex items-start gap-4"
        onClick={() => navigate(`/patients/${patient.id}/assessment`)}
      >
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg font-semibold shrink-0 ${
            patient.gender === 'male' ? 'bg-primary-600' : 'bg-accent-500'
          }`}
        >
          {patient.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-semibold text-ink-800">
                  {patient.name}
                </h3>
                <span className="text-xs text-ink-500">
                  {patient.gender === 'male' ? '男' : '女'} · {patient.age}岁
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="badge bg-primary-50 text-primary-700 border border-primary-100">
                  {CASE_TYPE_LABEL[patient.caseType]}
                </span>
                <StatusBadge status={patient.status} />
                <span
                  className={cn(
                    'badge flex items-center gap-1',
                    isReviewed
                      ? 'bg-accent-50 text-accent-700'
                      : 'bg-warning-50 text-warning-700',
                  )}
                >
                  {isReviewed ? (
                    <ShieldCheck className="w-3 h-3" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  {isReviewed ? '已复核' : '待复核'}
                </span>
              </div>
            </div>
            <button
              className="p-1.5 rounded-md text-ink-400 hover:text-ink-700 hover:bg-ink-100 opacity-0 group-hover:opacity-100 transition-opacity relative"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
            >
              <MoreHorizontal className="w-4 h-4" />
              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 z-10 w-36 bg-white rounded-md border border-ink-100 shadow-soft-lg overflow-hidden animate-fade-in-up"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="w-full px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50 flex items-center gap-2"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate(`/patients/${patient.id}/assessment`);
                    }}
                  >
                    <ClipboardList className="w-4 h-4" /> 进入评估
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50 flex items-center gap-2"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate(`/patients/${patient.id}/report`);
                    }}
                  >
                    <FileText className="w-4 h-4" /> 查看报告
                  </button>
                  <div className="h-px bg-ink-100" />
                  <button
                    className="w-full px-3 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 flex items-center gap-2"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4" /> 删除病例
                  </button>
                </div>
              )}
            </button>
          </div>

          <div className="mt-3.5">
            <div className="flex items-center justify-between text-[11px] text-ink-500 mb-1.5">
              <span>评估进度</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  progress === 100
                    ? 'bg-accent-500'
                    : progress >= 50
                      ? 'bg-primary-500'
                      : 'bg-warning-500',
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5 mt-3">
            {completeness.map((s) => (
              <button
                key={s.key}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-md text-[10px] transition-colors',
                  s.isComplete
                    ? 'bg-accent-50 text-accent-700'
                    : s.hasImages
                      ? 'bg-warning-50 text-warning-700'
                      : 'bg-ink-50 text-ink-500 hover:bg-ink-100',
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToSection(s.key);
                }}
                title={`${s.label}：${s.isComplete ? '资料完整' : s.hasImages ? '有照片，缺标注' : '缺照片和标注'}`}
              >
                <div className="flex items-center gap-0.5">
                  {s.isComplete ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  <span className="font-medium">{s.label.slice(0, 2)}</span>
                </div>
                <div className="flex items-center gap-1 text-[9px]">
                  <span className={s.hasImages ? 'text-accent-600' : 'text-ink-400'}>
                    <Image className="w-2.5 h-2.5 inline" />
                  </span>
                  <span className={s.hasAnnotations ? 'text-accent-600' : 'text-ink-400'}>
                    <MapPin className="w-2.5 h-2.5 inline" />
                  </span>
                  {(s.key === 'overjet-overbite' || s.key === 'deviation') && (
                    <span className={s.hasMeasurements ? 'text-primary-600' : 'text-ink-400'}>
                      <Ruler className="w-2.5 h-2.5 inline" />
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-3 text-[11px] text-ink-500">
            <span>📷 {totalImages} 张图像</span>
            <span>📍 {totalAnnotations} 处标注</span>
            {totalMeasurements > 0 && <span>📏 {totalMeasurements} 项测量</span>}
            <span className="ml-auto">更新于 {patient.updatedAt.slice(5)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
