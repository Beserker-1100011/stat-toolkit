import { create } from 'zustand'

export interface ColumnMetadata {
  name: string
  type: 'numeric' | 'categorical' | 'unknown'
  missingCount: number
}

export interface ActivityLogEntry {
  id: string
  timestamp: string
  action: string
  details: string
}

interface DatasetStore {
  fileName: string | null
  fullData: Record<string, unknown>[]
  columnMetadata: ColumnMetadata[]
  activityLog: ActivityLogEntry[]
  setData: (fileName: string, data: Record<string, unknown>[], metadata: ColumnMetadata[]) => void
  addActivity: (action: string, details: string) => void
  clearData: () => void
}

export const useDatasetStore = create<DatasetStore>((set) => ({
  fileName: null,
  fullData: [],
  columnMetadata: [],
  activityLog: [],
  setData: (fileName, data, metadata) =>
    set({
      fileName,
      fullData: data,
      columnMetadata: metadata,
      activityLog: [
        {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          action: 'File Uploaded',
          details: `Loaded "${fileName}" with ${data.length} rows and ${metadata.length} columns`,
        },
        ...metadata.length > 0 ? [{
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          action: 'Columns Inferred',
          details: `Detected ${metadata.filter((m) => m.type === 'numeric').length} numeric, ${metadata.filter((m) => m.type === 'categorical').length} categorical columns`,
        }] : [],
      ],
    }),
  addActivity: (action, details) =>
    set((state) => ({
      activityLog: [
        {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          action,
          details,
        },
        ...state.activityLog,
      ],
    })),
  clearData: () =>
    set({ fileName: null, fullData: [], columnMetadata: [] }),
}))
