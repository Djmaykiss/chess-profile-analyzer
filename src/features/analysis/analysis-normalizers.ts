/**
 * PostgREST RPC results are normally arrays, but Supabase JS can surface a
 * single composite RPC row as an object depending on the transport/runtime.
 */
export function firstRpcRow<T>(data: T[] | T | null | undefined): T | null {
  if (!data) return null
  return Array.isArray(data) ? data[0] ?? null : data
}
