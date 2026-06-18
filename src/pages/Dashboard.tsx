import { useDatasetStore } from '@/store/datasetStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LayoutDashboard,
  Database,
  Columns3,
  Activity,
  FlaskConical,
  Table,
  AlertTriangle,
} from 'lucide-react'

export default function Dashboard() {
  const { fullData, columnMetadata, activityLog, fileName, totalRows } = useDatasetStore()

  const numericCount = columnMetadata.filter((c) => c.type === 'numeric').length
  const categCount = columnMetadata.filter((c) => c.type === 'categorical').length
  const unknownCount = columnMetadata.filter((c) => c.type === 'unknown').length
  const totalMissing = columnMetadata.reduce((s, c) => s + c.missingCount, 0)
  const missingPct = fullData.length > 0 ? ((totalMissing / (fullData.length * columnMetadata.length)) * 100).toFixed(1) : '0'

  const stats = [
    {
      label: 'Dataset',
      value: fileName ?? 'No file loaded',
      icon: Database,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
    {
      label: 'Rows in Memory',
      value: totalRows.toLocaleString(),
      icon: LayoutDashboard,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Columns',
      value: columnMetadata.length.toString(),
      icon: Columns3,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'Activities Logged',
      value: activityLog.length.toString(),
      icon: Activity,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
          <FlaskConical className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-muted">Overview of your statistical workspace</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-start gap-4 pt-6">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted">{s.label}</p>
                <p className="truncate text-lg font-semibold text-white">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {fullData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Dataset Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-glass-border bg-white/[0.02] px-4 py-3">
                <p className="text-xs text-muted">Numeric Columns</p>
                <p className="mt-0.5 text-lg font-semibold text-white">{numericCount}</p>
              </div>
              <div className="rounded-xl border border-glass-border bg-white/[0.02] px-4 py-3">
                <p className="text-xs text-muted">Categorical Columns</p>
                <p className="mt-0.5 text-lg font-semibold text-white">{categCount}</p>
              </div>
              <div className="rounded-xl border border-glass-border bg-white/[0.02] px-4 py-3">
                <p className="text-xs text-muted">Unknown Type</p>
                <p className="mt-0.5 text-lg font-semibold text-white">{unknownCount}</p>
              </div>
              <div className="rounded-xl border border-glass-border bg-white/[0.02] px-4 py-3">
                <p className="text-xs text-muted">Missing Values</p>
                <p className="mt-0.5 text-lg font-semibold text-white">{totalMissing} ({missingPct}%)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {fullData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Column Details</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-glass-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-glass-border bg-white/[0.02]">
                    <th className="px-4 py-3 text-left text-muted">Column</th>
                    <th className="px-4 py-3 text-left text-muted">Type</th>
                    <th className="px-4 py-3 text-left text-muted">Missing</th>
                  </tr>
                </thead>
                <tbody>
                  {columnMetadata.map((c) => (
                    <tr key={c.name} className="border-b border-glass-border last:border-0">
                      <td className="px-4 py-2.5 text-white">{c.name}</td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c.type === 'numeric' ? 'bg-emerald-500/20 text-emerald-400' : c.type === 'categorical' ? 'bg-violet-500/20 text-violet-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {c.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-white/70">{c.missingCount} {c.missingCount > 0 && <AlertTriangle className="ml-1 inline h-3 w-3 text-amber-400" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLog.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              No activity yet. Upload a dataset to get started.
            </p>
          ) : (
            <div className="space-y-0">
              {activityLog.slice(0, 20).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 border-b border-glass-border py-3 last:border-0"
                >
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{entry.action}</p>
                    <p className="text-xs text-muted">{entry.details}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
