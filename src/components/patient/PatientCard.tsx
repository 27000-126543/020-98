import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Trash2, ClipboardList, FileText } from 'lucide-react';
import { Patient, CASE_TYPE_LABEL, SECTION_ORDER } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useState } from 'react';
import { usePatientStore } from '@/store/usePatientStore';
import { useUIStore } from '@/store/useUIStore';

interface Props {
  patient: Patient;
}

export const PatientCard = ({ patient }: Props) => {
  const navigate = useNavigate();
  const removePatient = usePatientStore((s) => s.removePatient);
  const showToast = useUIStore((s) => s.showToast);
  const [menuOpen, setMenuOpen] = useState(false);

  const totalAnnotations = SECTION_ORDER.reduce(
    (sum, k) => sum + patient.sections[k].annotations.length,
    0,
  );
  const totalImages = SECTION_ORDER.reduce(
    (sum, k) => sum + patient.sections[k].images.length,
    0,
  );
  const completedSections = SECTION_ORDER.filter(
    (k) => patient.sections[k].annotations.length > 0 || patient.sections[k].images.length > 0,
  ).length;
  const progress = Math.round((completedSections / 4) * 100);

  const handleDelete = () => {
    if (confirm(`确认删除病例「${patient.name}」吗？此操作不可恢复。`)) {
      removePatient(patient.id);
      showToast('info', `已删除病例：${patient.name}`);
    }
    setMenuOpen(false);
  };

  return (
    <div className="card p-5 hover:shadow-card-hover transition-all duration-200 group cursor-pointer relative"
      onClick={() => navigate(`/patients/${patient.id}/assessment`)}
    >
      <div className="flex items-start gap-4">
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
                  {patient.status === 'completed' && (
                    <button
                      className="w-full px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50 flex items-center gap-2"
                      onClick={() => {
                        setMenuOpen(false);
                        navigate(`/patients/${patient.id}/report`);
                      }}
                    >
                      <FileText className="w-4 h-4" /> 查看报告
                    </button>
                  )}
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
                className="h-full bg-accent-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 text-[11px] text-ink-500">
            <span>📷 {totalImages} 张图像</span>
            <span>📍 {totalAnnotations} 处标注</span>
            <span className="ml-auto">更新于 {patient.updatedAt.slice(5)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
