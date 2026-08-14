export const ACCURACY_FORMULA_VERSION = 'cpa-accuracy-v1'
export const CP_LOSS_CAP = 1000
export function moveAccuracy(loss: number | null, mateOutcome?: 'kept' | 'lost'): number { if (mateOutcome === 'kept') return 100; if (mateOutcome === 'lost') return 0; return Math.max(0, Math.min(100, 100 * Math.exp(-Math.min(Math.max(loss ?? 0, 0), CP_LOSS_CAP) / 120))) }
export function averageAccuracy(values: number[]): number | null { return values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)) : null }
