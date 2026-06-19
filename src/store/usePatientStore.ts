import { create } from 'zustand';
import {
  Annotation,
  AnnotationType,
  AssessmentSection,
  CaseType,
  Patient,
  SectionImage,
  SectionKey,
  SECTION_LABEL,
  AssessmentStatus,
} from '@/types';
import { MOCK_PATIENTS } from '@/data/mockPatients';
import { clampPercent, formatDate, uid } from '@/utils/annotation';

const STORAGE_KEY = 'occlusal-assessment-patients';

const createEmptySection = (key: SectionKey): AssessmentSection => ({
  key,
  label: SECTION_LABEL[key],
  images: [],
  annotations: [],
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
    };
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

  touchPatient: (id) =>
    set((state) => {
      const patients = state.patients.map((p) =>
        p.id === id ? { ...p, updatedAt: formatDate() } : p,
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      return { patients };
    }),
}));
