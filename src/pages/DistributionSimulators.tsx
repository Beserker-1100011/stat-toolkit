import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dice1 } from 'lucide-react'
import * as ss from 'simple-statistics'

function factorial(n: number): number {
  if (n <= 1) return 1
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}

function nCk(n: number, k: number): number {
  if (k < 0 || k > n) return 0
  return factorial(n) / (factorial(k) * factorial(n - k))
}

function BernoulliSim() {
  const [p, setP] = useState(0.5)
  const pmf = useMemo(() => [
    { x: '0 (Failure)', prob: 1 - p },
    { x: '1 (Success)', prob: p },
  ], [p])
  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <label className="mb-1.5 block text-xs font-medium text-muted">Success Probability (p)</label>
        <Input type="number" min={0} max={1} step={0.05} value={p} onChange={(e) => setP(Number(e.target.value))} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Mean" value={p.toFixed(4)} />
        <StatCard label="Variance" value={(p * (1 - p)).toFixed(4)} />
        <StatCard label="Std Dev" value={Math.sqrt(p * (1 - p)).toFixed(4)} />
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={pmf}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="x" tick={{ fill: '#8b8fa3', fontSize: 12 }} />
            <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff' }} />
            <Bar dataKey="prob" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function BinomialSim() {
  const [n, setN] = useState(10)
  const [p, setP] = useState(0.5)
  const pmf = useMemo(() => {
    const data = Array.from({ length: n + 1 }, (_, k) => ({
      x: String(k),
      prob: nCk(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k),
    }))
    return data
  }, [n, p])
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="mb-1.5 block text-xs font-medium text-muted">Trials (n)</label><Input type="number" min={1} max={100} value={n} onChange={(e) => setN(Number(e.target.value))} /></div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted">Probability (p)</label><Input type="number" min={0} max={1} step={0.05} value={p} onChange={(e) => setP(Number(e.target.value))} /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Mean" value={(n * p).toFixed(4)} />
        <StatCard label="Variance" value={(n * p * (1 - p)).toFixed(4)} />
        <StatCard label="Std Dev" value={Math.sqrt(n * p * (1 - p)).toFixed(4)} />
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={pmf}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="x" tick={{ fill: '#8b8fa3', fontSize: 12 }} />
            <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff' }} />
            <Bar dataKey="prob" fill="#a855f7" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function PoissonSim() {
  const [lambda, setLambda] = useState(3)
  const maxK = Math.min(30, Math.ceil(lambda + 4 * Math.sqrt(lambda)))
  const pmf = useMemo(() => {
    return Array.from({ length: maxK + 1 }, (_, k) => ({
      x: String(k),
      prob: Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k),
    }))
  }, [lambda, maxK])
  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <label className="mb-1.5 block text-xs font-medium text-muted">Rate (λ)</label>
        <Input type="number" min={0.1} max={50} step={0.5} value={lambda} onChange={(e) => setLambda(Number(e.target.value))} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Mean (λ)" value={lambda.toFixed(4)} />
        <StatCard label="Variance (λ)" value={lambda.toFixed(4)} />
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={pmf}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="x" tick={{ fill: '#8b8fa3', fontSize: 12 }} />
            <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff' }} />
            <Bar dataKey="prob" fill="#14b8a6" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function UniformSim() {
  const [min, setMin] = useState(0)
  const [max, setMax] = useState(10)
  const pdf = useMemo(() => {
    const step = (max - min) / 80
    return Array.from({ length: 81 }, (_, i) => {
      const x = min + i * step
      return { x: x.toFixed(2), pdf: x >= min && x <= max ? 1 / (max - min) : 0 }
    })
  }, [min, max])
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="mb-1.5 block text-xs font-medium text-muted">Min (a)</label><Input type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} /></div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted">Max (b)</label><Input type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Mean" value={((min + max) / 2).toFixed(4)} />
        <StatCard label="Variance" value={((max - min) ** 2 / 12).toFixed(4)} />
        <StatCard label="Std Dev" value={Math.sqrt((max - min) ** 2 / 12).toFixed(4)} />
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={pdf}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="x" tick={{ fill: '#8b8fa3', fontSize: 10 }} />
            <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff' }} />
            <Area type="step" dataKey="pdf" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function NormalSim() {
  const [mean, setMean] = useState(0)
  const [std, setStd] = useState(1)
  const pdf = useMemo(() => {
    const lo = mean - 4 * std, hi = mean + 4 * std
    const step = (hi - lo) / 80
    return Array.from({ length: 81 }, (_, i) => {
      const x = lo + i * step
      const p = (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mean) / std) ** 2)
      return { x: x.toFixed(2), pdf: p }
    })
  }, [mean, std])
  const rule68 = (mean - std).toFixed(2)
  const rule95lo = (mean - 2 * std).toFixed(2)
  const rule95hi = (mean + 2 * std).toFixed(2)
  const rule997lo = (mean - 3 * std).toFixed(2)
  const rule997hi = (mean + 3 * std).toFixed(2)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="mb-1.5 block text-xs font-medium text-muted">Mean (μ)</label><Input type="number" value={mean} onChange={(e) => setMean(Number(e.target.value))} /></div>
        <div><label className="mb-1.5 block text-xs font-medium text-muted">Std Dev (σ)</label><Input type="number" min={0.01} value={std} onChange={(e) => setStd(Number(e.target.value))} /></div>
      </div>
      <div className="rounded-xl border border-glass-border bg-white/[0.02] px-5 py-4">
        <p className="text-xs font-medium text-muted mb-2">68–95–99.7 Rule</p>
        <ul className="space-y-1 text-sm text-white/80">
          <li>≈68% of data within <span className="font-mono text-white">{rule68}</span> to <span className="font-mono text-white">{(mean + std).toFixed(2)}</span> (μ ± 1σ)</li>
          <li>≈95% of data within <span className="font-mono text-white">{rule95lo}</span> to <span className="font-mono text-white">{rule95hi}</span> (μ ± 2σ)</li>
          <li>≈99.7% of data within <span className="font-mono text-white">{rule997lo}</span> to <span className="font-mono text-white">{rule997hi}</span> (μ ± 3σ)</li>
        </ul>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={pdf}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="x" tick={{ fill: '#8b8fa3', fontSize: 10 }} />
            <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff' }} />
            <Area type="monotone" dataKey="pdf" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ExponentialSim() {
  const [rate, setRate] = useState(0.5)
  const pdf = useMemo(() => {
    const maxX = 8 / rate
    const step = maxX / 80
    return Array.from({ length: 81 }, (_, i) => {
      const x = i * step
      return { x: x.toFixed(2), pdf: rate * Math.exp(-rate * x) }
    })
  }, [rate])
  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <label className="mb-1.5 block text-xs font-medium text-muted">Rate (λ)</label>
        <Input type="number" min={0.01} max={10} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Mean (1/λ)" value={(1 / rate).toFixed(4)} />
        <StatCard label="Variance (1/λ²)" value={(1 / (rate * rate)).toFixed(4)} />
        <StatCard label="Std Dev" value={(1 / rate).toFixed(4)} />
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={pdf}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="x" tick={{ fill: '#8b8fa3', fontSize: 10 }} />
            <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff' }} />
            <Area type="monotone" dataKey="pdf" stroke="#ec4899" fill="#ec4899" fillOpacity={0.2} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-glass-border bg-white/[0.02] px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
    </div>
  )
}

export default function DistributionSimulators() {
  const tabs = [
    { value: 'bernoulli', label: 'Bernoulli', comp: <BernoulliSim /> },
    { value: 'binomial', label: 'Binomial', comp: <BinomialSim /> },
    { value: 'poisson', label: 'Poisson', comp: <PoissonSim /> },
    { value: 'uniform', label: 'Uniform', comp: <UniformSim /> },
    { value: 'normal', label: 'Normal', comp: <NormalSim /> },
    { value: 'exponential', label: 'Exponential', comp: <ExponentialSim /> },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
          <Dice1 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Distribution Simulators</h1>
          <p className="text-sm text-muted">Interactive Bernoulli, Binomial, Poisson, Uniform, Normal & Exponential distributions</p>
        </div>
      </div>

      <Tabs defaultValue="bernoulli">
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="flex items-center gap-2">
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
    </div>
  )
}
