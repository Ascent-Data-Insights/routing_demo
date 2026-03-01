import type { Node, OptimizationRequest, OptimizationResponse } from '../types/routing'

const API_BASE = '/api'

export async function getNodes(): Promise<Node[]> {
  const res = await fetch(`${API_BASE}/nodes`)
  if (!res.ok) throw new Error(`Failed to fetch nodes: ${res.status}`)
  return res.json()
}

export async function optimize(request: OptimizationRequest): Promise<OptimizationResponse> {
  const res = await fetch(`${API_BASE}/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) throw new Error(`Optimization failed: ${res.status}`)
  return res.json()
}
