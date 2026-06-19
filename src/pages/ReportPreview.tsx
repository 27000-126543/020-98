import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Download,
  Edit3,
  Stethoscope,
  Loader2,
} from 'lucide-react';
import { usePatientStore } from '@/store/usePatientStore';
import { useUIStore } from '@/store/useUIStore';
import { CASE_TYPE_LABEL, SECTION_ORDER } from '@/types';
import { generateConclusion } from '@/utils/conclusion';
import { ConclusionCard } from '@/components/report/ConclusionCard';
import { SectionSummaryCard } from '@/components/report/SectionSummaryCard';
import { PatientExplanation } from '@/components/report/PatientExplanation';

export const ReportPreview = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const patient = usePatientStore((s) => s.getPatient(id));
  const pending = useUIStore((s) => s.pendingConclusion);
  const showToast = useUIStore((s) => s.showToast);

  const conclusion = useMemo(() => {
    if (!patient) return null;
    return generateConclusion(patient);
  }, [patient]);

  const [patientText, setPatientText] = useState<string>(
    conclusion?.patientExplanation || '',
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

  if (!conclusion) return null;

  const totalAnnotations = SECTION_ORDER.reduce(
    (sum, k) => sum + patient.sections[k].annotations.length,
    0,
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    showToast('info', 'PDF 导出功能演示中，可使用浏览器打印另存为 PDF');
    handlePrint();
  };

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
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-outline btn-sm"
            onClick={() => navigate(`/patients/${patient.id}/assessment`)}
          >
            <Edit3 className="w-3.5 h-3.5" /> 返回编辑
          </button>
          <button className="btn-outline btn-sm" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5" /> 打印
          </button>
          <button className="btn-accent btn-sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5" /> 导出 PDF
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
              <p>生成时间：{conclusion.generatedAt}</p>
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

        <ConclusionCard conclusion={conclusion} />

        <div>
          <h3 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-accent-500 rounded-full" />
            分区评估摘要
          </h3>
          <SectionSummaryCard summaries={conclusion.sectionSummaries} />
        </div>

        <PatientExplanation
          initialText={patientText}
          onChange={(t) => {
            setPatientText(t);
            showToast('success', '患者沟通说明已更新');
          }}
        />

        <div className="text-center text-xs text-ink-400 py-6 border-t border-ink-200">
          — 本报告由口腔咬合评估工作台生成，仅供临床参考 —
        </div>
      </div>
    </div>
  );
};
