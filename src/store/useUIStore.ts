import { create } from 'zustand';
import { ToastMessage } from '@/types';
import { uid } from '@/utils/annotation';

interface UIState {
  toasts: ToastMessage[];
  showToast: (type: ToastMessage['type'], message: string, duration?: number) => void;
  dismissToast: (id: string) => void;
  loading: Record<string, boolean>;
  setLoading: (key: string, value: boolean) => void;
  pendingConclusion: { patientId: string } | null;
  setPendingConclusion: (v: { patientId: string } | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  loading: {},
  pendingConclusion: null,

  showToast: (type, message, duration = 2600) => {
    const id = uid('t');
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  setLoading: (key, value) =>
    set((state) => ({ loading: { ...state.loading, [key]: value } })),

  setPendingConclusion: (v) => set({ pendingConclusion: v }),
}));
