import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDatasetStore } from '@/store/datasetStore'
import { FileText } from 'lucide-react'

export default function TextAnalysis() {
  const { fullData, columnMetadata, addActivity } = useDatasetStore()
  const [col, setCol] = useState('')

  const catCols = columnMetadata.filter((c) => c.type === 'categorical')

  const keywords = useMemo(() => {
    if (!col) return []
    const freq: Record<string, number> = {}
    for (const row of fullData) {
      const text = String(row[col] ?? '')
      const words = text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2)
      for (const word of words) {
        freq[word] = (freq[word] || 0) + 1
      }
    }
    return Object.entries(freq)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
  }, [fullData, col])

  const handleSelect = (value: string) => {
    setCol(value)
    if (value) {
      addActivity('Text Analysis', `Extracted top keywords from "${value}"`)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Text Analysis</h1>
          <p className="text-sm text-muted">NLP keyword extraction & frequency counting</p>
        </div>
      </div>

      {fullData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted">
            Upload a dataset first to analyze text.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="max-w-xs">
                <label className="mb-1.5 block text-xs font-medium text-muted">Text Column</label>
                <Select value={col} onValueChange={handleSelect}>
                  <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
                  <SelectContent>
                    {catCols.map((c) => (
                      <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {keywords.length > 0 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Top 20 Keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={keywords} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis type="number" tick={{ fill: '#8b8fa3', fontSize: 12 }} />
                        <YAxis type="category" dataKey="word" tick={{ fill: '#8b8fa3', fontSize: 11 }} width={120} />
                        <Tooltip
                          contentStyle={{
                            background: 'rgba(15,15,26,0.95)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: 12,
                            color: '#fff',
                          }}
                        />
                        <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Frequency Table</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-xl border border-glass-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-glass-border bg-white/[0.02]">
                          <th className="px-4 py-3 text-left font-medium text-muted">#</th>
                          <th className="px-4 py-3 text-left font-medium text-muted">Word</th>
                          <th className="px-4 py-3 text-left font-medium text-muted">Frequency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {keywords.map((kw, i) => (
                          <tr key={kw.word} className="border-b border-glass-border last:border-0 hover:bg-white/[0.02]">
                            <td className="px-4 py-2.5 text-muted">{i + 1}</td>
                            <td className="px-4 py-2.5 font-mono text-white">{kw.word}</td>
                            <td className="px-4 py-2.5 text-white">{kw.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
