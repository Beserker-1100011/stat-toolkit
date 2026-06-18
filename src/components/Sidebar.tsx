import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Upload,
  Sigma,
  Brain,
  BarChart3,
  Bell,
  Repeat,
  TrendingUp,
  FileText,
  Sparkles,
  Terminal,
  FlaskConical,
  Dice1,
  ClipboardCheck,
  FileSpreadsheet,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/data', icon: Upload, label: 'Data Upload' },
  { to: '/statistics', icon: Sigma, label: 'Statistics' },
  { to: '/ml', icon: Brain, label: 'Machine Learning' },
  { to: '/viz', icon: BarChart3, label: 'Visualizations' },
  { to: '/distributions', icon: Bell, label: 'Distributions' },
  { to: '/simulators', icon: Dice1, label: 'Simulators' },
  { to: '/clt', icon: Repeat, label: 'CLT Simulator' },
  { to: '/normality', icon: ClipboardCheck, label: 'Normality' },
  { to: '/timeseries', icon: TrendingUp, label: 'Time Series' },
  { to: '/text-analysis', icon: FileText, label: 'Text Analysis' },
  { to: '/report', icon: FileSpreadsheet, label: 'Report' },
  { to: '/insights', icon: Sparkles, label: 'AI Insights' },
  { to: '/cli', icon: Terminal, label: 'CLI Guide' },
]

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-glass-border bg-surface/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2.5 border-b border-glass-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
          <FlaskConical className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">
          Stat<span className="text-accent">Toolkit</span>
        </span>
      </div>
      <nav className="flex flex-col gap-1 p-4 overflow-y-auto h-[calc(100vh-4rem)]">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-accent/15 text-accent shadow-sm shadow-accent/5'
                  : 'text-white/60 hover:bg-white/5 hover:text-white/90'
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
