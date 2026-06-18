import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line, Area, AreaChart, ComposedChart,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDatasetStore } from '@/store/datasetStore'
import { ClipboardCheck } from 'lucide-react'
import * as ss from 'simple-statistics'
import { andersonDarling, kolmogorovSmirnovNormal, shapiroFrancia, jarqueBera, generateQQData } from '@/lib/stats'

function Histogram({ vals }: { vals: number[] }) {
  const bins = 30
  const min = Math.min(...vals), max = Math.max(...vals)
  const bw = (max - min) / bins || 1
  const hist = Array.from({ length: bins }, (_, i) => {
    const lo = min + i * bw, hi = lo + bw
    const count = vals.filter((v) => v >= lo && (i === bins - 1 ? v <= hi : v < hi)).length
    return { bin: `${lo.toFixed(1)}–${hi.toFixed(1)}`, count }
  })

  const mean = ss.mean(vals), std = ss.standardDeviation(vals)
  const density = hist.map((h) => {
    const x = min + hist.indexOf(h) * bw + bw / 2
    const pdf = (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mean) / std) ** 2)
    return { ...h, pdf: pdf * vals.length * bw }
  })

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={density}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="bin" tick={{ fill: '#8b8fa3', fontSize: 10 }} interval={Math.max(1, Math.floor(bins / 8))} />
          <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} />
          <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff' }} />
          <Bar dataKey="count" fill="#6366f1" radius={[2, 2, 0, 0]} opacity={0.6} />
          <Line type="monotone" dataKey="pdf" stroke="#ef4444" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

function QQPlot({ vals }: { vals: number[] }) {
  const qq = useMemo(() => generateQQData(vals), [vals])
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="theoretical" tick={{ fill: '#8b8fa3', fontSize: 12 }} label={{ value: 'Theoretical Quantiles', fill: '#8b8fa3', fontSize: 12, position: 'bottom', offset: -5 }} />
          <YAxis dataKey="observed" tick={{ fill: '#8b8fa3', fontSize: 12 }} label={{ value: 'Observed Values', fill: '#8b8fa3', fontSize: 12, angle: -90, position: 'left', offset: 0 }} />
          <Tooltip contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff' }} />
          <Scatter data={qq} fill="#14b8a6" opacity={0.7} />
          <Line type="monotone" data={[{ theoretical: qq[0]?.theoretical || 0, observed: qq[0]?.observed || 0 }, { theoretical: qq[qq.length - 1]?.theoretical || 0, observed: qq[qq.length - 1]?.observed || 0 }]} dataKey="observed" stroke="#ef4444" strokeWidth={2} dot={false} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function NormalityToolkit() {
  const { fullData, columnMetadata, addActivity } = useDatasetStore()
  const [col, setCol] = useState('')
  const numericCols = columnMetadata.filter((c) => c.type === 'numeric')

  const vals = useMemo(() => {
    if (!col) return []
    return fullData.map((r) => Number(r[col])).filter((v) => !isNaN(v))
  }, [fullData, col])

  const tests = useMemo(() => {
    if (vals.length < 5) return null
    const sf = shapiroFrancia(vals)
    const ad = andersonDarling(vals)
    const ks = kolmogorovSmirnovNormal(vals)
    const jb = jarqueBera(vals)
    const sfNormal = sf.pValue > 0.05
    const adNormal = ad.normal
    const ksNormal = ks.pValue > 0.05
    const jbNormal = jb.pValue > 0.05
    const normalCount = [sfNormal, adNormal, ksNormal, jbNormal].filter(Boolean).length
    const conclusion = normalCount >= 3
      ? 'Data appears normally distributed (majority of tests agree)'
      : normalCount >= 1
      ? 'Data marginally deviates from normality (mixed test results)'
      : 'Data violates normality assumption (majority of tests reject)'
    return { sf, ad, ks, jb, sfNormal, adNormal, ksNormal, jbNormal, conclusion }
  }, [vals])

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
          <ClipboardCheck className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Normality Toolkit</h1>
          <p className="text-sm text-muted">Histogram, QQ Plot, Shapiro-Francia, Anderson-Darling, KS & Jarque-Bera tests</p>
        </div>
      </div>

      {fullData.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted">Upload a dataset first.</CardContent></Card>
      ) : (
        <div className="space-y-6">
          <div className="max-w-xs">
            <label className="mb-1.5 block text-xs font-medium text-muted">Numeric Column</label>
            <Select value={col} onValueChange={(v) => { setCol(v); addActivity('Normality', `Selected column "${v}"`) }}>
              <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
              <SelectContent>
                {numericCols.map((c) => (<SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          {vals.length >= 5 && (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Histogram + Fitted Normal</CardTitle></CardHeader>
                  <CardContent><Histogram vals={vals} /></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">QQ Plot</CardTitle></CardHeader>
                  <CardContent><QQPlot vals={vals} /></CardContent>
                </Card>
              </div>

              {tests && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Normality Tests</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="overflow-x-auto rounded-xl border border-glass-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-glass-border bg-white/[0.02]">
                            <th className="px-4 py-3 text-left text-muted">Test</th>
                            <th className="px-4 py-3 text-left text-muted">Statistic</th>
                            <th className="px-4 py-3 text-left text-muted">p-value</th>
                            <th className="px-4 py-3 text-left text-muted">Normal?</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { name: 'Shapiro-Francia (W)', stat: tests.sf.W.toFixed(4), pv: tests.sf.pValue, normal: tests.sfNormal },
                            { name: 'Anderson-Darling (A²)', stat: tests.ad.A2.toFixed(4), pv: tests.ad.pValue, normal: tests.adNormal },
                            { name: 'Kolmogorov-Smirnov (D)', stat: tests.ks.D.toFixed(4), pv: tests.ks.pValue, normal: tests.ksNormal },
                            { name: 'Jarque-Bera (JB)', stat: tests.jb.JB.toFixed(4), pv: tests.jb.pValue, normal: tests.jbNormal },
                          ].map((t) => (
                            <tr key={t.name} className="border-b border-glass-border last:border-0">
                              <td className="px-4 py-2.5 text-white">{t.name}</td>
                              <td className="px-4 py-2.5 font-mono text-white">{t.stat}</td>
                              <td className="px-4 py-2.5 font-mono text-white">{t.pv.toFixed(6)}</td>
                              <td className="px-4 py-2.5">
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${t.normal ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                  {t.normal ? 'Yes' : 'No'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="rounded-xl border border-glass-border bg-white/[0.02] px-5 py-4">
                      <p className="text-xs font-medium text-muted">Automatic Conclusion</p>
                      <p className={`mt-1 text-sm font-semibold ${tests.sfNormal && tests.adNormal ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {tests.conclusion}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
