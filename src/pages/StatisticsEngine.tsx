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
import { Input } from '@/components/ui/input'
import { useDatasetStore } from '@/store/datasetStore'
import {
  Sigma,
  ArrowRightLeft,
  TrendingUp,
  Zap,
  Hash,
  Equal,
  Table,
} from 'lucide-react'
import * as ss from 'simple-statistics'
import { tTestPValue, zTestPValue, chiSquarePValue, fTestPValue, iqr } from '@/lib/stats'

function DescriptiveStats({ data }: { data: Record<string, unknown>[] }) {
  const { columnMetadata, addActivity } = useDatasetStore()
  const [col, setCol] = useState('')
  const [results, setResults] = useState<Record<string, number | string> | null>(null)
  const [zInput, setZInput] = useState('')
  const [zScore, setZScore] = useState<number | null>(null)

  const numericCols = columnMetadata.filter((c) => c.type === 'numeric')

  const compute = () => {
    if (!col) return
    const vals = data
      .map((r) => Number(r[col]))
      .filter((v) => !isNaN(v))
    if (vals.length < 2) return

    const sorted = [...vals].sort((a, b) => a - b)
    const mean = ss.mean(vals)
    const std = ss.standardDeviation(vals)
    const q = iqr(vals)
    const within2σ = vals.filter((v) => Math.abs(v - mean) <= 2 * std).length
    const within3σ = vals.filter((v) => Math.abs(v - mean) <= 3 * std).length

    const res: Record<string, number | string> = {
      Count: vals.length,
      Mean: mean.toFixed(4),
      Median: ss.median(sorted).toFixed(4),
      Mode: String(ss.mode(sorted)),
      Variance: ss.variance(vals).toFixed(4),
      'Std Dev': std.toFixed(4),
      Skewness: ss.sampleSkewness(vals).toFixed(4),
      Min: Math.min(...vals).toFixed(4),
      Max: Math.max(...vals).toFixed(4),
      Q1: q.q1.toFixed(4),
      Q3: q.q3.toFixed(4),
      IQR: q.iqr.toFixed(4),
      'IQR Outliers': q.outliers.length,
      '±2σ Coverage': `${((within2σ / vals.length) * 100).toFixed(1)}%`,
      '±3σ Coverage': `${((within3σ / vals.length) * 100).toFixed(1)}%`,
    }
    setResults(res)
    addActivity('Descriptive Statistics', `Computed stats for "${col}"`)
  }

  const computeZ = () => {
    if (!col || !zInput) return
    const vals = data
      .map((r) => Number(r[col]))
      .filter((v) => !isNaN(v))
    if (vals.length < 2) return
    const mean = ss.mean(vals)
    const std = ss.standardDeviation(vals)
    const x = Number(zInput)
    const z = (x - mean) / std
    setZScore(z)
  }

  return (
    <div className="space-y-6">
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
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(results).map(([k, v]) => (
              <div key={k} className="rounded-xl border border-glass-border bg-white/[0.02] px-4 py-3">
                <p className="text-xs text-muted">{k}</p>
                <p className="mt-0.5 text-sm font-semibold text-white">{String(v)}</p>
              </div>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Z-Score Calculator</CardTitle></CardHeader>
            <CardContent className="flex items-end gap-4">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-medium text-muted">Value</label>
                <Input
                  type="number"
                  value={zInput}
                  onChange={(e) => setZInput(e.target.value)}
                  placeholder="Enter a value"
                />
              </div>
              <Button onClick={computeZ} disabled={!col || !zInput}>Compute Z</Button>
            </CardContent>
            {zScore !== null && (
              <div className="px-6 pb-4">
                <p className="text-sm">
                  <span className="text-muted">Z-Score: </span>
                  <span className="font-mono text-white">{zScore.toFixed(4)}</span>
                  <span className="ml-3 text-muted">
                    ({Math.abs(zScore) > 3 ? 'Potential outlier' : Math.abs(zScore) > 2 ? 'Unusual' : 'Normal'})
                  </span>
                </p>
              </div>
            )}
          </Card>
        </>
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

function ZTest({ data }: { data: Record<string, unknown>[] }) {
  const { columnMetadata, addActivity } = useDatasetStore()
  const [col, setCol] = useState('')
  const [mu, setMu] = useState('0')
  const [sigma, setSigma] = useState('')
  const [result, setResult] = useState<Record<string, number | string> | null>(null)

  const numericCols = columnMetadata.filter((c) => c.type === 'numeric')

  const compute = () => {
    if (!col || !sigma) return
    const vals = data
      .map((r) => Number(r[col]))
      .filter((v) => !isNaN(v))
    if (vals.length < 2) return

    const mean = ss.mean(vals)
    const n = vals.length
    const popStd = Number(sigma)
    const muVal = Number(mu)
    const se = popStd / Math.sqrt(n)
    const zStat = (mean - muVal) / se
    const pValue = zTestPValue(zStat)

    setResult({
      'Sample Mean': mean.toFixed(4),
      'Population Mean (μ₀)': muVal,
      'Population Std (σ)': popStd,
      'Sample Size (n)': n,
      'Std Error': se.toFixed(4),
      'z-Statistic': zStat.toFixed(4),
      'p-value (two-tailed)': pValue.toFixed(6),
      'Significant (α=0.05)': pValue < 0.05 ? 'Yes' : 'No',
    })
    addActivity('Z-Test', `One-sample z-test on "${col}" (z=${zStat.toFixed(3)}, p=${pValue.toFixed(4)})`)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <label className="mb-1.5 block text-xs font-medium text-muted">Population Mean (μ₀)</label>
          <Input type="number" value={mu} onChange={(e) => setMu(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Population Std (σ)</label>
          <Input type="number" value={sigma} onChange={(e) => setSigma(e.target.value)} placeholder="Required" />
        </div>
      </div>
      <Button onClick={compute} disabled={!col || !sigma}>Run Z-Test</Button>
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

function OneSampleTTest({ data }: { data: Record<string, unknown>[] }) {
  const { columnMetadata, addActivity } = useDatasetStore()
  const [col, setCol] = useState('')
  const [mu, setMu] = useState('0')
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
    const muVal = Number(mu)
    const se = std / Math.sqrt(n)
    const tStat = (mean - muVal) / se
    const df = n - 1
    const pValue = tTestPValue(Math.abs(tStat), df)

    setResult({
      'Sample Mean': mean.toFixed(4),
      'Hypothesized Mean (μ₀)': muVal,
      'Sample Std (s)': std.toFixed(4),
      'Sample Size (n)': n,
      'Std Error': se.toFixed(4),
      't-Statistic': tStat.toFixed(4),
      'Degrees of Freedom': df,
      'p-value (two-tailed)': pValue.toFixed(6),
      'Significant (α=0.05)': pValue < 0.05 ? 'Yes' : 'No',
    })
    addActivity('One-Sample T-Test', `One-sample t-test on "${col}" (t=${tStat.toFixed(3)}, p=${pValue.toFixed(4)})`)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
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
          <label className="mb-1.5 block text-xs font-medium text-muted">Hypothesized Mean (μ₀)</label>
          <Input type="number" value={mu} onChange={(e) => setMu(e.target.value)} />
        </div>
      </div>
      <Button onClick={compute} disabled={!col}>Run One-Sample T-Test</Button>
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

function IndependentTTest({ data }: { data: Record<string, unknown>[] }) {
  const { columnMetadata, addActivity } = useDatasetStore()
  const [col1, setCol1] = useState('')
  const [col2, setCol2] = useState('')
  const [result, setResult] = useState<Record<string, number | string> | null>(null)

  const numericCols = columnMetadata.filter((c) => c.type === 'numeric')

  const compute = () => {
    if (!col1 || !col2) return
    const a = data.map((r) => Number(r[col1])).filter((v) => !isNaN(v))
    const b = data.map((r) => Number(r[col2])).filter((v) => !isNaN(v))
    if (a.length < 2 || b.length < 2) return

    const n1 = a.length, n2 = b.length
    const m1 = ss.mean(a), m2 = ss.mean(b)
    const v1 = ss.variance(a), v2 = ss.variance(b)
    const sp2 = ((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2)
    const se = Math.sqrt(sp2 * (1 / n1 + 1 / n2))
    const tStat = (m1 - m2) / se
    const df = n1 + n2 - 2
    const pValue = tTestPValue(Math.abs(tStat), df)

    setResult({
      'Group 1 Mean': m1.toFixed(4),
      'Group 2 Mean': m2.toFixed(4),
      'Mean Difference': (m1 - m2).toFixed(4),
      'Pooled Variance': sp2.toFixed(4),
      'Std Error': se.toFixed(4),
      't-Statistic': tStat.toFixed(4),
      'Degrees of Freedom': df,
      'p-value (two-tailed)': pValue.toFixed(6),
      'Significant (α=0.05)': pValue < 0.05 ? 'Yes' : 'No',
    })
    addActivity('Independent T-Test', `Two-sample t-test (t=${tStat.toFixed(3)}, p=${pValue.toFixed(4)})`)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Group 1 (Numeric)</label>
          <Select value={col1} onValueChange={setCol1}>
            <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
            <SelectContent>
              {numericCols.map((c) => (
                <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Group 2 (Numeric)</label>
          <Select value={col2} onValueChange={setCol2}>
            <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
            <SelectContent>
              {numericCols.map((c) => (
                <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={compute} disabled={!col1 || !col2}>Run Independent T-Test</Button>
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

function PairedTTest({ data }: { data: Record<string, unknown>[] }) {
  const { columnMetadata, addActivity } = useDatasetStore()
  const [col1, setCol1] = useState('')
  const [col2, setCol2] = useState('')
  const [result, setResult] = useState<Record<string, number | string> | null>(null)

  const numericCols = columnMetadata.filter((c) => c.type === 'numeric')

  const compute = () => {
    if (!col1 || !col2) return
    const pairs: [number, number][] = data
      .map((r) => [Number(r[col1]), Number(r[col2])] as [number, number])
      .filter(([a, b]) => !isNaN(a) && !isNaN(b))
    if (pairs.length < 3) return

    const diffs = pairs.map(([a, b]) => a - b)
    const n = diffs.length
    const meanDiff = ss.mean(diffs)
    const stdDiff = ss.standardDeviation(diffs)
    const se = stdDiff / Math.sqrt(n)
    const tStat = meanDiff / se
    const df = n - 1
    const pValue = tTestPValue(Math.abs(tStat), df)

    setResult({
      'Mean Difference': meanDiff.toFixed(4),
      'Std Dev of Differences': stdDiff.toFixed(4),
      'Std Error': se.toFixed(4),
      't-Statistic': tStat.toFixed(4),
      'Degrees of Freedom': df,
      'p-value (two-tailed)': pValue.toFixed(6),
      'Sample Size (n)': n,
      'Significant (α=0.05)': pValue < 0.05 ? 'Yes' : 'No',
    })
    addActivity('Paired T-Test', `Paired t-test (t=${tStat.toFixed(3)}, p=${pValue.toFixed(4)})`)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Before (Numeric)</label>
          <Select value={col1} onValueChange={setCol1}>
            <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
            <SelectContent>
              {numericCols.map((c) => (
                <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">After (Numeric)</label>
          <Select value={col2} onValueChange={setCol2}>
            <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
            <SelectContent>
              {numericCols.map((c) => (
                <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={compute} disabled={!col1 || !col2}>Run Paired T-Test</Button>
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

function ANOVA({ data }: { data: Record<string, unknown>[] }) {
  const { columnMetadata, addActivity } = useDatasetStore()
  const [groupCol, setGroupCol] = useState('')
  const [valueCol, setValueCol] = useState('')
  const [result, setResult] = useState<Record<string, number | string> | null>(null)

  const numericCols = columnMetadata.filter((c) => c.type === 'numeric')
  const categCols = columnMetadata.filter((c) => c.type === 'categorical')

  const compute = () => {
    if (!groupCol || !valueCol) return
    const groups = new Map<string, number[]>()
    for (const row of data) {
      const g = String(row[groupCol])
      const v = Number(row[valueCol])
      if (!isNaN(v)) {
        if (!groups.has(g)) groups.set(g, [])
        groups.get(g)!.push(v)
      }
    }
    const groupArrays = Array.from(groups.values()).filter((arr) => arr.length >= 2)
    if (groupArrays.length < 2) return

    const allVals = groupArrays.flat()
    const grandMean = ss.mean(allVals)
    const totalN = allVals.length
    const k = groupArrays.length

    let ssBetween = 0
    let ssWithin = 0
    for (const arr of groupArrays) {
      const gm = ss.mean(arr)
      ssBetween += arr.length * (gm - grandMean) ** 2
      ssWithin += arr.reduce((sum, v) => sum + (v - gm) ** 2, 0)
    }

    const dfBetween = k - 1
    const dfWithin = totalN - k
    const msBetween = ssBetween / dfBetween
    const msWithin = ssWithin / dfWithin
    const fStat = msBetween / msWithin
    const pValue = fTestPValue(fStat, dfBetween, dfWithin)

    setResult({
      'Groups (k)': k,
      'Total N': totalN,
      'SS Between': ssBetween.toFixed(4),
      'SS Within': ssWithin.toFixed(4),
      'DF Between': dfBetween,
      'DF Within': dfWithin,
      'MS Between': msBetween.toFixed(4),
      'MS Within': msWithin.toFixed(4),
      'F-Statistic': fStat.toFixed(4),
      'p-value': pValue.toFixed(6),
      'Significant (α=0.05)': pValue < 0.05 ? 'Yes' : 'No',
    })
    addActivity('ANOVA', `One-way ANOVA F(${dfBetween},${dfWithin})=${fStat.toFixed(3)}, p=${pValue.toFixed(4)})`)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Grouping Column (Categorical)</label>
          <Select value={groupCol} onValueChange={setGroupCol}>
            <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
            <SelectContent>
              {categCols.map((c) => (
                <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Value Column (Numeric)</label>
          <Select value={valueCol} onValueChange={setValueCol}>
            <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
            <SelectContent>
              {numericCols.map((c) => (
                <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={compute} disabled={!groupCol || !valueCol}>Run ANOVA</Button>
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

function ChiSquareTests({ data }: { data: Record<string, unknown>[] }) {
  const { columnMetadata, addActivity } = useDatasetStore()
  const [mode, setMode] = useState<'goodness' | 'independence'>('goodness')
  const [col, setCol] = useState('')
  const [col2, setCol2] = useState('')
  const [result, setResult] = useState<Record<string, number | string> | null>(null)

  const categCols = columnMetadata.filter((c) => c.type === 'categorical')

  const computeGoodness = () => {
    if (!col) return
    const freq = new Map<string, number>()
    for (const row of data) {
      const v = String(row[col])
      freq.set(v, (freq.get(v) || 0) + 1)
    }
    const observed = Array.from(freq.values())
    const n = observed.reduce((a, b) => a + b, 0)
    const k = observed.length
    const expected = Array(k).fill(n / k)
    let chiSq = 0
    for (let i = 0; i < k; i++) {
      chiSq += (observed[i] - expected[i]) ** 2 / expected[i]
    }
    const df = k - 1
    const pValue = chiSquarePValue(chiSq, df)

    setResult({
      'Categories (k)': k,
      'Total N': n,
      'Chi-Square Statistic': chiSq.toFixed(4),
      'Degrees of Freedom': df,
      'p-value': pValue.toFixed(6),
      'Significant (α=0.05)': pValue < 0.05 ? 'Yes' : 'No',
      'Expected (uniform)': expected[0].toFixed(1),
    })
    addActivity('Chi-Square Goodness of Fit', `χ²(${df})=${chiSq.toFixed(3)}, p=${pValue.toFixed(4)})`)
  }

  const computeIndependence = () => {
    if (!col || !col2) return
    const table = new Map<string, Map<string, number>>()
    const rowTotals = new Map<string, number>()
    const colTotals = new Map<string, number>()
    let total = 0

    for (const row of data) {
      const r = String(row[col])
      const c = String(row[col2])
      if (!table.has(r)) table.set(r, new Map())
      table.get(r)!.set(c, (table.get(r)!.get(c) || 0) + 1)
      rowTotals.set(r, (rowTotals.get(r) || 0) + 1)
      colTotals.set(c, (colTotals.get(c) || 0) + 1)
      total++
    }

    const rows = Array.from(table.keys())
    const cols = Array.from(colTotals.keys())
    let chiSq = 0
    for (const r of rows) {
      for (const c of cols) {
        const observed = table.get(r)?.get(c) || 0
        const expected = (rowTotals.get(r)! * colTotals.get(c)!) / total
        if (expected > 0) {
          chiSq += (observed - expected) ** 2 / expected
        }
      }
    }

    const df = (rows.length - 1) * (cols.length - 1)
    const pValue = chiSquarePValue(chiSq, df)

    setResult({
      'Rows': rows.length,
      'Columns': cols.length,
      'Total N': total,
      'Chi-Square Statistic': chiSq.toFixed(4),
      'Degrees of Freedom': df,
      'p-value': pValue.toFixed(6),
      'Significant (α=0.05)': pValue < 0.05 ? 'Yes' : 'No',
    })
    addActivity('Chi-Square Independence', `χ²(${df})=${chiSq.toFixed(3)}, p=${pValue.toFixed(4)})`)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={mode === 'goodness' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('goodness')}
        >
          Goodness of Fit
        </Button>
        <Button
          variant={mode === 'independence' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('independence')}
        >
          Test of Independence
        </Button>
      </div>

      {mode === 'goodness' ? (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Categorical Column</label>
            <Select value={col} onValueChange={setCol}>
              <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
              <SelectContent>
                {categCols.map((c) => (
                  <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={computeGoodness} disabled={!col}>Run Goodness of Fit</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Row Variable</label>
              <Select value={col} onValueChange={setCol}>
                <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
                <SelectContent>
                  {categCols.map((c) => (
                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Column Variable</label>
              <Select value={col2} onValueChange={setCol2}>
                <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
                <SelectContent>
                  {categCols.map((c) => (
                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={computeIndependence} disabled={!col || !col2}>Run Independence Test</Button>
        </div>
      )}

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
    { value: 'ztest', label: 'Z-Test', icon: Zap, comp: <ZTest data={fullData} /> },
    { value: 'onesamplet', label: '1-Sample T', icon: Hash, comp: <OneSampleTTest data={fullData} /> },
    { value: 'independentsamplet', label: '2-Sample T', icon: ArrowRightLeft, comp: <IndependentTTest data={fullData} /> },
    { value: 'pairedt', label: 'Paired T', icon: ArrowRightLeft, comp: <PairedTTest data={fullData} /> },
    { value: 'anova', label: 'ANOVA', icon: Equal, comp: <ANOVA data={fullData} /> },
    { value: 'chisquare', label: 'Chi-Square', icon: Table, comp: <ChiSquareTests data={fullData} /> },
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
