import * as ss from 'simple-statistics'

function regularizedIncompleteBeta(x: number, a: number, b: number): number {
  if (x < 0 || x > 1) return 0
  if (x === 0 || x === 1) return x
  if (x > (a + 1) / (a + b + 2)) return 1 - regularizedIncompleteBeta(1 - x, b, a)

  const lbeta = ss.gammaln(a) + ss.gammaln(b) - ss.gammaln(a + b)
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta - Math.log(a))
  const fpmin = 1e-30, maxIter = 200, eps = 3e-12
  const qab = a + b, qap = a + 1, qam = a - 1
  let c = 1, d = 1 - qab * x / qap
  if (Math.abs(d) < fpmin) d = fpmin
  d = 1 / d
  let h = d
  for (let m = 1; m <= maxIter; m++) {
    const m2 = 2 * m
    const aa1 = m * (b - m) * x / ((qam + m2) * (a + m2))
    d = 1 + aa1 * d; if (Math.abs(d) < fpmin) d = fpmin
    c = 1 + aa1 / c; if (Math.abs(c) < fpmin) c = fpmin
    d = 1 / d; h *= d * c
    const aa2 = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
    d = 1 + aa2 * d; if (Math.abs(d) < fpmin) d = fpmin
    c = 1 + aa2 / c; if (Math.abs(c) < fpmin) c = fpmin
    d = 1 / d
    const del = d * c; h *= del
    if (Math.abs(del - 1) < eps) break
  }
  return h * front
}

function lowerRegularizedGamma(a: number, x: number): number {
  if (x < 0 || a <= 0) return 0
  if (x === 0) return 0
  let sum = 1 / a, term = 1 / a
  for (let n = 1; n < 200; n++) {
    term *= x / (a + n); sum += term
    if (Math.abs(term) < 1e-14 * sum) break
  }
  return sum * Math.exp(-x + a * Math.log(x) - ss.gammaln(a))
}

export function tTestPValue(t: number, df: number): number {
  const x = df / (df + t * t)
  return regularizedIncompleteBeta(x, df / 2, 0.5)
}

export function zTestPValue(z: number): number {
  return 2 * (1 - ss.cumulativeStdNormalProbability(Math.abs(z)))
}

export function chiSquarePValue(x: number, df: number): number {
  if (x <= 0 || df <= 0) return 1
  return 1 - lowerRegularizedGamma(df / 2, x / 2)
}

export function fTestPValue(f: number, df1: number, df2: number): number {
  if (f <= 0 || df1 <= 0 || df2 <= 0) return 1
  const x = (df1 * f) / (df1 * f + df2)
  return 1 - regularizedIncompleteBeta(x, df1 / 2, df2 / 2)
}

export function iqr(vals: number[]): { q1: number; q3: number; iqr: number; outliers: number[] } {
  const sorted = [...vals].sort((a, b) => a - b)
  const q1 = ss.quantileSorted(sorted, 0.25)
  const q3 = ss.quantileSorted(sorted, 0.75)
  const iqrVal = q3 - q1
  const lower = q1 - 1.5 * iqrVal
  const upper = q3 + 1.5 * iqrVal
  return { q1, q3, iqr: iqrVal, outliers: vals.filter((v) => v < lower || v > upper) }
}

export function correlationPValue(r: number, n: number): number {
  if (n < 3) return 1
  const t = (r * Math.sqrt(n - 2)) / Math.sqrt(1 - r * r)
  return tTestPValue(Math.abs(t), n - 2)
}

export function confidenceInterval(vals: number[], confidence = 0.95): { lower: number; upper: number; mean: number; margin: number } {
  const n = vals.length
  const mean = ss.mean(vals)
  const std = ss.standardDeviation(vals)
  const se = std / Math.sqrt(n)
  const alpha = 1 - confidence
  const tCrit = tDistributionInverse(1 - alpha / 2, n - 1)
  const margin = tCrit * se
  return { lower: mean - margin, upper: mean + margin, mean, margin }
}

function tDistributionInverse(p: number, df: number): number {
  if (df > 120) return ss.probit(p)
  let lo = -10, hi = 10
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2
    const pv = tTestPValue(mid, df) / 2
    if (pv < 1 - p) hi = mid; else lo = mid
  }
  return (lo + hi) / 2
}

export function leveneTest(groups: number[][]): { F: number; df1: number; df2: number; pValue: number } {
  const k = groups.length
  const allVals: number[] = []
  const absDeviations: number[][] = []
  for (const g of groups) {
    const m = ss.mean(g)
    absDeviations.push(g.map((v) => Math.abs(v - m)))
    allVals.push(...g.map((v) => Math.abs(v - m)))
  }
  const grandMean = ss.mean(allVals)
  const totalN = allVals.length
  let ssBetween = 0, ssWithin = 0
  for (const g of absDeviations) {
    const gm = ss.mean(g)
    ssBetween += g.length * (gm - grandMean) ** 2
    ssWithin += g.reduce((s, v) => s + (v - gm) ** 2, 0)
  }
  const df1 = k - 1, df2 = totalN - k
  const F = (ssBetween / df1) / (ssWithin / df2)
  return { F, df1, df2, pValue: fTestPValue(F, df1, df2) }
}

export function andersonDarling(vals: number[]): { A2: number; critical: number; pValue: number; normal: boolean } {
  const n = vals.length
  const sorted = [...vals].sort((a, b) => a - b)
  const mean = ss.mean(sorted)
  const std = ss.standardDeviation(sorted)
  let S = 0
  for (let i = 0; i < n; i++) {
    const z = (sorted[i] - mean) / std
    const cdf = ss.cumulativeStdNormalProbability(z)
    const cdfRev = ss.cumulativeStdNormalProbability(-z)
    if (cdf <= 0 || cdfRev <= 0) continue
    S += (2 * (i + 1) - 1) * (Math.log(cdf) + Math.log(cdfRev))
  }
  const A2 = -n - S / n
  const A2c = A2 * (1 + 0.75 / n + 2.25 / (n * n))
  const pValue = A2c < 0.2 ? 1 - Math.exp(-13.436 + 101.14 * A2c - 223.73 * A2c * A2c) : 1 - Math.exp(-8.318 + 42.796 * A2c - 59.938 * A2c * A2c)
  return { A2, critical: A2c, pValue: Math.max(0, Math.min(1, pValue)), normal: pValue > 0.05 }
}

export function kolmogorovSmirnovNormal(vals: number[]): { D: number; pValue: number } {
  const sorted = [...vals].sort((a, b) => a - b)
  const n = sorted.length
  const mean = ss.mean(sorted)
  const std = ss.standardDeviation(sorted)
  let D = 0
  for (let i = 0; i < n; i++) {
    const z = (sorted[i] - mean) / std
    const cdf = ss.cumulativeStdNormalProbability(z)
    const ecdf = (i + 1) / n
    const d1 = Math.abs(ecdf - cdf)
    const d2 = Math.abs(i / n - cdf)
    D = Math.max(D, d1, d2)
  }
  const s = Math.sqrt(n) * D
  let pValue = 0
  for (let k = 1; k <= 100; k++) {
    pValue += Math.pow(-1, k - 1) * Math.exp(-2 * k * k * s * s)
  }
  pValue = Math.max(0, Math.min(1, 2 * pValue))
  return { D, pValue }
}

export function shapiroFrancia(vals: number[]): { W: number; pValue: number } {
  const sorted = [...vals].sort((a, b) => a - b)
  const n = sorted.length
  const mean = ss.mean(sorted)
  const ssTotal = sorted.reduce((s, v) => s + (v - mean) ** 2, 0)
  const m: number[] = []
  for (let i = 0; i < n; i++) {
    m.push(ss.probit((i + 1 - 3 / 8) / (n + 1 / 4)))
  }
  const mNorm = Math.sqrt(m.reduce((s, v) => s + v * v, 0))
  const a = m.map((v) => v / mNorm)
  const W = Math.pow(a.reduce((s, v, i) => s + v * sorted[i], 0), 2) / ssTotal
  const mu = 1.0528 - 0.208 / Math.sqrt(n) - 0.413 / n
  const sigma = -0.5753 + 0.4987 / Math.sqrt(n) - 0.05105 / n
  const z = (Math.log(1 - W) - mu) / sigma
  const pValue = 1 - ss.cumulativeStdNormalProbability(z)
  return { W, pValue: Math.max(0, Math.min(1, pValue)) }
}

export function jarqueBera(vals: number[]): { JB: number; pValue: number } {
  const n = vals.length
  const s = ss.sampleSkewness(vals)
  const k = ss.sampleKurtosis(vals)
  const JB = (n / 6) * (s * s + ((k - 3) * (k - 3)) / 4)
  return { JB, pValue: 1 - lowerRegularizedGamma(1, JB / 2) }
}

export function wilcoxonSignedRank(before: number[], after: number[]): { W: number; pValue: number } {
  const diffs = before.map((b, i) => after[i] - b).filter((d) => d !== 0)
  const n = diffs.length
  const absDiffs = diffs.map((d) => Math.abs(d))
  const ranked = absDiffs.map((v) => ({ v, rank: 0 }))
  const sorted = [...absDiffs].sort((a, b) => a - b)
  ranked.forEach((r) => { r.rank = sorted.indexOf(r.v) + 1 })
  const W = ranked.reduce((s, r, i) => s + (diffs[i] > 0 ? r.rank : 0), 0)
  const mu = n * (n + 1) / 4
  const sigma = Math.sqrt(n * (n + 1) * (2 * n + 1) / 24)
  const z = Math.abs(W - mu) / sigma
  const pValue = zTestPValue(z)
  return { W, pValue }
}

export function kruskalWallis(groups: number[][]): { H: number; df: number; pValue: number } {
  const all = groups.flat()
  const sorted = [...all].sort((a, b) => a - b)
  const n = all.length
  let Ranks: number[][] = []
  for (const g of groups) {
    Ranks.push(g.map((v) => sorted.indexOf(v) + 1))
  }
  const rankSums = Ranks.map((r) => r.reduce((s, v) => s + v, 0))
  const H = (12 / (n * (n + 1))) * rankSums.reduce((s, rs, i) => s + rs * rs / groups[i].length, 0) - 3 * (n + 1)
  const df = groups.length - 1
  return { H, df, pValue: chiSquarePValue(H, df) }
}

export function friedmanTest(groups: number[][]): { Q: number; df: number; pValue: number } {
  const n = groups[0].length
  const k = groups.length
  const ranks: number[][] = Array.from({ length: k }, () => [])
  for (let i = 0; i < n; i++) {
    const vals = groups.map((g) => g[i])
    const sorted = [...vals].sort((a, b) => a - b)
    for (let j = 0; j < k; j++) {
      ranks[j].push(sorted.indexOf(vals[j]) + 1)
    }
  }
  const R = ranks.map((r) => r.reduce((s, v) => s + v, 0))
  const Q = (12 / (n * k * (k + 1))) * R.reduce((s, r) => s + r * r, 0) - 3 * n * (k + 1)
  return { Q, df: k - 1, pValue: chiSquarePValue(Q, k - 1) }
}

export function twoWayANOVA(
  data: number[][][]
): {
  ssA: number; ssB: number; ssAB: number; ssE: number; ssT: number
  dfA: number; dfB: number; dfAB: number; dfE: number
  msA: number; msB: number; msAB: number; msE: number
  FA: number; FB: number; FAB: number
  pA: number; pB: number; pAB: number
} {
  const a = data.length, b = data[0].length, n = data[0][0]?.length || 1
  const all = data.flat(2)
  const grandMean = ss.mean(all)

  const rowMeans = data.map((row) => ss.mean(row.flat()))
  const colMeans = Array.from({ length: b }, (_, j) => ss.mean(data.map((row) => row[j]).flat()))
  const cellMeans = data.map((row) => row.map((cell) => ss.mean(cell)))

  let ssA = 0, ssB = 0, ssAB = 0, ssE = 0
  for (let i = 0; i < a; i++) {
    ssA += b * n * (rowMeans[i] - grandMean) ** 2
    for (let j = 0; j < b; j++) {
      ssB += a * n * (colMeans[j] - grandMean) ** 2
      ssAB += n * (cellMeans[i][j] - rowMeans[i] - colMeans[j] + grandMean) ** 2
      for (let k = 0; k < n; k++) {
        ssE += (data[i][j][k] - cellMeans[i][j]) ** 2
      }
    }
  }
  const ssT = all.reduce((s, v) => s + (v - grandMean) ** 2, 0)
  const dfA = a - 1, dfB = b - 1, dfAB = (a - 1) * (b - 1), dfE = a * b * (n - 1)
  const msA = ssA / dfA, msB = ssB / dfB, msAB = ssAB / dfAB, msE = ssE / dfE
  const FA = msA / msE, FB = msB / msE, FAB = msAB / msE
  const pA = fTestPValue(FA, dfA, dfE), pB = fTestPValue(FB, dfB, dfE), pAB = fTestPValue(FAB, dfAB, dfE)
  return { ssA, ssB, ssAB, ssE, ssT, dfA, dfB, dfAB, dfE, msA, msB, msAB, msE, FA, FB, FAB, pA, pB, pAB }
}

export function generateQQData(vals: number[]): { theoretical: number; observed: number }[] {
  const sorted = [...vals].sort((a, b) => a - b)
  const n = sorted.length
  const mean = ss.mean(sorted)
  const std = ss.standardDeviation(sorted)
  return sorted.map((v, i) => {
    const theoretical = ss.probit((i + 0.5) / n)
    return { theoretical, observed: v }
  })
}

export function distributionFit(vals: number[]): {
  normal: { mean: number; std: number; mse: number }
  exponential: { rate: number; mse: number }
  uniform: { min: number; max: number; mse: number }
} {
  const sorted = [...vals].sort((a, b) => a - b)
  const mean = ss.mean(sorted)
  const std = ss.standardDeviation(sorted)
  const rate = 1 / mean
  const unifMin = sorted[0], unifMax = sorted[sorted.length - 1]

  const bins = 30
  const histMin = sorted[0], histMax = sorted[sorted.length - 1]
  const binWidth = (histMax - histMin) / bins
  const hist: number[] = Array(bins).fill(0)
  for (const v of vals) { const idx = Math.min(bins - 1, Math.floor((v - histMin) / binWidth)); hist[idx]++ }
  const total = vals.length * binWidth

  const normalMSE = hist.reduce((s, c, i) => { const x = histMin + (i + 0.5) * binWidth; const e = total * (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mean) / std) ** 2); return s + (c - e) ** 2 }, 0) / bins
  const expMSE = hist.reduce((s, c, i) => { const x = histMin + (i + 0.5) * binWidth; const e = total * rate * Math.exp(-rate * x); return s + (c - e) ** 2 }, 0) / bins
  const unifMSE = hist.reduce((s, c, i) => { const e = total / (unifMax - unifMin); return s + (c - e) ** 2 }, 0) / bins

  return {
    normal: { mean, std, mse: normalMSE },
    exponential: { rate, mse: expMSE },
    uniform: { min: unifMin, max: unifMax, mse: unifMSE },
  }
}
