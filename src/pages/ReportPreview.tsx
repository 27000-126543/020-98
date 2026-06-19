import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Edit3,
  Stethoscope,
  Loader2,
  Save,
  RefreshCw,
  Clock,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { usePatientStore } from '@/store/usePatientStore';
import { useUIStore } from '@/store/useUIStore';
import {
  CASE_TYPE_LABEL,
  SECTION_ORDER,
  SavedConclusion,
  ConclusionStatus,
  ReviewInfo,
} from '@/types';
import { generateConclusion } from '@/utils/conclusion';
import { ConclusionCard } from '@/components/report/ConclusionCard';
import { SectionSummaryCard } from '@/components/report/SectionSummaryCard';
import { PatientExplanation } from '@/components/report/PatientExplanation';
import { cn } from '@/lib/utils';

export const ReportPreview = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const patient = usePatientStore((s) => s.getPatient(id));
  const saveConclusion = usePatientStore((s) => s.saveConclusion);
  const clearSavedConclusion = usePatientStore((s) => s.clearSavedConclusion);
  const reviewPatient = usePatientStore((s) => s.reviewPatient);
  const pending = useUIStore((s) => s.pendingConclusion);
  const showToast = useUIStore((s) => s.showToast);

  const generatedConclusion = useMemo(() => {
    if (!patient) return null;
    return generateConclusion(patient);
  }, [patient]);

  const [useSaved, setUseSaved] = useState(false);
  const [patientText, setPatientText] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<ConclusionStatus | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewOpinion, setReviewOpinion] = useState('');

  useEffect(() => {
    if (!patient) return;
    if (patient.savedConclusion) {
      setUseSaved(true);
      setPatientText(patient.savedConclusion.patientExplanation);
      setSelectedStatus(patient.savedConclusion.status);
    } else if (generatedConclusion) {
      setUseSaved(false);
      setPatientText(generatedConclusion.patientExplanation);
      setSelectedStatus(generatedConclusion.status);
    }
  }, [patient, generatedConclusion]);

  const activeConclusion = useMemo(() => {
    if (!generatedConclusion) return null;
    if (useSaved && patient?.savedConclusion) {
      return {
        ...generatedConclusion,
        status: patient.savedConclusion.status,
        summary: patient.savedConclusion.summary,
        sectionSummaries: patient.savedConclusion.sectionSummaries,
        patientExplanation: patientText,
      };
    }
    return {
      ...generatedConclusion,
      patientExplanation: patientText,
      status: selectedStatus || generatedConclusion.status,
    };
  }, [generatedConclusion, useSaved, patient, patientText, selectedStatus]);

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

  if (pending?.patientId === patient.id) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-ink-50">
        <div className="card p-8 flex flex-col items-center text-center max-w-sm">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-accent-100" />
            <Loader2 className="absolute inset-0 w-16 h-16 text-accent-500 animate-spin" />
          </div>
          <h3 className="text-base font-semibold text-ink-800 mb-1">
            正在生成评估结论...
          </h3>
          <p className="text-sm text-ink-500">
            正在综合四个分区的标注数据进行咬合风险分析
          </p>
        </div>
      </div>
    );
  }

  if (!activeConclusion || !generatedConclusion) return null;

  const totalAnnotations = SECTION_ORDER.reduce(
    (sum, k) => sum + patient.sections[k].annotations.length,
    0,
  );

  const totalMeasurements = SECTION_ORDER.reduce(
    (sum, k) => sum + patient.sections[k].measurements.length,
    0,
  );

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const savedData: SavedConclusion = {
        status: activeConclusion.status,
        summary: activeConclusion.summary,
        sectionSummaries: activeConclusion.sectionSummaries,
        patientExplanation: patientText,
        savedAt: new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
        generatedAt: generatedConclusion.generatedAt,
        reviewInfo: patient.savedConclusion?.reviewInfo || null,
      };
      saveConclusion(patient.id, savedData);
      setUseSaved(true);
      showToast('success', '已保存修改，下次打开报告时将显示此版本');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = () => {
    if (confirm('确认重新生成？这将覆盖当前已保存的结论和患者沟通说明。')) {
      clearSavedConclusion(patient.id);
      setUseSaved(false);
      setPatientText(generatedConclusion.patientExplanation);
      setSelectedStatus(generatedConclusion.status);
      showToast('info', '已重新生成默认结论');
    }
  };

  const handleStatusChange = (status: ConclusionStatus) => {
    setSelectedStatus(status);
    setUseSaved(false);
  };

  const handleReview = () => {
    if (!reviewName.trim()) {
      showToast('warning', '请输入复核医生姓名');
      return;
    }
    const reviewInfo: ReviewInfo = {
      reviewerName: reviewName.trim(),
      reviewedAt: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      opinion: reviewOpinion.trim(),
    };
    reviewPatient(patient.id, reviewInfo);
    if (patient.savedConclusion) {
      saveConclusion(patient.id, {
        ...patient.savedConclusion,
        reviewInfo,
      });
    }
    setReviewFormOpen(false);
    setReviewName('');
    setReviewOpinion('');
    showToast('success', `已由 ${reviewInfo.reviewerName} 完成复核`);
  };

  const isReviewed = patient.reviewStatus === 'reviewed';
  const existingReview = patient.reviewInfo;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-ink-100">
      <div className="no-print sticky top-0 z-20 h-14 bg-white border-b border-ink-100 px-6 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            className="p-1.5 rounded-md text-ink-500 hover:bg-ink-100 transition-colors"
            onClick={() => navigate(`/patients/${patient.id}/assessment`)}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-ink-800">
              咬合评估报告
            </h1>
            <p className="text-xs text-ink-500">
              {patient.name} · {CASE_TYPE_LABEL[patient.caseType]} · 共{' '}
              {totalAnnotations} 处标注
              {totalMeasurements > 0 && ` · ${totalMeasurements} 项测量`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border',
              isReviewed
                ? 'bg-accent-50 text-accent-700 border-accent-200'
                : 'bg-warning-50 text-warning-700 border-warning-200',
            )}
          >
            {isReviewed ? (
              <ShieldCheck className="w-3.5 h-3.5" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )}
            <span>{isReviewed ? '已复核' : '待复核'}</span>
          </div>
          {patient.savedConclusion && (
            <div className="flex items-center gap-1.5 text-xs text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full border border-primary-100">
              <Clock className="w-3.5 h-3.5" />
              <span>保存：{patient.savedConclusion.savedAt}</span>
            </div>
          )}
          {!isReviewed && (
            <button
              className="btn-outline btn-sm"
              onClick={() => setReviewFormOpen(true)}
            >
              <UserCheck className="w-3.5 h-3.5" /> 复核确认
            </button>
          )}
          <button
            className="btn-outline btn-sm"
            onClick={handleRegenerate}
            title="重新生成默认结论"
          >
            <RefreshCw className="w-3.5 h-3.5" /> 重新生成
          </button>
          <button
            className="btn-outline btn-sm"
            onClick={() => navigate(`/patients/${patient.id}/assessment`)}
          >
            <Edit3 className="w-3.5 h-3.5" /> 返回编辑
          </button>
          <button className="btn-outline btn-sm" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5" /> 打印
          </button>
          <button
            className="btn-accent btn-sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> 保存中...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" /> 保存修改
              </>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-ink-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-primary-800 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-ink-800">
                  口腔咬合评估报告
                </h2>
                <p className="text-xs text-ink-500">
                  Occlusal Assessment Report
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-ink-500 space-y-0.5">
              <p>报告编号：{patient.id.toUpperCase()}</p>
              <p>生成时间：{generatedConclusion.generatedAt}</p>
              {useSaved && patient.savedConclusion && (
                <p className="text-primary-600 font-medium">
                  最后保存：{patient.savedConclusion.savedAt}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-6 mt-5 text-sm">
            <div>
              <p className="text-xs text-ink-500 mb-1">患者姓名</p>
              <p className="font-medium text-ink-800">{patient.name}</p>
            </div>
            <div>
              <p className="text-xs text-ink-500 mb-1">性别 / 年龄</p>
              <p className="font-medium text-ink-800">
                {patient.gender === 'male' ? '男' : '女'} / {patient.age} 岁
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-500 mb-1">病例类型</p>
              <p className="font-medium text-ink-800">
                {CASE_TYPE_LABEL[patient.caseType]}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-500 mb-1">评估医生</p>
              <p className="font-medium text-ink-800">李医生（修复科）</p>
            </div>
          </div>
        </div>

        <ConclusionCard
          conclusion={activeConclusion}
          onStatusChange={handleStatusChange}
        />

        {isReviewed && existingReview && (
          <div className="card p-5 border-l-4 border-accent-500">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-accent-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-ink-800">复核确认</h3>
                  <span className="badge bg-accent-100 text-accent-700">
                    已通过
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-ink-500">复核医生</p>
                    <p className="font-medium text-ink-800">
                      {existingReview.reviewerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-500">复核时间</p>
                    <p className="font-medium text-ink-800">
                      {existingReview.reviewedAt}
                    </p>
                  </div>
                </div>
                {existingReview.opinion && (
                  <div className="mt-2">
                    <p className="text-xs text-ink-500">复核意见</p>
                    <p className="text-sm text-ink-700 mt-0.5 leading-relaxed">
                      {existingReview.opinion}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {reviewFormOpen && (
          <div className="card p-5 border-l-4 border-primary-500">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-ink-800">
                  复核确认
                </h3>
                <p className="text-xs text-ink-500 mt-0.5">
                  请填写复核信息以确认此报告
                </p>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-xs text-ink-600 mb-1 font-medium">
                      复核医生姓名 <span className="text-danger-500">*</span>
                    </label>
                    <input
                      className="input w-full text-sm"
                      placeholder="请输入复核医生姓名"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-600 mb-1 font-medium">
                      复核意见
                    </label>
                    <textarea
                      className="textarea w-full text-sm"
                      placeholder="填写复核意见（选填）"
                      rows={3}
                      value={reviewOpinion}
                      onChange={(e) => setReviewOpinion(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      className="btn-outline btn-sm"
                      onClick={() => setReviewFormOpen(false)}
                    >
                      取消
                    </button>
                    <button className="btn-accent btn-sm" onClick={handleReview}>
                      <ShieldCheck className="w-3.5 h-3.5" /> 确认复核
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-accent-500 rounded-full" />
            分区评估摘要
          </h3>
          <SectionSummaryCard summaries={activeConclusion.sectionSummaries} />
        </div>

        <PatientExplanation
          initialText={patientText}
          onChange={(t) => {
            setPatientText(t);
            setUseSaved(false);
          }}
        />

        <div className="text-center text-xs text-ink-400 py-6 border-t border-ink-200">
          — 本报告由口腔咬合评估工作台生成，仅供临床参考
          {isReviewed && ' · 已复核确认'} —
        </div>
      </div>
    </div>
  );
};
