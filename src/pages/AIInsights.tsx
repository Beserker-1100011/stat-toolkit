import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDatasetStore } from '@/store/datasetStore'
import { Sparkles, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import * as ss from 'simple-statistics'

export default function AIInsights() {
  const { fullData, computeData, columnMetadata, fileName } = useDatasetStore()

  const report = useMemo(() => {
    if (fullData.length === 0 || columnMetadata.length === 0) return null

    const numericCols = columnMetadata.filter((c) => c.type === 'numeric')
    const catCols = columnMetadata.filter((c) => c.type === 'categorical')
    const totalMissing = columnMetadata.reduce((s, c) => s + c.missingCount, 0)
    const totalCells = fullData.length * columnMetadata.length

    const anomalies: string[] = []
    const stats: { col: string; mean: string; std: string; min: string; max: string }[] = []

    for (const col of numericCols) {
      const vals = computeData.map((r) => Number(r[col.name])).filter((v) => !isNaN(v))
      if (vals.length < 2) continue

      const mean = ss.mean(vals)
      const std = ss.standardDeviation(vals)
      const min = Math.min(...vals)
      const max = Math.max(...vals)
      stats.push({
        col: col.name,
        mean: mean.toFixed(2),
        std: std.toFixed(2),
        min: min.toFixed(2),
        max: max.toFixed(2),
      })

      const outliers = vals.filter((v) => Math.abs(v - mean) > 3 * std).length
      if (outliers > 0) {
        anomalies.push(
          `"${col.name}": ${outliers} outlier${outliers > 1 ? 's' : ''} detected (>3σ from mean)`
        )
      }

      if (std < 0.01 * Math.abs(mean) && mean !== 0) {
        anomalies.push(`"${col.name}": Near-zero variance (possibly constant column)`)
      }
    }

    const sections: string[] = [
      `## Executive Summary`,
      `**Dataset:** ${fileName ?? 'Unnamed'}`,
      `**Rows:** ${fullData.length.toLocaleString()} | **Columns:** ${columnMetadata.length} (${numericCols.length} numeric, ${catCols.length} categorical)`,
      `**Missing Data:** ${totalMissing.toLocaleString()} of ${totalCells.toLocaleString()} cells (${(totalMissing / Math.max(1, totalCells) * 100).toFixed(1)}%)`,
      ``,
      `## Statistical Overview`,
    ]

    for (const s of stats) {
      sections.push(
        `**${s.col}:** μ=${s.mean}, σ=${s.std}, range=[${s.min}, ${s.max}]`
      )
    }

    if (anomalies.length > 0) {
      sections.push(``, `## ⚠ Anomalies Detected`, ...anomalies.map((a) => `- ${a}`))
    }

    sections.push(
      ``,
      `## Recommendations`,
      numericCols.length >= 2
        ? `- Run correlation analysis on numeric columns`
        : `- Upload more numeric columns for richer analysis`,
      catCols.length > 0
        ? `- Explore categorical distributions via the PMF chart`
        : `- Categorical data can reveal group patterns`,
      fullData.length > 50
        ? `- Use the CLT Simulator to prove the Central Limit Theorem`
        : `- Collect more data (50+ rows) for robust CLT simulation`,
    )

    return { text: sections.join('\n'), anomalies, stats }
  }, [fullData, columnMetadata, fileName])

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">AI Insights</h1>
          <p className="text-sm text-muted">Automated executive summary & anomaly detection</p>
        </div>
      </div>

      {!report ? (
        <Card>
          <CardContent className="py-12 text-center text-muted">
            Upload a dataset first to generate AI insights.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {report.anomalies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Anomalies Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.anomalies.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3"
                    >
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      <span className="text-sm text-white/80">{a}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                Executive Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap rounded-xl border border-glass-border bg-black/30 p-6 font-mono text-sm leading-relaxed text-white/90">
                {report.text}
              </pre>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card text-center">
              <CheckCircle className="mx-auto mb-2 h-6 w-6 text-emerald-400" />
              <p className="text-2xl font-bold text-white">{fullData.length.toLocaleString()}</p>
              <p className="text-xs text-muted">Total Rows</p>
            </div>
            <div className="card text-center">
              <CheckCircle className="mx-auto mb-2 h-6 w-6 text-indigo-400" />
              <p className="text-2xl font-bold text-white">{columnMetadata.length}</p>
              <p className="text-xs text-muted">Total Columns</p>
            </div>
            <div className="card text-center">
              <CheckCircle className="mx-auto mb-2 h-6 w-6 text-violet-400" />
              <p className="text-2xl font-bold text-white">{report.stats.length}</p>
              <p className="text-xs text-muted">Numeric Features</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
