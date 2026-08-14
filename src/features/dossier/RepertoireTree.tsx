import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { DossierRange, RepertoireIndexJob, RepertoireNode } from './dossier.types'
import { percent, resultLabel } from './dossier-formatters'
import { useBuildProfileRepertoireIndex, useProfileRepertoireIndexJob, useProfileRepertoireTree } from './dossier.hooks'

const parentOf = (sequence: string, ply: number) => ply === 1 ? '' : sequence.replace(/\s+\S+$/, '')
const progressFrom = (result: { completed: boolean; processedGames: number; indexedMoves: number }): RepertoireIndexJob => ({ status: result.completed ? 'completed' : 'running', processedGames: result.processedGames, indexedMoves: result.indexedMoves, lastGameId: null, errorMessage: null })

export function RepertoireTree({ profileId, range }: { profileId: string; range: DossierRange }) {
  const [color, setColor] = useState<'white' | 'black'>('white')
  const [maxPly, setMaxPly] = useState(8)
  const [minGames, setMinGames] = useState(10)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['']))
  const [progress, setProgress] = useState<RepertoireIndexJob | null>(null)
  const running = useRef(false)
  const client = useQueryClient()
  const { data: nodes = [], isLoading, error } = useProfileRepertoireTree(profileId, color, range, maxPly, minGames)
  const { data: job, refetch: refetchJob } = useProfileRepertoireIndexJob(profileId)
  const build = useBuildProfileRepertoireIndex(profileId)
  const tree = useMemo(() => { const map = new Map<string, RepertoireNode[]>(); nodes.forEach(node => { const parent = parentOf(node.move_sequence, node.ply); map.set(parent, [...(map.get(parent) ?? []), node]) }); return map }, [nodes])

  useEffect(() => setProgress(job ?? null), [job])
  useEffect(() => {
    document.title = progress?.status === 'running' ? `Chess Profile Analyzer — Indexando ${progress.processedGames}` : 'Chess Profile Analyzer'
  }, [progress?.processedGames, progress?.status])
  const runToCompletion = useCallback(async () => {
    if (running.current) return
    running.current = true
    try {
      let result = await build.mutateAsync()
      setProgress(progressFrom(result))
      let batches = 1
      while (!result.completed && batches < 400) {
        result = await build.mutateAsync()
        batches += 1
        setProgress(progressFrom(result))
      }
      await Promise.all([client.invalidateQueries({ queryKey: ['profile-repertoire-tree', profileId] }), refetchJob()])
    } finally {
      running.current = false
    }
  }, [build, client, profileId, refetchJob])

  // A previously started job resumes after reload; a new index still requires the explicit button.
  useEffect(() => { if (job?.status === 'running') void runToCompletion() }, [job?.status, runToCompletion])

  const toggle = (key: string) => setExpanded(current => { const next = new Set(current); next.has(key) ? next.delete(key) : next.add(key); return next })
  const activeJob = progress ?? job
  const label = build.isPending ? 'Indexando repertorio…' : activeJob?.status === 'running' ? 'Indexando en segundo plano' : activeJob?.status === 'completed' ? 'Índice completo' : 'Preparar repertorio'
  const buildButton = <button className="secondary compact" disabled={build.isPending || activeJob?.status === 'running' || activeJob?.status === 'completed'} onClick={() => void runToCompletion()}>{label}</button>

  return <section className="card repertoire-section"><div className="card-title"><div><p className="eyebrow">PGN REALES · LÍNEA PRINCIPAL</p><h2>Repertorio real</h2></div><div className="repertoire-controls"><select value={color} onChange={event => setColor(event.target.value as 'white' | 'black')}><option value="white">Blancas</option><option value="black">Negras</option></select><select value={maxPly} onChange={event => setMaxPly(Number(event.target.value))}>{[4, 6, 8, 10, 12].map(value => <option key={value} value={value}>Hasta {value} ply</option>)}</select><select value={minGames} onChange={event => setMinGames(Number(event.target.value))}>{[3, 5, 10, 20].map(value => <option key={value} value={value}>Mín. {value} partidas</option>)}</select></div></div>{activeJob && <div className="repertoire-progress"><span>{activeJob.status === 'completed' ? `Índice completo: ${activeJob.processedGames} partidas y ${activeJob.indexedMoves} movimientos.` : `Indexando: ${activeJob.processedGames} partidas y ${activeJob.indexedMoves} movimientos.`}</span>{buildButton}</div>}{isLoading ? <p className="subtle-copy">Cargando ramas agregadas…</p> : error ? <div className="repertoire-empty"><p>El índice todavía no está disponible para este perfil.</p>{buildButton}{build.isError && <p className="form-error">No se pudo preparar el repertorio.</p>}</div> : nodes.length ? <><div className="repertoire-tree"><TreeBranch parent="" depth={0} tree={tree} expanded={expanded} toggle={toggle}/></div>{!activeJob && <div className="repertoire-empty"><p>El índice contiene datos parciales o anteriores.</p>{buildButton}</div>}</> : <div className="repertoire-empty"><p>Aún no hay movimientos indexados para este rango.</p>{buildButton}</div>}</section>
}

function TreeBranch({ parent, depth, tree, expanded, toggle }: { parent: string; depth: number; tree: Map<string, RepertoireNode[]>; expanded: Set<string>; toggle: (key: string) => void }) {
  const children = tree.get(parent) ?? []
  return <>{children.map(node => { const hasChildren = tree.has(node.move_sequence); const open = expanded.has(node.move_sequence); return <div className="repertoire-node" key={node.move_sequence} style={{ '--depth': depth } as React.CSSProperties}><div className="repertoire-row"><button className="tree-toggle" aria-label={open ? 'Contraer rama' : 'Expandir rama'} disabled={!hasChildren} onClick={() => toggle(node.move_sequence)}>{hasChildren ? open ? <ChevronDown size={15}/> : <ChevronRight size={15}/> : <span/>}</button><strong>{node.san}</strong><span>{node.games} partidas · {node.percentage}%</span><small>{resultLabel(node)} · {percent(node)}%</small></div>{hasChildren && open && <TreeBranch parent={node.move_sequence} depth={depth + 1} tree={tree} expanded={expanded} toggle={toggle}/>}</div> })}</>
}
