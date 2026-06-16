import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Terminal } from 'lucide-react'

const pythonCode = `import pandas as pd
import numpy as np
from scipy import stats

# Load your data
df = pd.read_csv('your_dataset.csv')

# Descriptive statistics
print(df.describe())

# Correlation matrix
print(df.corr())

# Linear regression
from sklearn.linear_model import LinearRegression
model = LinearRegression()
model.fit(df[['feature_x']], df['target_y'])
print(f"Slope: {model.coef_[0]:.4f}")
print(f"Intercept: {model.intercept_:.4f}")
print(f"R²: {model.score(df[['feature_x']], df['target_y']):.4f}")

# T-test
stat, p = stats.ttest_1samp(df['column'], popmean=0)
print(f"t = {stat:.4f}, p = {p:.4f}")

# K-Means
from sklearn.cluster import KMeans
kmeans = KMeans(n_clusters=3)
df['cluster'] = kmeans.fit_predict(df[['x', 'y']])

# PCA
from sklearn.decomposition import PCA
pca = PCA(n_components=2)
components = pca.fit_transform(df.select_dtypes(include=[np.number]))
print(f"Explained variance: {pca.explained_variance_ratio_}")
`

const nodeCode = `const ss = require('simple-statistics');
const Papa = require('papaparse');
const fs = require('fs');

// Load your data
const csv = fs.readFileSync('your_dataset.csv', 'utf8');
const parsed = Papa.parse(csv, { header: true, dynamicTyping: true });
const data = parsed.data;

// Extract a numeric column
const values = data.map(r => r.column_name).filter(v => !isNaN(v));

// Descriptive statistics
console.log('Mean:', ss.mean(values));
console.log('Median:', ss.median(values));
console.log('Std Dev:', ss.standardDeviation(values));
console.log('Variance:', ss.variance(values));
console.log('Skewness:', ss.sampleSkewness(values));

// Linear regression
const points = data
  .map(r => [r.feature_x, r.target_y])
  .filter(([x, y]) => !isNaN(x) && !isNaN(y));
const [intercept, slope] = ss.linearRegression(points);
const lineFn = ss.linearRegressionLine({ m: slope, b: intercept });
const r2 = ss.rSquared(points, lineFn);
console.log(\`Slope: \${slope}, Intercept: \${intercept}, R²: \${r2}\`);

// Correlation
const x = data.map(r => r.col_a).filter(v => !isNaN(v));
const y = data.map(r => r.col_b).filter(v => !isNaN(v));
const minLen = Math.min(x.length, y.length);
console.log('Pearson r:', ss.sampleCorrelation(
  x.slice(0, minLen), y.slice(0, minLen)
));
`

export default function CLIGuide() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
          <Terminal className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">CLI Guide</h1>
          <p className="text-sm text-muted">Reproduce analysis via Python or Node.js</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-yellow-500/20 text-xs font-bold text-yellow-400">Py</span>
              Python (pandas + scipy)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-xl border border-glass-border bg-black/40 p-5 font-mono text-xs leading-relaxed text-emerald-400">
              <code>{pythonCode}</code>
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-green-500/20 text-xs font-bold text-green-400">JS</span>
              Node.js (simple-statistics)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-xl border border-glass-border bg-black/40 p-5 font-mono text-xs leading-relaxed text-emerald-400">
              <code>{nodeCode}</code>
            </pre>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted">
            StatToolkit's core math is powered by{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-accent">simple-statistics</code>.
            The same library is available on npm for Node.js projects, and the Python ecosystem
            provides equivalent functionality via <code className="rounded bg-white/10 px-1.5 py-0.5 text-accent">scipy.stats</code> and{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-accent">scikit-learn</code>.
            Use the snippets above as a starting point for programmatic analysis.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
