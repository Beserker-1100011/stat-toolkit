import { useState, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDatasetStore } from '@/store/datasetStore'
import { Brain, Layers, ScatterChart } from 'lucide-react'
import * as ss from 'simple-statistics'

function KMeans({ data }: { data: Record<string, unknown>[] }) {
  const { columnMetadata, addActivity } = useDatasetStore()
  const [xCol, setXCol] = useState('')
  const [yCol, setYCol] = useState('')
  const [k, setK] = useState(3)
  const [clusters, setClusters] = useState<{ x: number; y: number; cluster: number }[] | null>(null)

  const numericCols = columnMetadata.filter((c) => c.type === 'numeric')

  const compute = () => {
    if (!xCol || !yCol) return
    const points: [number, number][] = data
      .map((r) => [Number(r[xCol]), Number(r[yCol])] as [number, number])
      .filter(([a, b]) => !isNaN(a) && !isNaN(b))

    if (points.length < k || points.length === 0) return

    const centroids = points.slice(0, k).map((p) => [...p] as [number, number])
    const maxIter = 100
    let assignments = new Array(points.length).fill(0)

    for (let iter = 0; iter < maxIter; iter++) {
      const newAssignments = points.map((p) => {
        let minDist = Infinity
        let best = 0
        for (let c = 0; c < k; c++) {
          const dist = Math.sqrt((p[0] - centroids[c][0]) ** 2 + (p[1] - centroids[c][1]) ** 2)
          if (dist < minDist) { minDist = dist; best = c }
        }
        return best
      })

      let changed = false
      for (let i = 0; i < points.length; i++) {
        if (newAssignments[i] !== assignments[i]) { changed = true; break }
      }
      assignments = newAssignments

      const sums = Array.from({ length: k }, () => [0, 0, 0] as [number, number, number])
      for (let i = 0; i < points.length; i++) {
        sums[assignments[i]][0] += points[i][0]
        sums[assignments[i]][1] += points[i][1]
        sums[assignments[i]][2]++
      }
      for (let c = 0; c < k; c++) {
        if (sums[c][2] > 0) {
          centroids[c] = [sums[c][0] / sums[c][2], sums[c][1] / sums[c][2]]
        }
      }

      if (!changed) break
    }

    const result = points.map((p, i) => ({ x: p[0], y: p[1], cluster: assignments[i] }))
    setClusters(result)
    addActivity('K-Means Clustering', `K-Means with K=${k} on "${xCol}" & "${yCol}" — ${points.length} points`)
  }

  const colors = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#22d3ee', '#84cc16']

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">X Column</label>
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
          <label className="mb-1.5 block text-xs font-medium text-muted">Y Column</label>
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
          <label className="mb-1.5 block text-xs font-medium text-muted">K Clusters</label>
          <div className="flex items-center gap-2">
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setK(n)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  k === n
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-glass-border text-white/60 hover:border-accent/50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Button onClick={compute} disabled={!xCol || !yCol}>Run K-Means</Button>
      {clusters && (
        <div className="rounded-xl border border-glass-border bg-white/[0.02] p-4">
          <div className="relative h-80 w-full">
            <svg viewBox="0 0 600 400" className="h-full w-full">
              {clusters.map((p, i) => (
                <circle
                  key={i}
                  cx={20 + (p.x - Math.min(...clusters.map((c) => c.x))) / (Math.max(...clusters.map((c) => c.x)) - Math.min(...clusters.map((c) => c.x)) || 1) * 560}
                  cy={380 - (p.y - Math.min(...clusters.map((c) => c.y))) / (Math.max(...clusters.map((c) => c.y)) - Math.min(...clusters.map((c) => c.y)) || 1) * 360}
                  r={4}
                  fill={colors[p.cluster % colors.length]}
                  opacity={0.8}
                />
              ))}
            </svg>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Array.from({ length: k }).map((_, i) => (
              <Badge key={i} style={{ backgroundColor: colors[i] + '30', color: colors[i], borderColor: colors[i] + '50' }}>
                Cluster {i + 1}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PCA({ data }: { data: Record<string, unknown>[] }) {
  const { columnMetadata, addActivity } = useDatasetStore()
  const [components, setComponents] = useState<{ pc1: number; pc2: number }[] | null>(null)
  const [selectedCols, setSelectedCols] = useState<string[]>([])

  const numericCols = columnMetadata.filter((c) => c.type === 'numeric')

  const toggle = (col: string) => {
    setSelectedCols((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    )
  }

  const compute = () => {
    if (selectedCols.length < 2) return

    const matrix = data.map((row) =>
      selectedCols.map((c) => Number(row[c])).filter((v) => !isNaN(v))
    ).filter((row) => row.length === selectedCols.length)

    if (matrix.length < 3) return

    const n = matrix.length
    const means = selectedCols.map((_, j) => ss.mean(matrix.map((r) => r[j])))
    const centered = matrix.map((row) => row.map((v, j) => v - means[j]))

    const cov: number[][] = selectedCols.map((_, i) =>
      selectedCols.map((_, j) => {
        if (i === j) {
          return centered.reduce((sum, row) => sum + row[i] ** 2, 0) / n - centered.reduce((sum, row) => sum + row[i], 0) ** 2 / (n * n)
        }
        return centered.reduce((sum, row) => sum + row[i] * row[j], 0) / n
      })
    )

    const eig1 = [1, 0]
    for (let iter = 0; iter < 100; iter++) {
      const v0 = eig1[0], v1 = eig1[1]
      const w0 = cov[0][0] * v0 + cov[0][1] * v1
      const w1 = cov[1][0] * v0 + cov[1][1] * v1
      const norm = Math.sqrt(w0 * w0 + w1 * w1)
      if (norm < 1e-10) break
      eig1[0] = w0 / norm
      eig1[1] = w1 / norm
      if (Math.abs(eig1[0] - v0) < 1e-6 && Math.abs(eig1[1] - v1) < 1e-6) break
    }

    const projected = centered.map((row) => ({
      pc1: row[0] * eig1[0] + row[1] * eig1[1],
      pc2: row[0] * (-eig1[1]) + row[1] * eig1[0],
    }))

    setComponents(projected)
    addActivity('PCA', `PCA on ${selectedCols.length} columns — ${projected.length} points projected`)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Select 2+ numeric columns for PCA projection:</p>
      <div className="flex flex-wrap gap-2">
        {numericCols.map((c) => (
          <button
            key={c.name}
            onClick={() => toggle(c.name)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              selectedCols.includes(c.name)
                ? 'border-accent bg-accent/15 text-accent'
                : 'border-glass-border text-white/60 hover:border-accent/50'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
      <Button onClick={compute} disabled={selectedCols.length < 2}>Run PCA</Button>
      {components && (
        <div className="rounded-xl border border-glass-border bg-white/[0.02] p-4">
          <div className="relative h-80 w-full">
            <svg viewBox="0 0 600 400" className="h-full w-full">
              {components.map((p, i) => {
                const xs = components.map((c) => c.pc1)
                const ys = components.map((c) => c.pc2)
                const minX = Math.min(...xs); const maxX = Math.max(...xs)
                const minY = Math.min(...ys); const maxY = Math.max(...ys)
                return (
                  <circle
                    key={i}
                    cx={20 + (p.pc1 - minX) / (maxX - minX || 1) * 560}
                    cy={380 - (p.pc2 - minY) / (maxY - minY || 1) * 360}
                    r={4}
                    fill="#6366f1"
                    opacity={0.7}
                  />
                )
              })}
            </svg>
          </div>
          <p className="mt-2 text-center text-xs text-muted">PC1 (horizontal) × PC2 (vertical)</p>
        </div>
      )}
    </div>
  )
}

export default function MachineLearning() {
  const { fullData, computeData } = useDatasetStore()

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Machine Learning</h1>
          <p className="text-sm text-muted">K-Means Clustering & Principal Component Analysis</p>
        </div>
      </div>

      {fullData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted">
            Upload a dataset first to access ML modules.
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="kmeans">
          <TabsList>
            <TabsTrigger value="kmeans" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              K-Means
            </TabsTrigger>
            <TabsTrigger value="pca" className="flex items-center gap-2">
              <ScatterChart className="h-4 w-4" />
              PCA
            </TabsTrigger>
          </TabsList>
          <TabsContent value="kmeans">
            <Card><CardContent className="pt-6"><KMeans data={computeData} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="pca">
            <Card><CardContent className="pt-6"><PCA data={computeData} /></CardContent></Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
