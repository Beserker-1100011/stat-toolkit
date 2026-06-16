import { useDatasetStore } from '@/store/datasetStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LayoutDashboard,
  Database,
  Columns3,
  Activity,
  FlaskConical,
} from 'lucide-react'

export default function Dashboard() {
  const { fullData, columnMetadata, activityLog, fileName } = useDatasetStore()

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
      value: fullData.length.toLocaleString(),
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
