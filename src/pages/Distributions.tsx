import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDatasetStore } from '@/store/datasetStore'
import { Bell } from 'lucide-react'
import * as ss from 'simple-statistics'

function PMF({ data }: { data: Record<string, unknown>[] }) {
  const { columnMetadata } = useDatasetStore()
  const [col, setCol] = useState('')

  const catCols = columnMetadata.filter((c) => c.type === 'categorical')

  const pmfData = useMemo(() => {
    if (!col) return []
    const freq: Record<string, number> = {}
    for (const row of data) {
      const val = String(row[col] ?? '')
      freq[val] = (freq[val] || 0) + 1
    }
    const total = data.length
    return Object.entries(freq)
      .map(([name, count]) => ({ name, probability: count / total, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
  }, [data, col])

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted">Categorical Column</label>
        <Select value={col} onValueChange={setCol}>
          <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
          <SelectContent>
            {catCols.map((c) => (
              <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {pmfData.length > 0 && (
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pmfData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" tick={{ fill: '#8b8fa3', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,15,26,0.95)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  color: '#fff',
                }}
              />
              <Bar dataKey="probability" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function PDF({ data }: { data: Record<string, unknown>[] }) {
  const { columnMetadata } = useDatasetStore()
  const [col, setCol] = useState('')

  const numericCols = columnMetadata.filter((c) => c.type === 'numeric')

  const pdfData = useMemo(() => {
    if (!col) return []
    const vals = data
      .map((r) => Number(r[col]))
      .filter((v) => !isNaN(v))
    if (vals.length < 3) return []

    const mean = ss.mean(vals)
    const std = ss.standardDeviation(vals)
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const step = (max - min) / 80

    return Array.from({ length: 81 }, (_, i) => {
      const x = min + i * step
      const pdf = (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mean) / std) ** 2)
      return { x: x.toFixed(2), pdf }
    })
  }, [data, col])

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted">Numeric Column</label>
        <Select value={col} onValueChange={setCol}>
          <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
          <SelectContent>
            {numericCols.map((c) => (
              <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {pdfData.length > 0 && (
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pdfData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="x" tick={{ fill: '#8b8fa3', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,15,26,0.95)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  color: '#fff',
                }}
              />
              <Area type="monotone" dataKey="pdf" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default function Distributions() {
  const { fullData, computeData } = useDatasetStore()

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
          <Bell className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Distributions</h1>
          <p className="text-sm text-muted">Probability Mass Functions & Probability Density Functions</p>
        </div>
      </div>

      {fullData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted">
            Upload a dataset first to plot distributions.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>PMF — Categorical</CardTitle>
            </CardHeader>
            <CardContent>
              <PMF data={computeData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>PDF — Normal Curve</CardTitle>
            </CardHeader>
            <CardContent>
              <PDF data={computeData} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
