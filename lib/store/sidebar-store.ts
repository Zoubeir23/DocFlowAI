import { create } from 'zustand';

interface SidebarState {
  isOpenMobile: boolean;
  setIsOpenMobile: (isOpen: boolean) => void;
  toggleMobile: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpenMobile: false,
  setIsOpenMobile: (isOpen) => set({ isOpenMobile: isOpen }),
  toggleMobile: () => set((state) => ({ isOpenMobile: !state.isOpenMobile })),
}));
