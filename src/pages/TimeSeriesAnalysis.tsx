import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDatasetStore } from '@/store/datasetStore'
import { TrendingUp } from 'lucide-react'
import * as ss from 'simple-statistics'

export default function TimeSeriesAnalysis() {
  const { fullData, columnMetadata, addActivity } = useDatasetStore()
  const [col, setCol] = useState('')

  const numericCols = columnMetadata.filter((c) => c.type === 'numeric')

  const forecastData = useMemo(() => {
    if (!col) return []
    const vals = fullData
      .map((r, i) => ({ index: i, value: Number(r[col]) }))
      .filter((v) => !isNaN(v.value))
    if (vals.length < 3) return []

    const points: [number, number][] = vals.map((v) => [v.index, v.value])
    const { m: slope, b: intercept } = ss.linearRegression(points)
    const lineFn = ss.linearRegressionLine({ m: slope, b: intercept })

    return vals.map((v) => ({
      index: v.index,
      actual: v.value,
      trend: lineFn(v.index),
    }))
  }, [fullData, col])

  const handleCompute = () => {
    if (col) {
      addActivity('Time Series', `Linear trend forecast on "${col}"`)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Time Series Analysis</h1>
          <p className="text-sm text-muted">Linear trend forecasting over time index</p>
        </div>
      </div>

      {fullData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted">
            Upload a dataset first to run time series analysis.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
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
                <Button onClick={handleCompute} disabled={!col}>Forecast</Button>
              </div>
            </CardContent>
          </Card>

          {forecastData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Actual vs Linear Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="index" tick={{ fill: '#8b8fa3', fontSize: 12 }} label={{ value: 'Time Index', position: 'insideBottom', offset: -5, fill: '#8b8fa3' }} />
                      <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(15,15,26,0.95)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 12,
                          color: '#fff',
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="actual" stroke="#6366f1" strokeWidth={1.5} dot={false} name="Actual" />
                      <Line type="monotone" dataKey="trend" stroke="#ec4899" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Linear Trend" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
