import { spawn } from 'node:child_process'

export type EngineScore = { type: 'cp' | 'mate'; value: number }
export type EngineResult = { score: EngineScore; bestMove: string | null; pv: string | null; depth: number; nodes: number | null; elapsedMs: number }
const lineValue = (line: string, key: string) => { const match = line.match(new RegExp(`\\b${key}\\s+(-?\\d+)`)); return match ? Number(match[1]) : null }
export class Stockfish {
  private child = spawn('false'); private lines: string[] = []; private waiters: Array<(line: string) => void> = []
  constructor(private readonly path: string) {}
  async start() { this.child = spawn(this.path, [], { stdio: ['pipe', 'pipe', 'pipe'] }); this.child.stdout.setEncoding('utf8'); this.child.stdout.on('data', data => String(data).split(/\r?\n/).filter(Boolean).forEach(line => { const waiter = this.waiters.shift(); if (waiter) waiter(line); else this.lines.push(line) })); this.child.stderr.on('data', () => undefined); this.send('uci'); await this.until('uciok'); this.send('isready'); await this.until('readyok') }
  private send(command: string) { this.child.stdin.write(`${command}\n`) }
  private async until(match: string | RegExp): Promise<string> { for (;;) { const line = this.lines.shift() ?? await new Promise<string>(resolve => this.waiters.push(resolve)); if (typeof match === 'string' ? line === match : match.test(line)) return line } }
  async analyse(fen: string, depth: number, movetimeMs?: number): Promise<EngineResult> { const started = Date.now(); this.send(`position fen ${fen}`); this.send(movetimeMs ? `go depth ${depth} movetime ${movetimeMs}` : `go depth ${depth}`); let score: EngineScore = { type: 'cp', value: 0 }; let reachedDepth = 0; let nodes: number | null = null; let pv: string | null = null; for (;;) { const line = await this.until(/^(info |bestmove )/); if (line.startsWith('info ')) { const mate = lineValue(line, 'mate'); const cp = lineValue(line, 'cp'); if (mate !== null) score = { type: 'mate', value: mate }; else if (cp !== null) score = { type: 'cp', value: cp }; reachedDepth = lineValue(line, 'depth') ?? reachedDepth; nodes = lineValue(line, 'nodes') ?? nodes; const pvMatch = line.match(/\bpv\s+(.+)$/); if (pvMatch) pv = pvMatch[1] } else { const bestMove = line.split(/\s+/)[1] ?? null; return { score, bestMove: bestMove === '(none)' ? null : bestMove, pv, depth: reachedDepth || depth, nodes, elapsedMs: Date.now() - started } } } }
  async stop() { if (!this.child.killed) { this.send('quit'); this.child.kill() } }
}
