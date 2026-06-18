import { useCallback, useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, Table as TableIcon } from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { useDatasetStore, type ColumnMetadata } from '@/store/datasetStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { motion, AnimatePresence } from 'framer-motion'

function inferColumns(data: Record<string, unknown>[]): ColumnMetadata[] {
  if (data.length === 0) return []
  const keys = Object.keys(data[0])
  const sampleSize = Math.min(data.length, 2000)
  const step = Math.floor(data.length / sampleSize) || 1
  return keys.map((key) => {
    let numericCount = 0
    let missingCount = 0
    for (let i = 0; i < data.length; i += step) {
      const row = data[i]
      const val = row[key]
      if (val === null || val === undefined || val === '') missingCount++
      else if (typeof val === 'number' || (!isNaN(Number(val)) && val !== '')) numericCount++
    }
    const totalValid = Math.ceil(data.length / step) - missingCount
    const type: 'numeric' | 'categorical' =
      totalValid > 0 && numericCount / totalValid > 0.8 ? 'numeric' : 'categorical'
    return { name: key, type, missingCount: Math.round(missingCount * step) }
  })
}

export default function DataUpload() {
  const { fileName, fullData, columnMetadata, setData } = useDatasetStore()
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const parseFile = useCallback(
    (file: File) => {
      setLoading(true)
      setError(null)
      const ext = file.name.split('.').pop()?.toLowerCase()

      try {
        if (ext === 'csv') {
          Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
              if (results.errors.length > 0 && results.data.length === 0) {
                setError('Failed to parse CSV: ' + results.errors[0].message)
                setLoading(false)
                return
              }
              const data = results.data as Record<string, unknown>[]
              if (data.length === 0) {
                setError('CSV file appears to be empty')
                setLoading(false)
                return
              }
              const meta = inferColumns(data)
              setData(file.name, data, meta)
              setLoading(false)
            },
            error: (err) => {
              setError('CSV parse error: ' + err.message)
              setLoading(false)
            },
          })
        } else if (ext === 'xlsx' || ext === 'xls') {
          const reader = new FileReader()
          reader.onload = (e) => {
            try {
              const wb = XLSX.read(e.target?.result, { type: 'array' })
              const ws = wb.Sheets[wb.SheetNames[0]]
              const data = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[]
              if (data.length === 0) {
                setError('Excel file appears to be empty')
                setLoading(false)
                return
              }
              const meta = inferColumns(data)
              setData(file.name, data, meta)
              setLoading(false)
            } catch {
              setError('Failed to parse Excel file. It may be corrupted.')
              setLoading(false)
            }
          }
          reader.onerror = () => {
            setError('Failed to read file')
            setLoading(false)
          }
          reader.readAsArrayBuffer(file)
        } else if (ext === 'json') {
          const reader = new FileReader()
          reader.onload = (e) => {
            try {
              const parsed = JSON.parse(e.target?.result as string)
              const data = Array.isArray(parsed) ? parsed : [parsed]
              if (data.length === 0) {
                setError('JSON file contains an empty array')
                setLoading(false)
                return
              }
              const meta = inferColumns(data)
              setData(file.name, data, meta)
              setLoading(false)
            } catch {
              setError('Invalid JSON format')
              setLoading(false)
            }
          }
          reader.onerror = () => {
            setError('Failed to read file')
            setLoading(false)
          }
          reader.readAsText(file)
        } else {
          setError('Unsupported file type. Please upload .csv, .xlsx, or .json')
          setLoading(false)
        }
      } catch {
        setError('An unexpected error occurred while parsing the file')
        setLoading(false)
      }
    },
    [setData]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) parseFile(file)
    },
    [parseFile]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) parseFile(file)
    },
    [parseFile]
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
          <Upload className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Data Upload</h1>
          <p className="text-sm text-muted">Import CSV, Excel, or JSON files</p>
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-16 text-center transition-all duration-300 ${
          dragOver
            ? 'border-accent bg-accent/10 shadow-lg shadow-accent/20'
            : 'border-glass-border hover:border-accent/50 hover:bg-white/[0.02]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.json"
          className="hidden"
          onChange={handleFileSelect}
        />
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <p className="text-sm text-muted">Parsing your file...</p>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                <Upload className="h-7 w-7 text-accent" />
              </div>
              <div>
                <p className="text-base font-medium text-white">
                  Drop your file here, or click to browse
                </p>
                <p className="mt-1 text-sm text-muted">Supports .csv, .xlsx, .json</p>
              </div>
              <div className="flex justify-center gap-2">
                <Badge variant="outline">
                  <FileText className="mr-1 h-3 w-3" />
                  CSV
                </Badge>
                <Badge variant="outline">XLSX</Badge>
                <Badge variant="outline">JSON</Badge>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm text-red-400"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-red-400"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {fullData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <span className="text-sm text-white/80">
              Loaded <strong>{fileName}</strong> — {fullData.length} rows,{' '}
              {columnMetadata.length} columns
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TableIcon className="h-4 w-4 text-accent" />
                  Column Metadata
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {columnMetadata.map((col) => (
                    <div
                      key={col.name}
                      className="flex items-center justify-between rounded-lg border border-glass-border px-4 py-2.5"
                    >
                      <span className="text-sm text-white">{col.name}</span>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={col.type === 'numeric' ? 'numeric' : 'categorical'}
                        >
                          {col.type}
                        </Badge>
                        {col.missingCount > 0 && (
                          <span className="text-xs text-amber-400">
                            {col.missingCount} missing
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TableIcon className="h-4 w-4 text-accent" />
                  Data Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable />
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  )
}
