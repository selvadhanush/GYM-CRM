import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastState {
  message: string | null;
  type: ToastType;
  visible: boolean;
  show: (message: string, type?: ToastType, duration?: number) => void;
  hide: () => void;
}

let timeoutId: any = null;

export const useToast = create<ToastState>((set) => ({
  message: null,
  type: 'info',
  visible: false,
  show: (message, type = 'info', duration = 3500) => {
    if (timeoutId) clearTimeout(timeoutId);
    
    set({ message, type, visible: true });

    timeoutId = setTimeout(() => {
      set({ visible: false });
    }, duration);
  },
  hide: () => {
    if (timeoutId) clearTimeout(timeoutId);
    set({ visible: false });
  },
}));
