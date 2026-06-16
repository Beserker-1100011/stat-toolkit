import { useState, useMemo } from 'react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDatasetStore } from '@/store/datasetStore'
import {
  Sigma,
  ArrowRightLeft,
  TrendingUp,
  ScanSearch,
} from 'lucide-react'
import * as ss from 'simple-statistics'
import { tTestPValue } from '@/lib/stats'

function DescriptiveStats({ data }: { data: Record<string, unknown>[] }) {
  const { columnMetadata, addActivity } = useDatasetStore()
  const [col, setCol] = useState('')
  const [results, setResults] = useState<Record<string, number | string> | null>(null)

  const numericCols = columnMetadata.filter((c) => c.type === 'numeric')

  const compute = () => {
    if (!col) return
    const vals = data
      .map((r) => Number(r[col]))
      .filter((v) => !isNaN(v))
    if (vals.length < 2) return

    const sorted = [...vals].sort((a, b) => a - b)
    const res = {
      Count: vals.length,
      Mean: ss.mean(vals).toFixed(4),
      Median: ss.median(sorted).toFixed(4),
      Mode: String(ss.mode(sorted)),
      Variance: ss.variance(vals).toFixed(4),
      'Std Dev': ss.standardDeviation(vals).toFixed(4),
      Skewness: ss.sampleSkewness(vals).toFixed(4),
      Min: Math.min(...vals).toFixed(4),
      Max: Math.max(...vals).toFixed(4),
    }
    setResults(res)
    addActivity('Descriptive Statistics', `Computed stats for "${col}"`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4">
        <div className="flex-1">
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
        <Button onClick={compute} disabled={!col}>Compute</Button>
      </div>
      {results && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Object.entries(results).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-glass-border bg-white/[0.02] px-4 py-3">
              <p className="text-xs text-muted">{k}</p>
              <p className="mt-0.5 text-sm font-semibold text-white">{String(v)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CorrelationMatrix({ data }: { data: Record<string, unknown>[] }) {
  const { columnMetadata, addActivity } = useDatasetStore()
  const [selected, setSelected] = useState<string[]>([])
  const [matrix, setMatrix] = useState<{ x: string; y: string; r: number }[] | null>(null)

  const numericCols = columnMetadata.filter((c) => c.type === 'numeric')

  const toggle = (col: string) => {
    setSelected((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    )
  }

  const compute = () => {
    if (selected.length < 2) return
    const pairs: { x: string; y: string; r: number }[] = []
    for (let i = 0; i < selected.length; i++) {
      for (let j = i + 1; j < selected.length; j++) {
        const a = data.map((r) => Number(r[selected[i]])).filter((v) => !isNaN(v))
        const b = data.map((r) => Number(r[selected[j]])).filter((v) => !isNaN(v))
        const minLen = Math.min(a.length, b.length)
        const x = a.slice(0, minLen)
        const y = b.slice(0, minLen)
        if (x.length < 2) continue
        pairs.push({
          x: selected[i],
          y: selected[j],
          r: ss.sampleCorrelation(x, y),
        })
      }
    }
    setMatrix(pairs)
    addActivity('Correlation Matrix', `Computed ${pairs.length} correlation pairs`)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Select 2+ numeric columns for pairwise correlation:</p>
      <div className="flex flex-wrap gap-2">
        {numericCols.map((c) => (
          <button
            key={c.name}
            onClick={() => toggle(c.name)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              selected.includes(c.name)
                ? 'border-accent bg-accent/15 text-accent'
                : 'border-glass-border text-white/60 hover:border-accent/50'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
      <Button onClick={compute} disabled={selected.length < 2}>Compute Matrix</Button>
      {matrix && (
        <div className="overflow-x-auto rounded-xl border border-glass-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-glass-border bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-muted">Variable X</th>
                <th className="px-4 py-3 text-left text-muted">Variable Y</th>
                <th className="px-4 py-3 text-left text-muted">Pearson r</th>
                <th className="px-4 py-3 text-left text-muted">Strength</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((p) => {
                const abs = Math.abs(p.r)
                const strength =
                  abs > 0.8 ? 'Very Strong' : abs > 0.6 ? 'Strong' : abs > 0.4 ? 'Moderate' : abs > 0.2 ? 'Weak' : 'Very Weak'
                return (
                  <tr key={`${p.x}-${p.y}`} className="border-b border-glass-border last:border-0">
                    <td className="px-4 py-2.5 text-white">{p.x}</td>
                    <td className="px-4 py-2.5 text-white">{p.y}</td>
                    <td className="px-4 py-2.5 font-mono text-white">{p.r.toFixed(4)}</td>
                    <td className="px-4 py-2.5 text-white/80">{strength}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function LinearRegression({ data }: { data: Record<string, unknown>[] }) {
  const { columnMetadata, addActivity } = useDatasetStore()
  const [xCol, setXCol] = useState('')
  const [yCol, setYCol] = useState('')
  const [result, setResult] = useState<Record<string, number> | null>(null)

  const numericCols = columnMetadata.filter((c) => c.type === 'numeric')

  const compute = () => {
    if (!xCol || !yCol) return
    const points: [number, number][] = data
      .map((r) => [Number(r[xCol]), Number(r[yCol])] as [number, number])
      .filter(([a, b]) => !isNaN(a) && !isNaN(b))
    if (points.length < 3) return

    const { m: slope, b: intercept } = ss.linearRegression(points)
    const lineFn = ss.linearRegressionLine({ m: slope, b: intercept })
    const r2 = ss.rSquared(points, lineFn)

    setResult({ slope, intercept, rSquared: r2 })
    addActivity('Linear Regression', `Regressed ${yCol} ~ ${xCol} (R²=${r2.toFixed(4)})`)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">X (Independent)</label>
          <Select value={xCol} onValueChange={setXCol}>
            <SelectTrigger><SelectValue placeholder="Select X" /></SelectTrigger>
            <SelectContent>
              {numericCols.map((c) => (
                <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Y (Dependent)</label>
          <Select value={yCol} onValueChange={setYCol}>
            <SelectTrigger><SelectValue placeholder="Select Y" /></SelectTrigger>
            <SelectContent>
              {numericCols.map((c) => (
                <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={compute} disabled={!xCol || !yCol}>Run Regression</Button>
      {result && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-glass-border bg-white/[0.02] px-4 py-3">
            <p className="text-xs text-muted">Slope (β₁)</p>
            <p className="mt-0.5 text-sm font-semibold text-white">{result.slope.toFixed(4)}</p>
          </div>
          <div className="rounded-xl border border-glass-border bg-white/[0.02] px-4 py-3">
            <p className="text-xs text-muted">Intercept (β₀)</p>
            <p className="mt-0.5 text-sm font-semibold text-white">{result.intercept.toFixed(4)}</p>
          </div>
          <div className="rounded-xl border border-glass-border bg-white/[0.02] px-4 py-3">
            <p className="text-xs text-muted">R²</p>
            <p className="mt-0.5 text-sm font-semibold text-white">{result.rSquared.toFixed(4)}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function TTest({ data }: { data: Record<string, unknown>[] }) {
  const { columnMetadata, addActivity } = useDatasetStore()
  const [col, setCol] = useState('')
  const [result, setResult] = useState<Record<string, number | string> | null>(null)

  const numericCols = columnMetadata.filter((c) => c.type === 'numeric')

  const compute = () => {
    if (!col) return
    const vals = data
      .map((r) => Number(r[col]))
      .filter((v) => !isNaN(v))
    if (vals.length < 3) return

    const mean = ss.mean(vals)
    const std = ss.standardDeviation(vals)
    const n = vals.length
    const se = std / Math.sqrt(n)
    const tStat = mean / se
    const df = n - 1
    const pValue = tTestPValue(Math.abs(tStat), df)

    setResult({
      't-Statistic': tStat.toFixed(4),
      'Degrees of Freedom': df,
      'p-value (two-tailed)': pValue.toFixed(6),
      'Mean': mean.toFixed(4),
      'Std Error': se.toFixed(4),
      'Significant (α=0.05)': pValue < 0.05 ? 'Yes' : 'No',
    })
    addActivity('T-Test', `One-sample t-test on "${col}" (t=${tStat.toFixed(3)}, p=${pValue.toFixed(4)})`)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted">Numeric Column (against μ=0)</label>
        <Select value={col} onValueChange={setCol}>
          <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
          <SelectContent>
            {numericCols.map((c) => (
              <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={compute} disabled={!col}>Run T-Test</Button>
      {result && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Object.entries(result).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-glass-border bg-white/[0.02] px-4 py-3">
              <p className="text-xs text-muted">{k}</p>
              <p className="mt-0.5 text-sm font-semibold text-white">{String(v)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function StatisticsEngine() {
  const { fullData } = useDatasetStore()

  const tabs = [
    { value: 'descriptive', label: 'Descriptive', icon: Sigma, comp: <DescriptiveStats data={fullData} /> },
    { value: 'correlation', label: 'Correlation', icon: ArrowRightLeft, comp: <CorrelationMatrix data={fullData} /> },
    { value: 'regression', label: 'Regression', icon: TrendingUp, comp: <LinearRegression data={fullData} /> },
    { value: 'ttest', label: 'T-Test / ANOVA', icon: ScanSearch, comp: <TTest data={fullData} /> },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
          <Sigma className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Statistics Engine</h1>
          <p className="text-sm text-muted">Descriptive stats, correlations, regression & hypothesis tests</p>
        </div>
      </div>

      {fullData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted">
            Upload a dataset first to access the statistics engine.
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="descriptive">
          <TabsList>
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="flex items-center gap-2">
                <t.icon className="h-4 w-4" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((t) => (
            <TabsContent key={t.value} value={t.value}>
              <Card>
                <CardContent className="pt-6">{t.comp}</CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
