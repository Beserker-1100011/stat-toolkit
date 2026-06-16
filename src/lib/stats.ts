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
