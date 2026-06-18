import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line, AreaChart, Area,
  ComposedChart,
} from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDatasetStore } from '@/store/datasetStore'
import { BarChart3, ScatterChart as ScatterIcon, LineChart as LineIcon, ChartColumn, Box, Sigma } from 'lucide-react'
import * as ss from 'simple-statistics'
import { iqr } from '@/lib/stats'

const chartTypes = [
  { value: 'bar', label: 'Bar', icon: BarChart3 },
  { value: 'scatter', label: 'Scatter', icon: ScatterIcon },
  { value: 'line', label: 'Line', icon: LineIcon },
  { value: 'histogram', label: 'Histogram', icon: ChartColumn },
  { value: 'boxplot', label: 'Boxplot', icon: Box },
  { value: 'cdf', label: 'CDF', icon: Sigma },
] as const

export default function VisualizationCenter() {
  const { fullData, computeData, columnMetadata, addActivity } = useDatasetStore()
  const [xCol, setXCol] = useState('')
  const [yCol, setYCol] = useState('')
  const [chartType, setChartType] = useState<'bar' | 'scatter' | 'line' | 'histogram' | 'boxplot' | 'cdf'>('bar')

  const numericCols = columnMetadata.filter((c) => c.type === 'numeric')
  const allCols = columnMetadata

  const chartData = useMemo(() => {
    if (!xCol || !yCol) return []
    return computeData
      .map((row) => ({ x: row[xCol], y: Number(row[yCol]), label: String(row[xCol] ?? '') }))
      .filter((d) => !isNaN(d.y) && d.label !== '')
  }, [computeData, xCol, yCol])

  const histogramData = useMemo(() => {
    if (!xCol) return []
    const vals = computeData.map((r) => Number(r[xCol])).filter((v) => !isNaN(v))
    if (vals.length < 3) return []
    const bins = 25
    const min = Math.min(...vals), max = Math.max(...vals)
    const bw = (max - min) / bins || 1
    const hist = Array.from({ length: bins }, (_, i) => {
      const lo = min + i * bw, hi = lo + bw
      const count = vals.filter((v) => v >= lo && (i === bins - 1 ? v <= hi : v < hi)).length
      return { bin: `${lo.toFixed(1)}–${hi.toFixed(1)}`, count }
    })
    const mean = ss.mean(vals), std = ss.standardDeviation(vals)
    return hist.map((h, i) => {
      const x = min + i * bw + bw / 2
      const pdf = (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mean) / std) ** 2)
      return { ...h, pdf: pdf * vals.length * bw }
    })
  }, [computeData, xCol])

  const boxplotData = useMemo(() => {
    if (chartType !== 'boxplot') return null
    const categories = xCol ? [...new Set(computeData.map((r) => String(r[xCol])))] : ['Dataset']
    return categories.slice(0, 10).map((cat) => {
      const vals = xCol
        ? computeData.map((r) => String(r[xCol]) === cat ? Number(r[yCol]) : NaN).filter((v) => !isNaN(v))
        : computeData.map((r) => Number(r[yCol])).filter((v) => !isNaN(v))
      if (vals.length < 4) return null
      const q = iqr(vals)
      const sorted = [...vals].sort((a, b) => a - b)
      return { name: cat, min: sorted[0], q1: q.q1, median: ss.median(sorted), q3: q.q3, max: sorted[sorted.length - 1] }
    }).filter(Boolean) as { name: string; min: number; q1: number; median: number; q3: number; max: number }[]
  }, [computeData, xCol, yCol, chartType])

  const cdfData = useMemo(() => {
    if (!xCol) return []
    const vals = computeData.map((r) => Number(r[xCol])).filter((v) => !isNaN(v)).sort((a, b) => a - b)
    if (vals.length < 3) return []
    const step = Math.max(1, Math.floor(vals.length / 80))
    return vals.filter((_, i) => i % step === 0 || i === vals.length - 1).map((v, i, arr) => ({
      x: v.toFixed(2),
      cdf: (vals.indexOf(v) + 1) / vals.length,
    }))
  }, [computeData, xCol])

  const handleRender = () => {
    if (chartType === 'histogram' || chartType === 'cdf') {
      if (xCol) addActivity('Visualization', `Rendered ${chartType}: ${xCol}`)
    } else if (chartType === 'boxplot') {
      if (yCol) addActivity('Visualization', `Rendered boxplot: ${yCol}${xCol ? ` by ${xCol}` : ''}`)
    } else if (xCol && yCol) {
      addActivity('Visualization', `Rendered ${chartType} chart: ${xCol} vs ${yCol}`)
    }
  }

  const renderChart = () => {
    if (chartType === 'histogram') {
      if (histogramData.length === 0) return <p className="py-12 text-center text-muted">Select a numeric column for the X axis.</p>
      return (
        <ComposedChart data={histogramData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="bin" tick={{ fill: '#8b8fa3', fontSize: 10 }} interval={Math.max(1, Math.floor(histogramData.length / 8))} />
          <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} />
          <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff' }} />
          <Bar dataKey="count" fill="#6366f1" radius={[2, 2, 0, 0]} opacity={0.6} />
          <Line type="monotone" dataKey="pdf" stroke="#ef4444" strokeWidth={2} dot={false} />
        </ComposedChart>
      )
    }
    if (chartType === 'boxplot') {
      if (!boxplotData || boxplotData.length === 0) return <p className="py-12 text-center text-muted">Select a numeric Y column (and optional categorical X for grouping).</p>
      const bpd = boxplotData.flatMap((d) => [
        { name: d.name, type: 'Min', value: d.min },
        { name: d.name, type: 'Q1', value: d.q1 },
        { name: d.name, type: 'Median', value: d.median },
        { name: d.name, type: 'Q3', value: d.q3 },
        { name: d.name, type: 'Max', value: d.max },
      ])
      return (
        <BarChart data={bpd}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="name" tick={{ fill: '#8b8fa3', fontSize: 12 }} />
          <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} />
          <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff' }} />
          <Bar dataKey="value" fill="#14b8a6" radius={[2, 2, 0, 0]} />
        </BarChart>
      )
    }
    if (chartType === 'cdf') {
      if (cdfData.length === 0) return <p className="py-12 text-center text-muted">Select a numeric column for X.</p>
      return (
        <AreaChart data={cdfData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="x" tick={{ fill: '#8b8fa3', fontSize: 11 }} />
          <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} domain={[0, 1]} />
          <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff' }} />
          <Area type="step" dataKey="cdf" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />
        </AreaChart>
      )
    }
    if (chartData.length < 2) return <p className="py-12 text-center text-muted">Select X and Y columns to render chart.</p>
    if (chartType === 'bar') {
      return (
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="label" tick={{ fill: '#8b8fa3', fontSize: 12 }} />
          <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} />
          <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff' }} />
          <Bar dataKey="y" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      )
    }
    if (chartType === 'scatter') {
      return (
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="x" tick={{ fill: '#8b8fa3', fontSize: 12 }} />
          <YAxis dataKey="y" tick={{ fill: '#8b8fa3', fontSize: 12 }} />
          <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff' }} />
          <Scatter data={chartData} fill="#6366f1" opacity={0.7} />
        </ScatterChart>
      )
    }
    return (
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="label" tick={{ fill: '#8b8fa3', fontSize: 12 }} />
        <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} />
        <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff' }} />
        <Line type="monotone" dataKey="y" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
      </LineChart>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Visualization Center</h1>
          <p className="text-sm text-muted">Bar, Scatter, Line, Histogram, Boxplot & CDF plots powered by Recharts</p>
        </div>
      </div>

      {fullData.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted">Upload a dataset first.</CardContent></Card>
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">X-Axis / Numeric</label>
                  <Select value={xCol} onValueChange={setXCol}>
                    <SelectTrigger><SelectValue placeholder="Select X" /></SelectTrigger>
                    <SelectContent>
                      {allCols.map((c) => (<SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">Y-Axis (optional for 1D)</label>
                  <Select value={yCol} onValueChange={setYCol}>
                    <SelectTrigger><SelectValue placeholder="Select Y" /></SelectTrigger>
                    <SelectContent>
                      {numericCols.map((c) => (<SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">Chart Type</label>
                  <div className="flex flex-wrap gap-1">
                    {chartTypes.map((t) => (
                      <button key={t.value} onClick={() => setChartType(t.value)}
                        className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all ${chartType === t.value ? 'border-accent bg-accent/15 text-accent' : 'border-glass-border text-white/60 hover:border-accent/50'}`}>
                        <t.icon className="h-3 w-3" />{t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleRender} disabled={!xCol && chartType === 'boxplot' ? !yCol : !xCol} className="w-full">Render</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {chartData.length > 1 || histogramData.length > 0 || cdfData.length > 0 || (boxplotData && boxplotData.length > 0) ? (
            <Card>
              <CardContent className="pt-6">
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  )
}
