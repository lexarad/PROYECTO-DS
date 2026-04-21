type FlushFn = (logs: string) => Promise<void>

function timestampMadrid(): string {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Madrid',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    fractionalSecondDigits: 3,
    hour12: false,
  }).format(new Date())
  return parts.replace(' ', 'T')
}

export class JobLogger {
  private entries: string[] = []
  private flushFn?: FlushFn
  private readonly flushEvery: number

  constructor(flushFn?: FlushFn, flushEvery = 5) {
    this.flushFn = flushFn
    this.flushEvery = flushEvery
  }

  log(msg: string) {
    const line = `[${timestampMadrid()}] ${msg}`
    this.entries.push(line)
    console.log(`[AUTO] ${line}`)
    this.maybeFlush()
  }

  error(msg: string) {
    const line = `[${timestampMadrid()}] ERROR: ${msg}`
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
