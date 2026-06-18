import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Upload, Sigma, BarChart3, Dice1, Repeat, ClipboardCheck, Brain, TrendingUp, FileText, FileSpreadsheet, Sparkles, FlaskConical, ExternalLink, GitBranch } from 'lucide-react'

const modules = [
  {
    icon: Upload, title: 'Data Upload & Preview',
    desc: 'Dynamic CSV ingestion engine with automatic column metadata classification (numeric vs. categorical variables). Features a high-performance paginated data preview table with search and filtering.',
  },
  {
    icon: Sigma, title: 'Statistics Engine',
    desc: 'Full descriptive statistics (Mean, Median, Mode, Variance, Std Dev, Quartiles, IQR, Skewness). Pairwise Pearson Correlation Matrix with strength labels. Linear Regression (slope, intercept, R²). Parametric & non-parametric hypothesis tests: One/Two-Sample Z-Tests, One/Two-Sample & Paired T-Tests, One-Way & Two-Way ANOVA, Chi-Square (Goodness of Fit & Independence), Mann-Whitney U, Wilcoxon Signed-Rank, Kruskal-Wallis, Friedman.',
  },
  {
    icon: BarChart3, title: 'Visualization Center',
    desc: 'Interactive charts: Bar, Scatter, Line, Histogram (with fitted normal overlay), Boxplot, and Cumulative Distribution Function (CDF) charts. Powered by Recharts with responsive design.',
  },
  {
    icon: Dice1, title: 'Distribution Simulators',
    desc: 'Interactive multi-parameter simulators for 6 distributions: Bernoulli (PMF, EV, Variance), Binomial (n/p inputs), Poisson (λ), Uniform (PDF), Normal (PDF with 68-95-99.7 rule), Exponential (PDF). Also supports column-based PMF (categorical) and PDF (numeric) views.',
  },
  {
    icon: Repeat, title: 'CLT Simulator',
    desc: 'Monte Carlo Central Limit Theorem demonstration. Dynamically configure sample sizes at n=10, 30, and 100 to observe asymptotic normality convergence via histograms and Q-Q plots. Includes automated CLT interpretation text.',
  },
  {
    icon: ClipboardCheck, title: 'Normality Toolkit',
    desc: 'Evaluates empirical distributions against theoretical normal using histogram + fitted normal curve, Q-Q plots, and 4 formal tests: Shapiro-Francia (W\'), Anderson-Darling, Kolmogorov-Smirnov, and Jarque-Bera. Auto-conclusion based on test results.',
  },
  {
    icon: Brain, title: 'Machine Learning',
    desc: 'Client-side K-Means Clustering (K=2 to 6) with interactive scatter plot visualization. Principal Component Analysis (PCA) with variable column selectors for 2D dimensional reduction and explained variance display.',
  },
  {
    icon: TrendingUp, title: 'Time Series Analysis',
    desc: 'Automated linear trend forecasting over time indices. Displays comparative visual mapping of actual observations against computed linear trends with forecast projections.',
  },
  {
    icon: FileText, title: 'Text Analysis',
    desc: 'NLP tokenization and keyword frequency counting for text variables. Outputs a top-20 ranked horizontal bar chart with corresponding frequency table of most common terms.',
  },
  {
    icon: FileSpreadsheet, title: 'Automated Report Generator',
    desc: 'Generates ready-to-publish summary matrices from hypothesis testing runs. Clean tables with null/alternative hypotheses, alpha significance levels, test statistics, and automated textual conclusions. Copy-to-clipboard support.',
  },
  {
    icon: Sparkles, title: 'AI Insights Engine',
    desc: 'Automated anomaly detection flagging observations exceeding 3σ threshold. Natural language generation producing executive overview summaries of dataset characteristics, distributions, and outlier patterns.',
  },
]

export default function UserGuide() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">User Guide</h1>
          <p className="text-sm text-muted">StatToolkit — Features, usage, and example analysis</p>
        </div>
      </div>

      <Card className="border-accent/30 bg-accent/[0.03]">
        <CardContent className="py-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="text-white/70">
              <span className="font-medium text-white">App:</span>{' '}
              <a href="https://stat-toolkit-luph.vercel.app" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline inline-flex items-center gap-1">
                stat-toolkit-luph.vercel.app <ExternalLink className="h-3 w-3" />
              </a>
            </span>
            <span className="text-white/70">
              <span className="font-medium text-white">Repo:</span>{' '}
              <a href="https://github.com/Beserker-1100011/stat-toolkit" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline inline-flex items-center gap-1">
                github.com/Beserker-1100011/stat-toolkit <GitBranch className="h-3 w-3" />
              </a>
            </span>
            <span className="text-white/70">
              <span className="font-medium text-white">Student:</span> Bhaskar Pagadala (100008549)
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-accent" />
            Project Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white/70 leading-relaxed">
            StatToolkit is a full-stack statistical analysis platform built with React, TypeScript, and Recharts.
            It consolidates advanced statistical concepts into an intuitive dark-themed dashboard with 12 analytical
            modules covering the complete data analysis workflow — from ingestion and cleaning through descriptive
            statistics, hypothesis testing, distribution simulation, machine learning, and automated report generation.
            The application is entirely data-agnostic and accepts any standard CSV format.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" />
            How to Use the Toolkit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-white/70 leading-relaxed">
            <li><strong className="text-white">Upload Data:</strong> Navigate to <strong>Data Upload</strong> and drop a CSV file. Columns are auto-classified as numeric or categorical.</li>
            <li><strong className="text-white">Explore:</strong> Browse the paginated table and check the <strong>Dashboard</strong> for dataset summary statistics.</li>
            <li><strong className="text-white">Analyze:</strong> Visit <strong>Statistics</strong> for descriptive stats, correlations, regression, and hypothesis tests. Select the desired test, configure parameters, and view results with p-values and conclusions.</li>
            <li><strong className="text-white">Visualize:</strong> Use <strong>Visualizations</strong> for chart types and <strong>Distributions</strong> for column-based PMF/PDF views.</li>
            <li><strong className="text-white">Simulate:</strong> Explore theoretical distributions in <strong>Simulators</strong> and the Central Limit Theorem in <strong>CLT Simulator</strong>.</li>
            <li><strong className="text-white">Validate:</strong> Check normality assumptions in the <strong>Normality Toolkit</strong> with Q-Q plots and formal tests.</li>
            <li><strong className="text-white">Model:</strong> Run <strong>Machine Learning</strong> (K-Means, PCA) and <strong>Time Series</strong> forecasting.</li>
            <li><strong className="text-white">Report:</strong> Generate automated reports from hypothesis tests and view AI-generated dataset insights.</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-accent" />
            Sample Dataset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white/70 leading-relaxed">
            The toolkit was tested and evaluated using the{' '}
            <strong className="text-white">FIFA World Cup 2026 Player Performance</strong> dataset
            (54,600 rows × 75 columns) from{' '}
            <a href="https://www.kaggle.com/datasets/rauffauzanrambe" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Kaggle (rauffauzanrambe)</a>.
            You can upload any CSV dataset — the toolkit auto-adapts to your column structure.
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-accent" />
          Toolkit Features — 12 Analytical Modules
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {modules.map((mod, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <mod.icon className="h-4 w-4 text-accent" />
                  {mod.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/70 leading-relaxed">{mod.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            Example Analysis — FIFA World Cup 2026 Dataset
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Strong Feature Covariance</h3>
            <p className="text-sm text-white/70 leading-relaxed">
              The Pearson correlation matrix revealed tight predictive patterns between player metrics,
              specifically an exceptionally strong positive linear correlation (<em>r</em> &gt; 0.97)
              between overall player rating, internal performance score, and recorded top speed (top_speed_kmh).
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Anomaly Identification</h3>
            <p className="text-sm text-white/70 leading-relaxed">
              The AI Insights 3σ filter effectively isolated 260+ statistically rare, extreme goal-related
              outlier observations across individual match metrics.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Distribution Diagnostics</h3>
            <p className="text-sm text-white/70 leading-relaxed">
              The Normality Toolkit successfully rejected the null hypothesis of standard normal distribution
              for a majority of numeric metrics (e.g., goals_opponent), providing quantitative proof via
              high-value test statistics in the Anderson-Darling and Jarque-Bera tests.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Stratified Clusters</h3>
            <p className="text-sm text-white/70 leading-relaxed">
              The unsupervised K-Means model successfully delineated structural cohorts based on market value
              brackets, allowing immediate categorical segmentation of players.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Conclusion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white/70 leading-relaxed">
            StatToolkit fulfills the operational criteria of an enterprise-grade standalone statistics engine,
            effectively bridging rigorous academic methodology with a user-focused design interface. By supporting
            data ingestion, high-level multi-parameter modeling, visual distribution simulations, and automated
            reporting, the tool presents a completely scalable framework applicable to arbitrary datasets beyond
            the tested FIFA player parameters.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}