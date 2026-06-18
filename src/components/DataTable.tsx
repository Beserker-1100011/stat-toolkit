import { useState, useMemo, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useDatasetStore } from '@/store/datasetStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 25

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export function DataTable() {
  const { fullData, columnMetadata, isSampled, totalRows } = useDatasetStore()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 200)

  const columns = useMemo(
    () => (fullData.length > 0 ? Object.keys(fullData[0]) : []),
    [fullData]
  )

  const filtered = useMemo(() => {
    if (!debouncedSearch) return fullData
    const q = debouncedSearch.toLowerCase()
    return fullData.filter((row) =>
      Object.values(row).some((v) =>
        String(v).toLowerCase().includes(q)
      )
    )
  }, [fullData, debouncedSearch])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const getType = (col: string) =>
    columnMetadata.find((m) => m.name === col)?.type ?? 'unknown'

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search rows..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          className="h-10 w-full rounded-xl border border-glass-border bg-glass pl-10 pr-4 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-glass-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-glass-border bg-white/[0.02]">
              <th className="px-4 py-3 text-left font-medium text-muted">#</th>
              {columns.map((col) => (
                <th key={col} className="px-4 py-3 text-left font-medium text-muted">
                  <div className="flex items-center gap-2">
                    {col}
                    <Badge variant={getType(col) === 'numeric' ? 'numeric' : 'categorical'}>
                      {getType(col)}
                    </Badge>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, i) => (
              <tr
                key={i}
                className="border-b border-glass-border last:border-0 hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-4 py-2.5 text-muted">{page * PAGE_SIZE + i + 1}</td>
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2.5 text-white/80 max-w-[200px] truncate">
                    {String(row[col] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-muted">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">
          {filtered.length} row{filtered.length !== 1 ? 's' : ''}
          {search && ` (filtered from ${fullData.length})`}
          {isSampled && <span className="ml-2 text-amber-400">(computations use {Math.min(totalRows, 5000).toLocaleString()} sampled rows)</span>}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[80px] text-center text-sm text-muted">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
