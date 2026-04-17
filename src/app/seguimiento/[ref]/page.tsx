import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { TimelineEstado } from '@/components/ui/TimelineEstado'
import { getCertificado } from '@/lib/certificados'
import type { Metadata } from 'next'

interface Props {
  params: { ref: string }
}

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: `Seguimiento ${params.ref}`,
    robots: { index: false },
  }
}

const MENSAJES_ESTADO: Record<string, string> = {
  PENDIENTE: 'Tu solicitud está pendiente de pago.',
  EN_PROCESO: 'Hemos recibido tu pago y estamos tramitando tu certificado con el organismo correspondiente.',
  COMPLETADA: 'Tu certificado está listo. Puedes descargarlo abajo.',
  RECHAZADA: 'Tu solicitud no ha podido completarse. Contacta con nosotros para más información.',
}

export default async function SeguimientoPage({ params }: Props) {
  const solicitud = await prisma.solicitud.findUnique({
    where: { referencia: params.ref },
    include: {
      historial: { orderBy: { createdAt: 'asc' } },
      documentos: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!solicitud) notFound()

  const config = getCertificado(solicitud.tipo)
  const mensajeEstado = MENSAJES_ESTADO[solicitud.estado]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">CertiDocs</Link>
          <Link href="/solicitar" className="text-sm text-gray-500 hover:text-gray-700">Nueva solicitud</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-5">

        {/* Estado banner */}
        <div className={`rounded-xl px-5 py-4 text-sm font-medium ${
          solicitud.estado === 'COMPLETADA' ? 'bg-green-50 text-green-800 border border-green-200' :
          solicitud.estado === 'RECHAZADA' ? 'bg-red-50 text-red-800 border border-red-200' :
          solicitud.estado === 'EN_PROCESO' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
          'bg-orange-50 text-orange-800 border border-orange-200'
        }`}>
          {mensajeEstado}
        </div>

        {/* Cabecera solicitud */}
        <div className="card p-6">
          <p className="text-xs text-gray-400 mb-1">Seguimiento de solicitud</p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">{config?.label ?? solicitud.tipo.replace(/_/g, ' ')}</h1>
              <p className="text-sm font-mono text-gray-500 mt-0.5">{solicitud.referencia}</p>
            </div>
            <EstadoBadge estado={solicitud.estado} />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100 text-sm">
            <div>
              <p className="text-gray-400 text-xs">Solicitado</p>
              <p className="font-medium mt-0.5">
                {new Date(solicitud.createdAt).toLocaleDateString('es-ES', { dateStyle: 'medium' })}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Importe</p>
              <p className="font-medium mt-0.5">{solicitud.precio.toFixed(2)} €</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Pago</p>
              <p className={`font-medium mt-0.5 ${solicitud.pagado ? 'text-green-600' : 'text-orange-500'}`}>
                {solicitud.pagado ? 'Confirmado ✓' : 'Pendiente'}
              </p>
            </div>
          </div>
        </div>

        {/* Documentos */}
        {solicitud.documentos.length > 0 && (
          <div className="card p-6">
            <h2 className="font-semibold mb-4">Documentos disponibles</h2>
            <ul className="space-y-2">
              {solicitud.documentos.map((doc) => (
                <li key={doc.id}>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 text-brand-600 hover:text-brand-800 text-sm font-medium bg-brand-50 hover:bg-brand-100 transition-colors rounded-lg px-4 py-3"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {doc.nombre}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Historial */}
        <div className="card p-6">
          <h2 className="font-semibold mb-5">Historial de estado</h2>
          <TimelineEstado historial={solicitud.historial} />
        </div>

        {/* CTA invitado */}
        {!solicitud.userId && (
          <div className="card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-medium text-sm">¿Quieres gestionar tus solicitudes fácilmente?</p>
              <p className="text-xs text-gray-500 mt-0.5">Crea una cuenta gratis y ten todas tus solicitudes en un panel.</p>
            </div>
            <Link href="/auth/registro" className="btn-primary text-sm flex-shrink-0">
              Crear cuenta gratis
            </Link>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">
          ¿Tienes dudas? Escríbenos a{' '}
          <a href="mailto:soporte@certidocs.es" className="hover:underline text-gray-500">soporte@certidocs.es</a>
        </p>
      </main>
    </div>
  )
}
