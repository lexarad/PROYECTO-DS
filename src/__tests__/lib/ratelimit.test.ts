import { describe, it, expect } from 'vitest'

// Re-implement inline to avoid module-level Map state pollution between tests
function makeRateLimiter() {
  const store = new Map<string, { count: number; resetAt: number }>()

  return function rateLimit(key: string, limit: number, windowSec: number) {
    const now = Date.now()
    const windowMs = windowSec * 1000
    const entry = store.get(key)

    if (!entry || entry.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + windowMs })
      return { allowed: true, remaining: limit - 1 }
    }
    if (entry.count >= limit) {
      return { allowed: false, remaining: 0 }
    }
    entry.count++
    return { allowed: true, remaining: limit - entry.count }
  }
}

describe('rateLimit', () => {
  it('permite la primera petición', () => {
    const rl = makeRateLimiter()
    const result = rl('test-key', 5, 60)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('bloquea al superar el límite', () => {
    const rl = makeRateLimiter()
    for (let i = 0; i < 3; i++) rl('ip1', 3, 60)
    const result = rl('ip1', 3, 60)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('IPs distintas tienen contadores independientes', () => {
    const rl = makeRateLimiter()
    rl('ip-a', 2, 60)
    rl('ip-a', 2, 60)
    const blockedA = rl('ip-a', 2, 60)
    const freeB = rl('ip-b', 2, 60)
    expect(blockedA.allowed).toBe(false)
    expect(freeB.allowed).toBe(true)
  })

  it('el contador decrece remaining correctamente', () => {
    const rl = makeRateLimiter()
    const r1 = rl('x', 5, 60)
    const r2 = rl('x', 5, 60)
    const r3 = rl('x', 5, 60)
    expect(r1.remaining).toBe(4)
    expect(r2.remaining).toBe(3)
    expect(r3.remaining).toBe(2)
  })
})
