import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDatasetStore } from '@/store/datasetStore'
import { Repeat } from 'lucide-react'
import * as ss from 'simple-statistics'

export default function CentralLimitTheorem() {
  const { fullData, columnMetadata, addActivity } = useDatasetStore()
  const [col, setCol] = useState('')
  const [sampleSize, setSampleSize] = useState(30)
  const [numSims, setNumSims] = useState(500)
  const [results, setResults] = useState<{ bin: string; count: number }[] | null>(null)

  const numericCols = columnMetadata.filter((c) => c.type === 'numeric')

  const simulate = () => {
    if (!col) return
    const vals = fullData
      .map((r) => Number(r[col]))
      .filter((v) => !isNaN(v))
    if (vals.length < sampleSize) return

    const means: number[] = []
    for (let i = 0; i < numSims; i++) {
      const sample: number[] = []
      for (let j = 0; j < sampleSize; j++) {
        const idx = Math.floor(Math.random() * vals.length)
        sample.push(vals[idx])
      }
      means.push(ss.mean(sample))
    }

    const min = Math.min(...means)
    const max = Math.max(...means)
    const bins = 30
    const binWidth = (max - min) / bins
    const histogram: { bin: string; count: number }[] = []

    for (let i = 0; i < bins; i++) {
      const lo = min + i * binWidth
      const hi = lo + binWidth
      const count = means.filter((m) => m >= lo && (i === bins - 1 ? m <= hi : m < hi)).length
      histogram.push({ bin: `${lo.toFixed(2)}–${hi.toFixed(2)}`, count })
    }

    setResults(histogram)
    addActivity('CLT Simulation', `CLT: ${numSims} simulations, sample size=${sampleSize} on "${col}"`)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
          <Repeat className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Central Limit Theorem Simulator</h1>
          <p className="text-sm text-muted">Prove the CLT with Monte Carlo sampling</p>
        </div>
      </div>

      {fullData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted">
            Upload a dataset first to run the CLT simulator.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-4">
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
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">Sample Size (n)</label>
                  <input
                    type="number"
                    min={2}
                    max={200}
                    value={sampleSize}
                    onChange={(e) => setSampleSize(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border border-glass-border bg-glass px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">Simulations</label>
                  <input
                    type="number"
                    min={10}
                    max={5000}
                    value={numSims}
                    onChange={(e) => setNumSims(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border border-glass-border bg-glass px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={simulate} disabled={!col || sampleSize < 2 || numSims < 2} className="w-full">
                    Simulate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {results && (
            <Card>
              <CardHeader>
                <CardTitle>Distribution of Sample Means</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={results}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="bin"
                        tick={{ fill: '#8b8fa3', fontSize: 10 }}
                        interval={Math.max(1, Math.floor(results.length / 10))}
                      />
                      <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(15,15,26,0.95)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 12,
                          color: '#fff',
                        }}
                      />
                      <Bar dataKey="count" fill="#14b8a6" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-4 text-center text-xs text-muted">
                  The histogram approximates a normal distribution — proving the Central Limit Theorem.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
