import { type StateCreator } from 'zustand';

export interface StationSlice {
  stations: Array<{ id: string; name: string; color: string | null; displayOrder: number; isActive: boolean }>;
  categoryToStationMap: Map<string, string>;
  setStations: (stations: StationSlice['stations']) => void;
  setCategoryStationMappings: (mappings: Array<{ categoryId: string; stationId: string }>) => void;
}

export const createStationSlice: StateCreator<StationSlice> = (set) => ({
  stations: [],
  categoryToStationMap: new Map(),
  setStations: (stations) => set({ stations }),
  setCategoryStationMappings: (mappings) => {
    const map = new Map<string, string>();
    for (const m of mappings) {
      map.set(m.categoryId, m.stationId);
    }
    set({ categoryToStationMap: map });
  },
});
