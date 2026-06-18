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

const MAX_COMPUTE_ROWS = 5000

interface DatasetStore {
  fileName: string | null
  fullData: Record<string, unknown>[]
  columnMetadata: ColumnMetadata[]
  activityLog: ActivityLogEntry[]
  computeData: Record<string, unknown>[]
  isSampled: boolean
  totalRows: number
  setData: (fileName: string, data: Record<string, unknown>[], metadata: ColumnMetadata[]) => void
  addActivity: (action: string, details: string) => void
  clearData: () => void
}

function createSampledData(data: Record<string, unknown>[]): { sampled: Record<string, unknown>[]; isSampled: boolean } {
  if (data.length <= MAX_COMPUTE_ROWS) return { sampled: data, isSampled: false }
  const step = Math.floor(data.length / MAX_COMPUTE_ROWS)
  const sampled: Record<string, unknown>[] = []
  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i])
    if (sampled.length >= MAX_COMPUTE_ROWS) break
  }
  return { sampled, isSampled: true }
}

export const useDatasetStore = create<DatasetStore>((set) => ({
  fileName: null,
  fullData: [],
  columnMetadata: [],
  activityLog: [],
  computeData: [],
  isSampled: false,
  totalRows: 0,
  setData: (fileName, data, metadata) => {
    const { sampled, isSampled } = createSampledData(data)
    set({
      fileName,
      fullData: data,
      computeData: sampled,
      isSampled,
      totalRows: data.length,
      columnMetadata: metadata,
      activityLog: [
        {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          action: 'File Uploaded',
          details: `Loaded "${fileName}" with ${data.length} rows and ${metadata.length} columns${isSampled ? ` (sampled to ${sampled.length} for computations)` : ''}`,
        },
        ...metadata.length > 0 ? [{
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          action: 'Columns Inferred',
          details: `Detected ${metadata.filter((m) => m.type === 'numeric').length} numeric, ${metadata.filter((m) => m.type === 'categorical').length} categorical columns`,
        }] : [],
      ],
    })
  },
  addActivity: (action, details) =>
    set((state) => ({
      activityLog: [
        { id: crypto.randomUUID(), timestamp: new Date().toISOString(), action, details },
        ...state.activityLog,
      ],
    })),
  clearData: () =>
    set({ fileName: null, fullData: [], columnMetadata: [], computeData: [], isSampled: false, totalRows: 0 }),
}))
