import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  datasetId: string | null;
  activeCategory: string | null;
  setDatasetId: (id: string | null) => void;
  setActiveCategory: (category: string | null) => void;
  clearDatasetId: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      datasetId: null,
      activeCategory: null,
      setDatasetId: (id) => set({ datasetId: id }),
      setActiveCategory: (category) => set({ activeCategory: category }),
      clearDatasetId: () => set({ datasetId: null }),
    }),
    {
      name: 'ipde-app-storage',
      version: 2,
      migrate: () => ({ datasetId: null, activeCategory: null }),
      // only persist datasetId and activeCategory
      partialize: (state) => ({ datasetId: state.datasetId, activeCategory: state.activeCategory }),
    }
  )
);
