import {
  Annotation,
  AnnotationType,
  ANNOTATION_TYPE_LABEL,
  AssessmentConclusion,
  AssessmentSection,
  ConclusionStatus,
  CONCLUSION_STATUS_LABEL,
  MeasurementCategory,
  MEASUREMENT_CATEGORY_LABEL,
  Patient,
  RiskLevel,
  SectionKey,
  SectionSummary,
  SECTION_LABEL,
  SECTION_ORDER,
} from '@/types';

const getAnnotationRisk = (type: AnnotationType): number => {
  switch (type) {
    case 'early-contact':
      return 1;
    case 'occlusal-interference':
      return 2;
    case 'midline-deviation':
      return 2;
    case 'jaw-instability':
      return 3;
    default:
      return 0;
  }
};

const calcRiskLevel = (section: AssessmentSection): RiskLevel => {
  if (section.annotations.length === 0 && section.measurements.length === 0) return 'normal';
  const totalRisk = section.annotations.reduce(
    (sum, a) => sum + getAnnotationRisk(a.type),
    0,
  );
  const hasSignificantMeasurement = section.measurements.some(
    (m) => m.type === 'distance' && m.valueMm >= 2,
  );
  const hasDeviation = section.measurements.some(
    (m) => m.direction === 'left' || m.direction === 'right',
  );
  if (
    totalRisk >= 5 ||
    section.annotations.length >= 4 ||
    (hasSignificantMeasurement && hasDeviation)
  )
    return 'severe';
  if (totalRisk >= 3 || section.annotations.length >= 2 || hasSignificantMeasurement)
    return 'moderate';
  if (section.measurements.length > 0) return 'mild';
  return 'mild';
};

const buildKeyFindings = (section: AssessmentSection): string[] => {
  const findings: string[] = [];
  const categoryMap: Partial<Record<MeasurementCategory, {
    distanceCount: number;
    lineCount: number;
    maxMm: number;
  }>> = {};
  if (section.annotations.length === 0 && section.measurements.length === 0) {
    return ['未见明显异常'];
  }
  if (section.annotations.length > 0) {
    const countByType: Record<string, number> = {};
    section.annotations.forEach((a) => {
      countByType[a.type] = (countByType[a.type] || 0) + 1;
    });
    Object.entries(countByType).forEach(([type, count]) => {
      findings.push(`${ANNOTATION_TYPE_LABEL[type as AnnotationType]} × ${count}处`);
    });
  }
  section.measurements.forEach((m) => {
    const cat = m.category;
    if (!categoryMap[cat]) {
      categoryMap[cat] = { distanceCount: 0, lineCount: 0, maxMm: 0 };
    }
    if (m.type === 'distance') {
      categoryMap[cat].distanceCount += 1;
      if (m.valueMm > categoryMap[cat].maxMm) {
        categoryMap[cat].maxMm = m.valueMm;
      }
    } else if (m.type === 'reference-line') {
      categoryMap[cat].lineCount += 1;
    }
  });
  Object.entries(categoryMap).forEach(([cat, { distanceCount, lineCount, maxMm }]) => {
    const catLabel = MEASUREMENT_CATEGORY_LABEL[cat as MeasurementCategory];
    const parts: string[] = [];
    if (distanceCount > 0) {
      parts.push(`${distanceCount}项距离`);
    }
    if (lineCount > 0) {
      parts.push(`${lineCount}条参考线`);
    }
    const mmText = maxMm > 0 ? `（最大 ${maxMm.toFixed(1)}mm）` : '';
    findings.push(`${catLabel}：${parts.join(' + ')}${mmText}`);
  });
  return findings;
};

const buildMeasurementSummary = (section: AssessmentSection) => {
  const distanceMeasurements = section.measurements.filter(
    (m) => m.type === 'distance',
  );
  const totalDistanceMm = distanceMeasurements.reduce(
    (sum, m) => sum + m.valueMm,
    0,
  );
  const deviations = distanceMeasurements
    .filter((m) => m.direction === 'left' || m.direction === 'right')
    .map((m) => ({
      label: m.label,
      valueMm: m.valueMm,
      direction: m.direction,
    }));
  const byCategory: Partial<Record<MeasurementCategory, {
    count: number;
    distanceCount: number;
    lineCount: number;
    items: Array<{ label: string; valueMm: number; direction: string; type: string }>;
  }>> = {};
  section.measurements.forEach((m) => {
    const cat = m.category;
    if (!byCategory[cat]) {
      byCategory[cat] = { count: 0, distanceCount: 0, lineCount: 0, items: [] };
    }
    byCategory[cat]!.count += 1;
    if (m.type === 'distance') {
      byCategory[cat]!.distanceCount += 1;
    } else {
      byCategory[cat]!.lineCount += 1;
    }
    byCategory[cat]!.items.push({
      label: m.label,
      valueMm: m.valueMm,
      direction: m.direction,
      type: m.type,
    });
  });
  return {
    totalDistanceMm,
    hasHorizontalDeviation: section.measurements.some(
      (m) => m.direction === 'horizontal',
    ),
    hasVerticalDeviation: section.measurements.some(
      (m) => m.direction === 'vertical',
    ),
    deviations,
    byCategory,
  };
};

const buildSectionSummaries = (
  patient: Patient,
): Record<SectionKey, SectionSummary> => {
  const result = {} as Record<SectionKey, SectionSummary>;
  SECTION_ORDER.forEach((key) => {
    const section = patient.sections[key];
    result[key] = {
      annotationCount: section.annotations.length,
      keyFindings: buildKeyFindings(section),
      riskLevel: calcRiskLevel(section),
      measurementCount: section.measurements.length,
      measurementSummary: buildMeasurementSummary(section),
    };
  });
  return result;
};

const collectAllAnnotations = (patient: Patient): Annotation[] => {
  return SECTION_ORDER.flatMap((k) => patient.sections[k].annotations).sort(
    (a, b) => a.orderNum - b.orderNum,
  );
};

const decideConclusionStatus = (
  summaries: Record<SectionKey, SectionSummary>,
  allAnnotations: Annotation[],
): ConclusionStatus => {
  const hasSevere = SECTION_ORDER.some(
    (k) => summaries[k].riskLevel === 'severe',
  );
  const hasInstability = allAnnotations.some(
    (a) => a.type === 'jaw-instability',
  );
  const earlyContactCount = allAnnotations.filter(
    (a) => a.type === 'early-contact',
  ).length;
  const interferenceCount = allAnnotations.filter(
    (a) => a.type === 'occlusal-interference',
  ).length;
  const deviationCount = allAnnotations.filter(
    (a) => a.type === 'midline-deviation',
  ).length;

  if (hasSevere || hasInstability || earlyContactCount >= 3) {
    return 'adjustment-recommended';
  }
  if (
    interferenceCount >= 2 ||
    deviationCount >= 1 ||
    earlyContactCount >= 2
  ) {
    return 'review-required';
  }
  return 'ready-for-design';
};

const buildSummary = (
  status: ConclusionStatus,
  summaries: Record<SectionKey, SectionSummary>,
): string[] => {
  const items: string[] = [];
  SECTION_ORDER.forEach((key) => {
    const s = summaries[key];
    if (s.annotationCount > 0 || s.measurementCount > 0) {
      const measurementText =
        s.measurementCount > 0 ? `（含${s.measurementCount}项测量）` : '';
      items.push(
        `【${SECTION_LABEL[key]}${measurementText}】${s.keyFindings.join('，')}`,
      );
    }
  });
  if (items.length === 0) {
    items.push('四个分区均未标注异常点，咬合关系基本稳定');
  }
  items.unshift(`评估结论：${CONCLUSION_STATUS_LABEL[status]}`);
  return items;
};

const buildPatientExplanation = (
  patient: Patient,
  status: ConclusionStatus,
  summaries: Record<SectionKey, SectionSummary>,
): string => {
  const greeting =
    patient.gender === 'male'
      ? `${patient.name} 先生您好`
      : `${patient.name} 女士您好`;

  let suggestion = '';
  switch (status) {
    case 'ready-for-design':
      suggestion =
        '您目前的咬合关系经过评估整体稳定，可以按计划进入下一步修复设计阶段。我们会根据您的口内情况制定具体的修复方案。';
      break;
    case 'review-required':
      suggestion =
        '您的咬合情况存在一些需要进一步确认的细节，建议您在下次复诊时带齐以往的病历资料，由主治医师结合口内实际检查进行复核确认后，再推进修复方案。';
      break;
    case 'adjustment-recommended':
      suggestion =
        '评估发现您的咬合存在较明显的干扰或不稳定表现，建议在正式修复前先进行咬合调整或颌位记录校正，以确保最终修复体的舒适度和长期稳定性。';
      break;
  }

  const abnormalSections = SECTION_ORDER.filter(
    (k) => summaries[k].annotationCount > 0 || summaries[k].measurementCount > 0,
  )
    .map((k) => SECTION_LABEL[k])
    .join('、');

  const totalMeasurements = SECTION_ORDER.reduce(
    (sum, k) => sum + summaries[k].measurementCount,
    0,
  );

  const measurementText =
    totalMeasurements > 0
      ? `，其中包含 ${totalMeasurements} 项量化测量数据`
      : '';

  const detail = abnormalSections
    ? `本次重点关注的评估区域包括：${abnormalSections}${measurementText}。`
    : '各项分区评估均未发现明显异常。';

  return `${greeting}：\n\n感谢您选择本诊所进行修复治疗。根据本次初诊的咬合评估结果，${detail}\n\n${suggestion}\n\n如有疑问，请随时与您的主治医师沟通。\n\n——口腔修复科`;
};

export const generateConclusion = (
  patient: Patient,
): AssessmentConclusion => {
  const sectionSummaries = buildSectionSummaries(patient);
  const allAnnotations = collectAllAnnotations(patient);
  const status = decideConclusionStatus(sectionSummaries, allAnnotations);
  const summary = buildSummary(status, sectionSummaries);
  const patientExplanation = buildPatientExplanation(
    patient,
    status,
    sectionSummaries,
  );

  return {
    patientId: patient.id,
    status,
    summary,
    sectionSummaries,
    patientExplanation,
    generatedAt: new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
};
