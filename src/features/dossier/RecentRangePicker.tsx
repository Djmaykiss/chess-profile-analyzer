import { dossierRanges } from './dossier-formatters'

export function RecentRangePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="dossier-picker">Rango de análisis<select value={value} onChange={event => onChange(event.target.value)}>{dossierRanges.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}
