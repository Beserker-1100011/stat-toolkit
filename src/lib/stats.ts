import * as ss from 'simple-statistics'

function regularizedIncompleteBeta(x: number, a: number, b: number): number {
  if (x < 0 || x > 1) return 0
  if (x === 0 || x === 1) return x

  if (x > (a + 1) / (a + b + 2)) {
    return 1 - regularizedIncompleteBeta(1 - x, b, a)
  }

  const lbeta = ss.gammaln(a) + ss.gammaln(b) - ss.gammaln(a + b)
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta - Math.log(a))

  const fpmin = 1e-30
  const maxIter = 200
  const eps = 3e-12

  const qab = a + b
  const qap = a + 1
  const qam = a - 1
  let c = 1.0
  let d = 1.0 - qab * x / qap
  if (Math.abs(d) < fpmin) d = fpmin
  d = 1.0 / d
  let h = d

  for (let m = 1; m <= maxIter; m++) {
    const m2 = 2 * m

    const aa1 = m * (b - m) * x / ((qam + m2) * (a + m2))
    d = 1.0 + aa1 * d
    if (Math.abs(d) < fpmin) d = fpmin
    c = 1.0 + aa1 / c
    if (Math.abs(c) < fpmin) c = fpmin
    d = 1.0 / d
    h *= d * c

    const aa2 = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
    d = 1.0 + aa2 * d
    if (Math.abs(d) < fpmin) d = fpmin
    c = 1.0 + aa2 / c
    if (Math.abs(c) < fpmin) c = fpmin
    d = 1.0 / d
    const del = d * c
    h *= del

    if (Math.abs(del - 1.0) < eps) break
  }

  return h * front
}

export function tTestPValue(t: number, df: number): number {
  const x = df / (df + t * t)
  return regularizedIncompleteBeta(x, df / 2, 0.5)
}

export function zTestPValue(z: number): number {
  return 2 * (1 - ss.cumulativeStdNormalProbability(Math.abs(z)))
}

function lowerRegularizedGamma(a: number, x: number): number {
  if (x < 0 || a <= 0) return 0
  if (x === 0) return 0

  let sum = 1 / a
  let term = 1 / a
  for (let n = 1; n < 200; n++) {
    term *= x / (a + n)
    sum += term
    if (Math.abs(term) < 1e-14 * sum) break
  }

  return sum * Math.exp(-x + a * Math.log(x) - ss.gammaln(a))
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
  const outliers = vals.filter((v) => v < lower || v > upper)
  return { q1, q3, iqr: iqrVal, outliers }
}
