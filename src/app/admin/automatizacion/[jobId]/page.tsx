import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ReintentarJobBtn from '@/components/admin/ReintentarJobBtn'
import { JobLiveMonitor } from '@/components/admin/JobLiveMonitor'
import { ResolverManualModal } from '@/components/admin/ResolverManualModal'

export const dynamic = 'force-dynamic'

interface Props { params: { jobId: string } }

export default async function JobDetallePage({ params }: Props) {
  const job = await (prisma as any).automatizacionJob.findUnique({
    where: { id: params.jobId },
    include: {
      solicitud: {
        select: { referencia: true, tipo: true, datos: true, id: true },
      },
    },
  })

  if (!job) notFound()

  const puedeReintentar = ['FALLIDO', 'REQUIERE_MANUAL', 'PENDIENTE'].includes(job.estado)
  const esManual = job.estado === 'REQUIERE_MANUAL'

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/admin/automatizacion" className="text-sm text-brand-600 hover:underline">
          ← Automatización
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-500 font-mono">{job.id}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">
            Job — {job.tipo?.replace(/_/g, ' ')}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Solicitud:{' '}
            <Link href={`/admin/solicitudes/${job.solicitud?.id}`} className="text-brand-600 hover:underline font-mono">
              {job.solicitud?.referencia ?? job.solicitudId}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {esManual && (
            <ResolverManualModal
              jobId={job.id}
              solicitudRef={job.solicitud?.referencia}
            />
          )}
          {puedeReintentar && <ReintentarJobBtn jobId={job.id} />}
        </div>
      </div>

      {/* Métricas estáticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs text-gray-500">Intentos</p>
          <p className="text-2xl font-bold">{job.intentos}/{job.maxIntentos}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Iniciado</p>
          <p className="text-sm font-medium">
            {job.iniciadoAt ? new Date(job.iniciadoAt).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }) : '—'}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Completado</p>
          <p className="text-sm font-medium">
            {job.completadoAt ? new Date(job.completadoAt).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }) : '—'}
          </p>
        </div>
      </div>

      {/* Monitor en vivo — estado, error, logs, screenshots */}
      <JobLiveMonitor
        jobId={job.id}
        estadoInicial={job.estado}
        logsIniciales={job.logs ?? null}
        errorInicial={job.error ?? null}
        refOrganismoInicial={job.refOrganismo ?? null}
        screenshotsIniciales={job.screenshotUrls ?? []}
      />

      {/* Datos de la solicitud (siempre estáticos) */}
      {job.solicitud?.datos && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-700">Datos de la solicitud</span>
          </div>
          <pre className="p-4 text-xs font-mono text-gray-600 overflow-auto max-h-60 bg-gray-50">
            {JSON.stringify(
              typeof job.solicitud.datos === 'string'
                ? JSON.parse(job.solicitud.datos)
                : job.solicitud.datos,
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  )
}
