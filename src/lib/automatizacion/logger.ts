type FlushFn = (logs: string) => Promise<void>

export class JobLogger {
  private entries: string[] = []
  private flushFn?: FlushFn
  private readonly flushEvery: number

  constructor(flushFn?: FlushFn, flushEvery = 5) {
    this.flushFn = flushFn
    this.flushEvery = flushEvery
  }

  log(msg: string) {
    const line = `[${new Date().toISOString()}] ${msg}`
    this.entries.push(line)
    console.log(`[AUTO] ${line}`)
    this.maybeFlush()
  }

  error(msg: string) {
    const line = `[${new Date().toISOString()}] ERROR: ${msg}`
    this.entries.push(line)
    console.error(`[AUTO] ${line}`)
    this.maybeFlush()
  }

  private maybeFlush() {
    if (this.flushFn && this.entries.length % this.flushEvery === 0) {
      this.flushFn(this.dump()).catch(console.error)
    }
  }

  dump(): string {
    return this.entries.join('\n')
  }
}
