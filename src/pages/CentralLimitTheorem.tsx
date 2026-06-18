import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Line, ComposedChart,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDatasetStore } from '@/store/datasetStore'
import { Repeat } from 'lucide-react'
import * as ss from 'simple-statistics'
import { generateQQData } from '@/lib/stats'

function simulateMeans(vals: number[], sampleSize: number, numSims: number): number[] {
  const means: number[] = []
  for (let i = 0; i < numSims; i++) {
    let sum = 0
    for (let j = 0; j < sampleSize; j++) {
      sum += vals[Math.floor(Math.random() * vals.length)]
    }
    means.push(sum / sampleSize)
  }
  return means
}

function makeHistogram(means: number[], bins = 30): { bin: string; count: number }[] {
  const min = Math.min(...means), max = Math.max(...means)
  const bw = (max - min) / bins || 1
  return Array.from({ length: bins }, (_, i) => {
    const lo = min + i * bw, hi = lo + bw
    const count = means.filter((m) => m >= lo && (i === bins - 1 ? m <= hi : m < hi)).length
    return { bin: `${lo.toFixed(2)}–${hi.toFixed(2)}`, count }
  })
}

function QQPlot({ data }: { data: { theoretical: number; observed: number }[] }) {
  const minT = data[0]?.theoretical || 0
  const maxT = data[data.length - 1]?.theoretical || 0
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="theoretical" tick={{ fill: '#8b8fa3', fontSize: 11 }} />
          <YAxis dataKey="observed" tick={{ fill: '#8b8fa3', fontSize: 11 }} />
          <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff' }} />
          <Scatter data={data} fill="#14b8a6" opacity={0.6} />
          <Line type="monotone" data={[{ theoretical: minT, observed: minT }, { theoretical: maxT, observed: maxT }]} dataKey="observed" stroke="#ef4444" strokeWidth={2} dot={false} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function CentralLimitTheorem() {
  const { fullData, columnMetadata, addActivity } = useDatasetStore()
  const [col, setCol] = useState('')
  const [numSims, setNumSims] = useState(500)
  const [results, setResults] = useState<{
    n10: { hist: { bin: string; count: number }[]; qq: { theoretical: number; observed: number }[] }
    n30: { hist: { bin: string; count: number }[]; qq: { theoretical: number; observed: number }[] }
    n100: { hist: { bin: string; count: number }[]; qq: { theoretical: number; observed: number }[] }
  } | null>(null)

  const numericCols = columnMetadata.filter((c) => c.type === 'numeric')

  const simulate = () => {
    if (!col) return
    const vals = fullData.map((r) => Number(r[col])).filter((v) => !isNaN(v))
    if (vals.length < 5) return

    const m10 = simulateMeans(vals, 10, numSims)
    const m30 = simulateMeans(vals, 30, numSims)
    const m100 = simulateMeans(vals, 100, numSims)

    setResults({
      n10: { hist: makeHistogram(m10), qq: generateQQData(m10) },
      n30: { hist: makeHistogram(m30), qq: generateQQData(m30) },
      n100: { hist: makeHistogram(m100), qq: generateQQData(m100) },
    })
    addActivity('CLT Simulation', `CLT: ${numSims} sims, n=10/30/100 on "${col}"`)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
          <Repeat className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Central Limit Theorem Simulator</h1>
          <p className="text-sm text-muted">Prove the CLT with Monte Carlo sampling at n=10, 30 & 100</p>
        </div>
      </div>

      {fullData.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted">Upload a dataset first.</CardContent></Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">Numeric Column</label>
                  <Select value={col} onValueChange={setCol}>
                    <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
                    <SelectContent>
                      {numericCols.map((c) => (<SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">Simulations</label>
                  <input type="number" min={10} max={5000} value={numSims}
                    onChange={(e) => setNumSims(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border border-glass-border bg-glass px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div className="flex items-end">
                  <Button onClick={simulate} disabled={!col || numSims < 2} className="w-full">Simulate All</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {results && (
            <>
              {[
                { key: 'n10' as const, label: 'n = 10', data: results.n10 },
                { key: 'n30' as const, label: 'n = 30', data: results.n30 },
                { key: 'n100' as const, label: 'n = 100', data: results.n100 },
              ].map(({ key, label, data }) => (
                <Card key={key}>
                  <CardHeader><CardTitle className="text-sm">Sample Size {label} — Histogram of Sample Means</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.hist}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="bin" tick={{ fill: '#8b8fa3', fontSize: 10 }} interval={Math.max(1, Math.floor(data.hist.length / 8))} />
                          <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} />
                          <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff' }} />
                          <Bar dataKey="count" fill="#14b8a6" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                  <CardContent className="pt-0">
                    <CardTitle className="text-sm mb-2">QQ Plot — {label}</CardTitle>
                    <QQPlot data={data.qq} />
                  </CardContent>
                </Card>
              ))}

              <Card>
                <CardHeader><CardTitle className="text-sm">CLT Interpretation</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted leading-relaxed">
                    <p>The <strong className="text-white">Central Limit Theorem (CLT)</strong> states that the distribution of sample means approaches a normal distribution as the sample size increases, <em>regardless of the population's underlying distribution</em>.</p>
                    <p className="mt-2"><strong className="text-white">Key observations from this simulation:</strong></p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>At <strong className="text-white">n = 10</strong>, the sampling distribution may still show skewness or irregularities matching the original data.</li>
                      <li>At <strong className="text-white">n = 30</strong>, the histogram becomes more bell-shaped and the QQ plot points align closer to the diagonal — the CLT is taking effect.</li>
                      <li>At <strong className="text-white">n = 100</strong>, the distribution of sample means closely approximates a normal distribution, as confirmed by the straight-line QQ plot.</li>
                    </ul>
                    <p className="mt-2">This demonstrates why n ≥ 30 is the conventional threshold for parametric tests that assume normality of the sampling distribution.</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}
