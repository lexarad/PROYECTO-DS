import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { BotonPago } from '@/components/ui/BotonPago'
import { getCertificado } from '@/lib/certificados'

interface Props {
  params: { id: string }
  searchParams: { cancelado?: string }
}

export default async function DetalleSolicitudPage({ params, searchParams }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const solicitud = await prisma.solicitud.findUnique({
    where: { id: params.id, userId: session.user.id },
    include: { documentos: true },
  })

  if (!solicitud) notFound()

  const config = getCertificado(solicitud.tipo)
  const datos = solicitud.datos as Record<string, string>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">CertiDocs</Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Mis solicitudes</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {/* Aviso cancelación */}
        {searchParams.cancelado && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg">
            El pago fue cancelado. Puedes intentarlo de nuevo cuando quieras.
          </div>
        )}

        {/* Cabecera */}
        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">{config?.label ?? solicitud.tipo}</h1>
              <p className="text-sm text-gray-500">Ref: <span className="font-mono">{solicitud.referencia}</span></p>
            </div>
            <EstadoBadge estado={solicitud.estado} />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              <p className="text-sm text-gray-500">Fecha de solicitud</p>
              <p className="font-medium">{new Date(solicitud.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Importe</p>
              <p className="text-2xl font-bold text-brand-600">{solicitud.precio.toFixed(2)} €</p>
            </div>
          </div>
        </div>

        {/* Datos del formulario */}
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Datos de la solicitud</h2>
          <dl className="space-y-3">
            {config?.campos.map((campo) => (
              <div key={campo.nombre} className="flex gap-4">
                <dt className="text-sm text-gray-500 w-40 shrink-0">{campo.label}</dt>
                <dd className="text-sm font-medium">{datos[campo.nombre] || '—'}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Documentos entregados */}
        {solicitud.documentos.length > 0 && (
          <div className="card p-6">
            <h2 className="font-semibold mb-4">Documentos</h2>
            <ul className="space-y-2">
              {solicitud.documentos.map((doc) => (
                <li key={doc.id}>
                  <a href={doc.url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline text-sm">
                    {doc.nombre}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pago */}
        {!solicitud.pagado && (
          <div className="card p-6">
            <h2 className="font-semibold mb-2">Pago pendiente</h2>
            <p className="text-sm text-gray-500 mb-4">
              Completa el pago para que comencemos a tramitar tu solicitud.
            </p>
            <BotonPago solicitudId={solicitud.id} precio={solicitud.precio} />
          </div>
        )}

        {solicitud.pagado && solicitud.estado === 'EN_PROCESO' && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-3 rounded-lg">
            Pago recibido. Estamos tramitando tu certificado. Te avisaremos por email cuando esté listo.
          </div>
        )}
      </main>
    </div>
  )
}
