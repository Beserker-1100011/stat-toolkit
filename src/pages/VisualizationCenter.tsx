import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
} from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDatasetStore } from '@/store/datasetStore'
import { BarChart3, ScatterChart as ScatterIcon, LineChart as LineIcon } from 'lucide-react'

const chartTypes = [
  { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { value: 'scatter', label: 'Scatter Plot', icon: ScatterIcon },
  { value: 'line', label: 'Line Chart', icon: LineIcon },
] as const

export default function VisualizationCenter() {
  const { fullData, columnMetadata, addActivity } = useDatasetStore()
  const [xCol, setXCol] = useState('')
  const [yCol, setYCol] = useState('')
  const [chartType, setChartType] = useState<'bar' | 'scatter' | 'line'>('bar')

  const numericCols = columnMetadata.filter((c) => c.type === 'numeric')
  const allCols = columnMetadata

  const chartData = useMemo(() => {
    if (!xCol || !yCol) return []
    return fullData
      .map((row) => ({
        x: row[xCol],
        y: Number(row[yCol]),
        label: String(row[xCol] ?? ''),
      }))
      .filter((d) => !isNaN(d.y) && d.label !== '')
  }, [fullData, xCol, yCol])

  const handleRender = () => {
    if (xCol && yCol) {
      addActivity('Visualization', `Rendered ${chartType} chart: ${xCol} vs ${yCol}`)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Visualization Center</h1>
          <p className="text-sm text-muted">Dynamic charts powered by Recharts</p>
        </div>
      </div>

      {fullData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted">
            Upload a dataset first to create visualizations.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">X-Axis</label>
                  <Select value={xCol} onValueChange={setXCol}>
                    <SelectTrigger><SelectValue placeholder="Select X" /></SelectTrigger>
                    <SelectContent>
                      {allCols.map((c) => (
                        <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">Y-Axis</label>
                  <Select value={yCol} onValueChange={setYCol}>
                    <SelectTrigger><SelectValue placeholder="Select Y" /></SelectTrigger>
                    <SelectContent>
                      {numericCols.map((c) => (
                        <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">Chart Type</label>
                  <div className="flex gap-1">
                    {chartTypes.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setChartType(t.value)}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                          chartType === t.value
                            ? 'border-accent bg-accent/15 text-accent'
                            : 'border-glass-border text-white/60 hover:border-accent/50'
                        }`}
                      >
                        <t.icon className="h-3.5 w-3.5" />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleRender} disabled={!xCol || !yCol} className="w-full">
                    Render
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {chartData.length > 1 && xCol && yCol && (
            <Card>
              <CardContent className="pt-6">
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="label" tick={{ fill: '#8b8fa3', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            background: 'rgba(15,15,26,0.95)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: 12,
                            color: '#fff',
                          }}
                        />
                        <Bar dataKey="y" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : chartType === 'scatter' ? (
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="x" tick={{ fill: '#8b8fa3', fontSize: 12 }} />
                        <YAxis dataKey="y" tick={{ fill: '#8b8fa3', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            background: 'rgba(15,15,26,0.95)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: 12,
                            color: '#fff',
                          }}
                        />
                        <Scatter data={chartData} fill="#6366f1" opacity={0.7} />
                      </ScatterChart>
                    ) : (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="label" tick={{ fill: '#8b8fa3', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            background: 'rgba(15,15,26,0.95)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: 12,
                            color: '#fff',
                          }}
                        />
                        <Line type="monotone" dataKey="y" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
