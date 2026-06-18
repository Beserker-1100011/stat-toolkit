import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Layout } from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import DataUpload from '@/pages/DataUpload'
import StatisticsEngine from '@/pages/StatisticsEngine'
import MachineLearning from '@/pages/MachineLearning'
import VisualizationCenter from '@/pages/VisualizationCenter'
import Distributions from '@/pages/Distributions'
import DistributionSimulators from '@/pages/DistributionSimulators'
import CentralLimitTheorem from '@/pages/CentralLimitTheorem'
import TimeSeriesAnalysis from '@/pages/TimeSeriesAnalysis'
import TextAnalysis from '@/pages/TextAnalysis'
import NormalityToolkit from '@/pages/NormalityToolkit'
import ReportGenerator from '@/pages/ReportGenerator'
import AIInsights from '@/pages/AIInsights'
import CLIGuide from '@/pages/CLIGuide'

export default function App() {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="data" element={<DataUpload />} />
            <Route path="statistics" element={<StatisticsEngine />} />
            <Route path="ml" element={<MachineLearning />} />
            <Route path="viz" element={<VisualizationCenter />} />
            <Route path="distributions" element={<Distributions />} />
            <Route path="simulators" element={<DistributionSimulators />} />
            <Route path="clt" element={<CentralLimitTheorem />} />
            <Route path="timeseries" element={<TimeSeriesAnalysis />} />
            <Route path="normality" element={<NormalityToolkit />} />
            <Route path="report" element={<ReportGenerator />} />
            <Route path="text-analysis" element={<TextAnalysis />} />
            <Route path="insights" element={<AIInsights />} />
            <Route path="cli" element={<CLIGuide />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  )
}
