import { create } from 'zustand';
import {
  Annotation,
  AnnotationType,
  AssessmentSection,
  CaseType,
  Patient,
  ReviewInfo,
  SectionImage,
  SectionKey,
  SECTION_LABEL,
  AssessmentStatus,
  Measurement,
  MeasurementCategory,
  MeasurementDirection,
  MeasurementType,
  SavedConclusion,
} from '@/types';
import { MOCK_PATIENTS } from '@/data/mockPatients';
import { clampPercent, formatDate, uid } from '@/utils/annotation';

const STORAGE_KEY = 'occlusal-assessment-patients';

const createEmptySection = (key: SectionKey): AssessmentSection => ({
  key,
  label: SECTION_LABEL[key],
  images: [],
  annotations: [],
  measurements: [],
});

const loadFromStorage = (): Patient[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return MOCK_PATIENTS;
};

interface PatientState {
  patients: Patient[];
  getPatient: (id: string) => Patient | undefined;
  addPatient: (data: {
    name: string;
    gender: 'male' | 'female';
    age: number;
    caseType: CaseType;
  }) => Patient;
  importPatientWithImages: (data: {
    name: string;
    gender: 'male' | 'female';
    age: number;
    caseType: CaseType;
    sectionImages: Partial<Record<SectionKey, Array<{ url: string; name: string }>>>;
  }) => Patient;
  removePatient: (id: string) => void;
  updatePatientStatus: (id: string, status: AssessmentStatus) => void;
  addSectionImage: (
    patientId: string,
    sectionKey: SectionKey,
    image: { url: string; name: string },
  ) => void;
  removeSectionImage: (
    patientId: string,
    sectionKey: SectionKey,
    imageId: string,
  ) => void;
  addAnnotation: (
    patientId: string,
    sectionKey: SectionKey,
    data: {
      imageId: string;
      type: AnnotationType;
      x: number;
      y: number;
      note?: string;
    },
  ) => Annotation;
  updateAnnotation: (
    patientId: string,
    sectionKey: SectionKey,
    annotationId: string,
    patch: Partial<Pick<Annotation, 'note' | 'x' | 'y'>>,
  ) => void;
  removeAnnotation: (
    patientId: string,
    sectionKey: SectionKey,
    annotationId: string,
  ) => void;
  clearSectionAnnotations: (
    patientId: string,
    sectionKey: SectionKey,
  ) => void;
  addMeasurement: (
    patientId: string,
    sectionKey: SectionKey,
    data: {
      imageId: string;
      type: MeasurementType;
      category: MeasurementCategory;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      label: string;
      valueMm: number;
      direction: MeasurementDirection;
      note?: string;
    },
  ) => Measurement;
  updateMeasurement: (
    patientId: string,
    sectionKey: SectionKey,
    measurementId: string,
    patch: Partial<
      Pick<Measurement, 'label' | 'valueMm' | 'direction' | 'note' | 'x1' | 'y1' | 'x2' | 'y2'>
    >,
  ) => void;
  removeMeasurement: (
    patientId: string,
    sectionKey: SectionKey,
    measurementId: string,
  ) => void;
  clearSectionMeasurements: (
    patientId: string,
    sectionKey: SectionKey,
  ) => void;
  saveConclusion: (patientId: string, conclusion: SavedConclusion) => void;
  clearSavedConclusion: (patientId: string) => void;
  reviewPatient: (patientId: string, reviewInfo: ReviewInfo) => void;
  touchPatient: (id: string) => void;
}

export const usePatientStore = create<PatientState>((set, get) => ({
  patients: loadFromStorage(),

  getPatient: (id) => get().patients.find((p) => p.id === id),

  addPatient: (data) => {
    const newPatient: Patient = {
      id: uid('p'),
      name: data.name,
      gender: data.gender,
      age: data.age,
      caseType: data.caseType,
      status: 'draft',
      updatedAt: formatDate(),
      sections: {
        'centric-relation': createEmptySection('centric-relation'),
        'vertical-dimension': createEmptySection('vertical-dimension'),
        'overjet-overbite': createEmptySection('overjet-overbite'),
        deviation: createEmptySection('deviation'),
      },
      savedConclusion: null,
      reviewStatus: 'pending',
      reviewInfo: null,
    };
    set((state) => {
      const patients = [newPatient, ...state.patients];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      return { patients };
    });
    return newPatient;
  },

  importPatientWithImages: (data) => {
    const newPatient: Patient = {
      id: uid('p'),
      name: data.name,
      gender: data.gender,
      age: data.age,
      caseType: data.caseType,
      status: 'draft',
      updatedAt: formatDate(),
      sections: {
        'centric-relation': createEmptySection('centric-relation'),
        'vertical-dimension': createEmptySection('vertical-dimension'),
        'overjet-overbite': createEmptySection('overjet-overbite'),
        deviation: createEmptySection('deviation'),
      },
      savedConclusion: null,
      reviewStatus: 'pending',
      reviewInfo: null,
    };

    (Object.keys(data.sectionImages) as SectionKey[]).forEach((sectionKey) => {
      const imgs = data.sectionImages[sectionKey];
      if (imgs && imgs.length > 0) {
        newPatient.sections[sectionKey].images = imgs.map((img) => ({
          id: uid('img'),
          url: img.url,
          name: img.name,
        }));
        newPatient.status = 'in-progress';
      }
    });

    set((state) => {
      const patients = [newPatient, ...state.patients];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      return { patients };
    });
    return newPatient;
  },

  removePatient: (id) =>
    set((state) => {
      const patients = state.patients.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      return { patients };
    }),

  updatePatientStatus: (id, status) =>
    set((state) => {
      const patients = state.patients.map((p) =>
        p.id === id ? { ...p, status, updatedAt: formatDate() } : p,
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      return { patients };
    }),

  addSectionImage: (patientId, sectionKey, image) =>
    set((state) => {
      const patients = state.patients.map((p) => {
        if (p.id !== patientId) return p;
        const section = p.sections[sectionKey];
        const newImage: SectionImage = {
          id: uid('img'),
          url: image.url,
          name: image.name,
        };
        return {
          ...p,
          status: p.status === 'draft' ? 'in-progress' : p.status,
          updatedAt: formatDate(),
          sections: {
            ...p.sections,
            [sectionKey]: {
              ...section,
              images: [...section.images, newImage],
            },
          },
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      return { patients };
    }),

  removeSectionImage: (patientId, sectionKey, imageId) =>
    set((state) => {
      const patients = state.patients.map((p) => {
        if (p.id !== patientId) return p;
        const section = p.sections[sectionKey];
        return {
          ...p,
          updatedAt: formatDate(),
          sections: {
            ...p.sections,
            [sectionKey]: {
              ...section,
              images: section.images.filter((i) => i.id !== imageId),
              annotations: section.annotations.filter(
                (a) => a.imageId !== imageId,
              ),
              measurements: section.measurements.filter(
                (m) => m.imageId !== imageId,
              ),
            },
          },
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      return { patients };
    }),

  addAnnotation: (patientId, sectionKey, data) => {
    let created: Annotation | null = null;
    set((state) => {
      const patients = state.patients.map((p) => {
        if (p.id !== patientId) return p;
        const section = p.sections[sectionKey];
        const maxOrder = section.annotations.reduce(
          (m, a) => Math.max(m, a.orderNum),
          0,
        );
        created = {
          id: uid('a'),
          type: data.type,
          imageId: data.imageId,
          x: clampPercent(data.x),
          y: clampPercent(data.y),
          note: data.note || '',
          orderNum: maxOrder + 1,
        };
        return {
          ...p,
          status: p.status === 'draft' ? 'in-progress' : p.status,
          updatedAt: formatDate(),
          sections: {
            ...p.sections,
            [sectionKey]: {
              ...section,
              annotations: [...section.annotations, created],
            },
          },
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      return { patients };
    });
    return created!;
  },

  updateAnnotation: (patientId, sectionKey, annotationId, patch) =>
    set((state) => {
      const patients = state.patients.map((p) => {
        if (p.id !== patientId) return p;
        const section = p.sections[sectionKey];
        return {
          ...p,
          updatedAt: formatDate(),
          sections: {
            ...p.sections,
            [sectionKey]: {
              ...section,
              annotations: section.annotations.map((a) =>
                a.id === annotationId
                  ? {
                      ...a,
                      ...patch,
                      x: patch.x !== undefined ? clampPercent(patch.x) : a.x,
                      y: patch.y !== undefined ? clampPercent(patch.y) : a.y,
                    }
                  : a,
              ),
            },
          },
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      return { patients };
    }),

  removeAnnotation: (patientId, sectionKey, annotationId) =>
    set((state) => {
      const patients = state.patients.map((p) => {
        if (p.id !== patientId) return p;
        const section = p.sections[sectionKey];
        const remaining = section.annotations
          .filter((a) => a.id !== annotationId)
          .sort((a, b) => a.orderNum - b.orderNum)
          .map((a, i) => ({ ...a, orderNum: i + 1 }));
        return {
          ...p,
          updatedAt: formatDate(),
          sections: {
            ...p.sections,
            [sectionKey]: {
              ...section,
              annotations: remaining,
            },
          },
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      return { patients };
    }),

  clearSectionAnnotations: (patientId, sectionKey) =>
    set((state) => {
      const patients = state.patients.map((p) => {
        if (p.id !== patientId) return p;
        const section = p.sections[sectionKey];
        return {
          ...p,
          updatedAt: formatDate(),
          sections: {
            ...p.sections,
            [sectionKey]: {
              ...section,
              annotations: [],
            },
          },
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      return { patients };
    }),

  addMeasurement: (patientId, sectionKey, data) => {
    let created: Measurement | null = null;
    set((state) => {
      const patients = state.patients.map((p) => {
        if (p.id !== patientId) return p;
        const section = p.sections[sectionKey];
        const maxOrder = section.measurements.reduce(
          (m, a) => Math.max(m, a.orderNum),
          0,
        );
        created = {
          id: uid('m'),
          type: data.type,
          category: data.category,
          imageId: data.imageId,
          x1: clampPercent(data.x1),
          y1: clampPercent(data.y1),
          x2: clampPercent(data.x2),
          y2: clampPercent(data.y2),
          label: data.label,
          valueMm: data.valueMm,
          direction: data.direction,
          note: data.note || '',
          orderNum: maxOrder + 1,
        };
        return {
          ...p,
          status: p.status === 'draft' ? 'in-progress' : p.status,
          updatedAt: formatDate(),
          sections: {
            ...p.sections,
            [sectionKey]: {
              ...section,
              measurements: [...section.measurements, created],
            },
          },
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      return { patients };
    });
    return created!;
  },

  updateMeasurement: (patientId, sectionKey, measurementId, patch) =>
    set((state) => {
      const patients = state.patients.map((p) => {
        if (p.id !== patientId) return p;
        const section = p.sections[sectionKey];
        return {
          ...p,
          updatedAt: formatDate(),
          sections: {
            ...p.sections,
            [sectionKey]: {
              ...section,
              measurements: section.measurements.map((m) =>
                m.id === measurementId
                  ? {
                      ...m,
                      ...patch,
                      x1: patch.x1 !== undefined ? clampPercent(patch.x1) : m.x1,
                      y1: patch.y1 !== undefined ? clampPercent(patch.y1) : m.y1,
                      x2: patch.x2 !== undefined ? clampPercent(patch.x2) : m.x2,
                      y2: patch.y2 !== undefined ? clampPercent(patch.y2) : m.y2,
                    }
                  : m,
              ),
            },
          },
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      return { patients };
    }),

  removeMeasurement: (patientId, sectionKey, measurementId) =>
    set((state) => {
      const patients = state.patients.map((p) => {
        if (p.id !== patientId) return p;
        const section = p.sections[sectionKey];
        const remaining = section.measurements
          .filter((m) => m.id !== measurementId)
          .sort((a, b) => a.orderNum - b.orderNum)
          .map((m, i) => ({ ...m, orderNum: i + 1 }));
        return {
          ...p,
          updatedAt: formatDate(),
          sections: {
            ...p.sections,
            [sectionKey]: {
              ...section,
              measurements: remaining,
            },
          },
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      return { patients };
    }),

  clearSectionMeasurements: (patientId, sectionKey) =>
    set((state) => {
      const patients = state.patients.map((p) => {
        if (p.id !== patientId) return p;
        const section = p.sections[sectionKey];
        return {
          ...p,
          updatedAt: formatDate(),
          sections: {
            ...p.sections,
            [sectionKey]: {
              ...section,
              measurements: [],
            },
          },
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      return { patients };
    }),

  saveConclusion: (patientId, conclusion) =>
    set((state) => {
      const patients = state.patients.map((p) =>
        p.id === patientId
          ? { ...p, savedConclusion: conclusion, updatedAt: formatDate() }
          : p,
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      return { patients };
    }),

  clearSavedConclusion: (patientId) =>
    set((state) => {
      const patients = state.patients.map((p) =>
        p.id === patientId
          ? { ...p, savedConclusion: null, updatedAt: formatDate() }
          : p,
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      return { patients };
    }),

  reviewPatient: (patientId, reviewInfo) =>
    set((state) => {
      const patients = state.patients.map((p) =>
        p.id === patientId
          ? {
              ...p,
              reviewStatus: 'reviewed' as const,
              reviewInfo,
              updatedAt: formatDate(),
            }
          : p,
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      return { patients };
    }),

  touchPatient: (id) =>
    set((state) => {
      const patients = state.patients.map((p) =>
        p.id === id ? { ...p, updatedAt: formatDate() } : p,
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      return { patients };
    }),
}));
