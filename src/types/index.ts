export type CaseType = 'implant-full' | 'removable-denture' | 'severe-wear';
export type AssessmentStatus = 'draft' | 'in-progress' | 'completed';
export type SectionKey =
  | 'centric-relation'
  | 'vertical-dimension'
  | 'overjet-overbite'
  | 'deviation';
export type AnnotationType =
  | 'early-contact'
  | 'occlusal-interference'
  | 'midline-deviation'
  | 'jaw-instability';
export type MeasurementType = 'distance' | 'reference-line';
export type MeasurementDirection = 'horizontal' | 'vertical' | 'left' | 'right' | 'none';
export type MeasurementCategory =
  | 'horizontal-overjet'
  | 'vertical-overbite'
  | 'midline-deviation'
  | 'occlusal-plane';
export type ConclusionStatus =
  | 'review-required'
  | 'ready-for-design'
  | 'adjustment-recommended';
export type RiskLevel = 'normal' | 'mild' | 'moderate' | 'severe';

export const MEASUREMENT_ENABLED_SECTIONS = ['overjet-overbite', 'deviation'] as const;

export const MEASUREMENT_CATEGORY_LABEL: Record<MeasurementCategory, string> = {
  'horizontal-overjet': '水平覆盖',
  'vertical-overbite': '垂直覆合',
  'midline-deviation': '中线偏移',
  'occlusal-plane': '咬合平面参考线',
};

export const MEASUREMENT_CATEGORY_SECTION: Record<MeasurementCategory, SectionKey[]> = {
  'horizontal-overjet': ['overjet-overbite'],
  'vertical-overbite': ['overjet-overbite'],
  'midline-deviation': ['deviation'],
  'occlusal-plane': ['overjet-overbite', 'deviation'],
};

export const CASE_TYPE_LABEL: Record<CaseType, string> = {
  'implant-full': '种植全口',
  'removable-denture': '活动义齿',
  'severe-wear': '重度磨耗',
};

export const ASSESSMENT_STATUS_LABEL: Record<AssessmentStatus, string> = {
  draft: '草稿',
  'in-progress': '评估中',
  completed: '已完成',
};

export const SECTION_LABEL: Record<SectionKey, string> = {
  'centric-relation': '正中关系',
  'vertical-dimension': '垂直距离',
  'overjet-overbite': '覆盖覆合',
  deviation: '偏斜情况',
};

export const SECTION_HINT: Record<SectionKey, string> = {
  'centric-relation': '上传口内照、咬合纸痕迹照片，标注正中颌位接触点',
  'vertical-dimension': '上传面像照、息止颌位照片，观察面下1/3高度',
  'overjet-overbite': '上传侧貌照、咬合正面照，测量水平与垂直覆盖',
  deviation: '上传正面咬合照、中线对比照，标记上下中线偏移情况',
};

export const ANNOTATION_TYPE_LABEL: Record<AnnotationType, string> = {
  'early-contact': '早接触',
  'occlusal-interference': '咬合干扰',
  'midline-deviation': '中线偏移',
  'jaw-instability': '颌位不稳定',
};

export const ANNOTATION_COLOR: Record<AnnotationType, string> = {
  'early-contact': '#E9C46A',
  'occlusal-interference': '#d63333',
  'midline-deviation': '#2A9D8F',
  'jaw-instability': '#334e68',
};

export const CONCLUSION_STATUS_LABEL: Record<ConclusionStatus, string> = {
  'review-required': '需复核',
  'ready-for-design': '可进入修复设计',
  'adjustment-recommended': '建议先行调整',
};

export const SECTION_ORDER: SectionKey[] = [
  'centric-relation',
  'vertical-dimension',
  'overjet-overbite',
  'deviation',
];

export interface SectionImage {
  id: string;
  url: string;
  name: string;
}

export interface Annotation {
  id: string;
  type: AnnotationType;
  imageId: string;
  x: number;
  y: number;
  note: string;
  orderNum: number;
}

export interface Measurement {
  id: string;
  type: MeasurementType;
  category: MeasurementCategory;
  imageId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  valueMm: number;
  direction: MeasurementDirection;
  note: string;
  orderNum: number;
}

export interface AssessmentSection {
  key: SectionKey;
  label: string;
  images: SectionImage[];
  annotations: Annotation[];
  measurements: Measurement[];
}

export interface Patient {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age: number;
  caseType: CaseType;
  status: AssessmentStatus;
  updatedAt: string;
  sections: Record<SectionKey, AssessmentSection>;
  savedConclusion: SavedConclusion | null;
  reviewStatus: 'pending' | 'reviewed';
  reviewInfo: ReviewInfo | null;
}

export interface ReviewInfo {
  reviewerName: string;
  reviewedAt: string;
  opinion: string;
}

export interface SavedConclusion {
  status: ConclusionStatus;
  summary: string[];
  sectionSummaries: Record<SectionKey, SectionSummary>;
  patientExplanation: string;
  savedAt: string;
  generatedAt: string;
  reviewInfo: ReviewInfo | null;
}

export interface SectionSummary {
  annotationCount: number;
  keyFindings: string[];
  riskLevel: RiskLevel;
  measurementCount: number;
  measurementSummary: {
    totalDistanceMm: number;
    hasHorizontalDeviation: boolean;
    hasVerticalDeviation: boolean;
    deviations: Array<{ label: string; valueMm: number; direction: string }>;
    byCategory: Partial<Record<MeasurementCategory, {
      count: number;
      distanceCount: number;
      lineCount: number;
      items: Array<{ label: string; valueMm: number; direction: string; type: string }>;
    }>>;
  };
}

export interface AssessmentConclusion {
  patientId: string;
  status: ConclusionStatus;
  summary: string[];
  sectionSummaries: Record<SectionKey, SectionSummary>;
  patientExplanation: string;
  generatedAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
}
