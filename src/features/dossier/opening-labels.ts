export function openingLabels(eco: string | null | undefined, opening: string | null | undefined) {
  const normalizedEco = eco?.trim()
  const normalizedOpening = opening?.trim()
  return {
    eco: normalizedEco && normalizedEco !== '—' ? normalizedEco : 'ECO no identificado',
    opening: normalizedOpening && normalizedOpening !== 'Sin nombre' ? normalizedOpening : 'Apertura no identificada',
  }
}
