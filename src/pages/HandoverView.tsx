import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  UserRound,
  Stethoscope,
  Image,
  MapPin,
  Ruler,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';
import { usePatientStore } from '@/store/usePatientStore';
import {
  CASE_TYPE_LABEL,
  SECTION_ORDER,
  SECTION_LABEL,
  MEASUREMENT_CATEGORY_LABEL,
  MeasurementCategory,
} from '@/types';
import { generateConclusion } from '@/utils/conclusion';
import { cn } from '@/lib/utils';

export const HandoverView = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const patient = usePatientStore((s) => s.getPatient(id));

  const conclusion = useMemo(() => {
    if (!patient) return null;
    return generateConclusion(patient);
  }, [patient]);

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

  const isReviewed = patient.reviewStatus === 'reviewed';
  const reviewInfo = patient.reviewInfo;

  const totalImages = SECTION_ORDER.reduce(
    (sum, k) => sum + patient.sections[k].images.length,
    0,
  );
  const totalAnnotations = SECTION_ORDER.reduce(
    (sum, k) => sum + patient.sections[k].annotations.length,
    0,
  );
  const totalMeasurements = SECTION_ORDER.reduce(
    (sum, k) => sum + patient.sections[k].measurements.length,
    0,
  );

  const completedSections = SECTION_ORDER.filter((k) => {
    const s = patient.sections[k];
    const needsMeasurement =
      k === 'overjet-overbite' || k === 'deviation';
    return needsMeasurement
      ? s.images.length > 0 && s.annotations.length > 0 && s.measurements.length > 0
      : s.images.length > 0 && s.annotations.length > 0;
  }).length;
  const overallProgress = Math.round((completedSections / 4) * 100);

  const allMeasurementCategories: Array<{
    category: MeasurementCategory;
    count: number;
    maxMm: number;
    sections: string[];
  }> = [];

  const catMap = new Map<
    MeasurementCategory,
    { count: number; maxMm: number; sections: Set<string> }
  >();
  SECTION_ORDER.forEach((key) => {
    patient.sections[key].measurements.forEach((m) => {
      const cat = m.category;
      if (!catMap.has(cat)) {
        catMap.set(cat, { count: 0, maxMm: 0, sections: new Set() });
      }
      const entry = catMap.get(cat)!;
      entry.count += 1;
      entry.sections.add(SECTION_LABEL[key]);
      if (m.type === 'distance' && m.valueMm > entry.maxMm) {
        entry.maxMm = m.valueMm;
      }
    });
  });
  catMap.forEach((v, k) => {
    allMeasurementCategories.push({
      category: k,
      count: v.count,
      maxMm: v.maxMm,
      sections: Array.from(v.sections),
    });
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-ink-50">
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
              病例交接视图
            </h1>
            <p className="text-xs text-ink-500">
              {patient.name} · 用于科室协作与复诊核对
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-outline btn-sm"
            onClick={() => navigate(`/patients/${patient.id}/report`)}
          >
            <FileText className="w-3.5 h-3.5" /> 查看报告
          </button>
          <button className="btn-outline btn-sm" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5" /> 打印
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">
        {/* 患者基本信息 */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary-800 flex items-center justify-center">
              <UserRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-800">{patient.name}</h2>
              <p className="text-xs text-ink-500">患者基本信息</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-ink-500 mb-1">性别 / 年龄</p>
              <p className="font-medium text-ink-800">
                {patient.gender === 'male' ? '男' : '女'} · {patient.age} 岁
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-500 mb-1">病例类型</p>
              <p className="font-medium text-ink-800">
                {CASE_TYPE_LABEL[patient.caseType]}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-500 mb-1">病例编号</p>
              <p className="font-mono font-medium text-ink-800">
                {patient.id.toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-500 mb-1">最后更新</p>
              <p className="font-medium text-ink-800">{patient.updatedAt}</p>
            </div>
          </div>
        </div>

        {/* 整体进度 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary-600" />
              <h3 className="text-sm font-semibold text-ink-800">资料完整度</h3>
            </div>
            <span className="text-2xl font-bold font-mono text-ink-800">
              {overallProgress}%
            </span>
          </div>
          <div className="h-2.5 bg-ink-100 rounded-full overflow-hidden mb-4">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                overallProgress === 100
                  ? 'bg-accent-500'
                  : overallProgress >= 50
                    ? 'bg-primary-500'
                    : 'bg-warning-500',
              )}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {SECTION_ORDER.map((key) => {
              const s = patient.sections[key];
              const needsMeasurement =
                key === 'overjet-overbite' || key === 'deviation';
              const complete = needsMeasurement
                ? s.images.length > 0 &&
                  s.annotations.length > 0 &&
                  s.measurements.length > 0
                : s.images.length > 0 && s.annotations.length > 0;
              const missing: string[] = [];
              if (s.images.length === 0) missing.push('照片');
              if (s.annotations.length === 0) missing.push('标注');
              if (needsMeasurement && s.measurements.length === 0)
                missing.push('测量');
              return (
                <div
                  key={key}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all',
                    complete
                      ? 'border-accent-200 bg-accent-50'
                      : 'border-ink-100 bg-white',
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    {complete ? (
                      <CheckCircle2 className="w-4 h-4 text-accent-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-warning-500 shrink-0" />
                    )}
                    <span className="text-sm font-medium text-ink-800">
                      {SECTION_LABEL[key]}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-500 flex items-center gap-1">
                        <Image className="w-3 h-3" /> 照片
                      </span>
                      <span
                        className={cn(
                          'font-medium',
                          s.images.length > 0
                            ? 'text-accent-700'
                            : 'text-ink-400',
                        )}
                      >
                        {s.images.length} 张
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> 标注
                      </span>
                      <span
                        className={cn(
                          'font-medium',
                          s.annotations.length > 0
                            ? 'text-accent-700'
                            : 'text-ink-400',
                        )}
                      >
                        {s.annotations.length} 处
                      </span>
                    </div>
                    {needsMeasurement && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-500 flex items-center gap-1">
                          <Ruler className="w-3 h-3" /> 测量
                        </span>
                        <span
                          className={cn(
                            'font-medium',
                            s.measurements.length > 0
                              ? 'text-accent-700'
                              : 'text-ink-400',
                          )}
                        >
                          {s.measurements.length} 项
                        </span>
                      </div>
                    )}
                  </div>
                  {!complete && (
                    <div className="mt-2 pt-2 border-t border-ink-100">
                      <p className="text-[10px] text-warning-600">
                        缺：{missing.join('、')}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 评估摘要 */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-accent-600" />
            <h3 className="text-sm font-semibold text-ink-800">评估摘要</h3>
          </div>
          {conclusion ? (
            <>
              <div className="mb-3 p-3 bg-accent-50 border border-accent-200 rounded-lg">
                <p className="text-sm font-semibold text-accent-800">
                  结论：{conclusion.summary[0]}
                </p>
              </div>
              <ul className="space-y-1">
                {conclusion.summary.slice(1).map((s, i) => (
                  <li
                    key={i}
                    className="text-sm text-ink-700 leading-relaxed flex gap-2"
                  >
                    <span className="shrink-0 text-ink-400">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-ink-500">暂无评估结论</p>
          )}
        </div>

        {/* 测量分类汇总 */}
        {allMeasurementCategories.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Ruler className="w-4 h-4 text-primary-600" />
              <h3 className="text-sm font-semibold text-ink-800">测量分类汇总</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {allMeasurementCategories.map((item) => (
                <div
                  key={item.category}
                  className="p-3 rounded-lg bg-primary-50 border border-primary-100"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-primary-800">
                      {MEASUREMENT_CATEGORY_LABEL[item.category]}
                    </span>
                    <span className="text-xs font-mono font-medium text-primary-700">
                      {item.count} 项
                    </span>
                  </div>
                  {item.maxMm > 0 && (
                    <p className="text-xs text-primary-700 font-mono">
                      最大距离：{item.maxMm.toFixed(1)} mm
                    </p>
                  )}
                  <p className="text-[11px] text-primary-600/70 mt-1">
                    涉及分区：{item.sections.join('、')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 复核状态 */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            {isReviewed ? (
              <ShieldCheck className="w-4 h-4 text-accent-600" />
            ) : (
              <Clock className="w-4 h-4 text-warning-500" />
            )}
            <h3 className="text-sm font-semibold text-ink-800">复核状态</h3>
            <span
              className={cn(
                'badge ml-auto',
                isReviewed
                  ? 'bg-accent-100 text-accent-700'
                  : 'bg-warning-100 text-warning-700',
              )}
            >
              {isReviewed ? '已复核' : '待复核'}
            </span>
          </div>
          {isReviewed && reviewInfo ? (
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-ink-500 mb-1">复核医生</p>
                <p className="font-medium text-ink-800">
                  {reviewInfo.reviewerName}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-500 mb-1">复核时间</p>
                <p className="font-medium text-ink-800">
                  {reviewInfo.reviewedAt}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-500 mb-1">复核意见</p>
                <p className="font-medium text-ink-700">
                  {reviewInfo.opinion || '无'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-ink-500">
              <XCircle className="w-4 h-4" />
              <span>本病例尚未经过医生复核</span>
            </div>
          )}
        </div>

        <div className="text-center text-xs text-ink-400 py-4">
          — 口腔咬合评估工作台 · 交接视图 —
        </div>
      </div>
    </div>
  );
};
