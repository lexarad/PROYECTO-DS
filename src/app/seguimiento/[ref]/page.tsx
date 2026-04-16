import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { TimelineEstado } from '@/components/ui/TimelineEstado'
import { getCertificado } from '@/lib/certificados'

interface Props {
  params: { ref: string }
}

export default async function SeguimientoPage({ params }: Props) {
  const solicitud = await prisma.solicitud.findUnique({
    where: { referencia: params.ref },
    include: {
      historial: { orderBy: { createdAt: 'desc' } },
      documentos: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!solicitud) notFound()

  const config = getCertificado(solicitud.tipo)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">CertiDocs</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        {/* Cabecera */}
        <div className="card p-6">
          <p className="text-xs text-gray-400 mb-1">Seguimiento de solicitud</p>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold">{config?.label ?? solicitud.tipo}</h1>
              <p className="text-sm font-mono text-gray-500 mt-0.5">{solicitud.referencia}</p>
            </div>
            <EstadoBadge estado={solicitud.estado} />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-gray-100 text-sm">
            <div>
              <p className="text-gray-400">Solicitado</p>
              <p className="font-medium">
                {new Date(solicitud.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Importe</p>
              <p className="font-medium">{solicitud.precio.toFixed(2)} €</p>
            </div>
            <div>
              <p className="text-gray-400">Pago</p>
              <p className={`font-medium ${solicitud.pagado ? 'text-green-600' : 'text-orange-600'}`}>
                {solicitud.pagado ? 'Confirmado' : 'Pendiente'}
              </p>
            </div>
          </div>
        </div>

        {/* Historial */}
        <div className="card p-6">
          <h2 className="font-semibold mb-5">Historial de estado</h2>
          <TimelineEstado historial={solicitud.historial} />
        </div>

        {/* Documentos disponibles */}
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
                    className="flex items-center gap-2 text-brand-600 hover:underline text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <p className="text-center text-xs text-gray-400">
          ¿Tienes dudas? Escríbenos a{' '}
          <a href="mailto:soporte@certidocs.es" className="hover:underline">soporte@certidocs.es</a>
        </p>
      </main>
    </div>
  )
}
