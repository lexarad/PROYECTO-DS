import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { SelectorEstado } from '@/components/admin/SelectorEstado'
import { FormularioDocumento } from '@/components/admin/FormularioDocumento'
import { TimelineEstado } from '@/components/ui/TimelineEstado'
import { NotasInternas } from '@/components/admin/NotasInternas'
import { getCertificado } from '@/lib/certificados'

interface Props {
  params: { id: string }
}

export default async function AdminDetalleSolicitudPage({ params }: Props) {
  const solicitud = await prisma.solicitud.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true } },
      documentos: { orderBy: { createdAt: 'desc' } },
      historial: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!solicitud) notFound()

  const config = getCertificado(solicitud.tipo)
  const datos = solicitud.datos as Record<string, string>

  return (
    <div className="max-w-4xl space-y-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">← Volver</Link>
          <h1 className="text-2xl font-bold mt-1">{config?.label ?? solicitud.tipo}</h1>
          <p className="text-gray-500 font-mono text-sm">{solicitud.referencia}</p>
        </div>
        <EstadoBadge estado={solicitud.estado} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">

          {/* Datos de la solicitud */}
          <div className="card p-6">
            <h2 className="font-semibold mb-4">Datos del certificado</h2>
            {config ? (() => {
              // Group by seccion
              const secciones: { titulo: string | undefined; campos: typeof config.campos }[] = []
              for (const campo of config.campos) {
                const last = secciones[secciones.length - 1]
                if (!last || last.titulo !== campo.seccion) secciones.push({ titulo: campo.seccion, campos: [campo] })
                else last.campos.push(campo)
              }
              return (
                <div className="space-y-5">
                  {secciones.map((sec, si) => (
                    <div key={si}>
                      {sec.titulo && (
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 pb-1 mb-2">
                          {sec.titulo}
                        </p>
                      )}
                      <dl className="space-y-2">
                        {sec.campos.map((campo) => (
                          <div key={campo.nombre} className="flex gap-4">
                            <dt className="text-sm text-gray-500 w-44 shrink-0">{campo.label}</dt>
                            <dd className="text-sm font-medium">{datos[campo.nombre] || '—'}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>
              )
            })() : (
              <dl className="space-y-3">
                {Object.entries(datos).map(([k, v]) => (
                  <div key={k} className="flex gap-4">
                    <dt className="text-sm text-gray-500 w-44 shrink-0 capitalize">{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</dt>
                    <dd className="text-sm font-medium">{v || '—'}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* Historial */}
          <div className="card p-6">
            <h2 className="font-semibold mb-5">Historial de estado</h2>
            <TimelineEstado historial={solicitud.historial} />
          </div>

          {/* Documentos */}
          <div className="card p-6">
            <h2 className="font-semibold mb-4">Documentos entregados</h2>

            {solicitud.documentos.length > 0 ? (
              <ul className="space-y-2 mb-6">
                {solicitud.documentos.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <a href={doc.url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline text-sm font-medium">
                        {doc.nombre}
                      </a>
                      <p className="text-xs text-gray-400">{new Date(doc.createdAt).toLocaleDateString('es-ES')}</p>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{doc.tipo}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 mb-4">No hay documentos adjuntos.</p>
            )}

            <FormularioDocumento solicitudId={solicitud.id} />
          </div>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">

          {/* Cliente */}
          <div className="card p-6">
            <h2 className="font-semibold mb-3">Cliente</h2>
            <p className="font-medium text-sm">{solicitud.user?.name ?? '—'}</p>
            <p className="text-sm text-gray-500">{solicitud.user?.email ?? solicitud.emailInvitado ?? '—'}</p>
            {solicitud.user ? (
              <p className="text-xs text-gray-400 mt-2">
                Registrado el {new Date(solicitud.user.createdAt).toLocaleDateString('es-ES')}
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-2">Invitado (sin cuenta)</p>
            )}
          </div>

          {/* Pago */}
          <div className="card p-6">
            <h2 className="font-semibold mb-3">Pago</h2>
            <p className="text-2xl font-bold text-gray-900">{solicitud.precio.toFixed(2)} €</p>
            <p className="text-sm mt-1">
              {solicitud.pagado ? (
                <span className="text-green-600 font-medium">Pagado</span>
              ) : (
                <span className="text-orange-600 font-medium">Pendiente de pago</span>
              )}
            </p>
            {solicitud.stripeSessionId && (
              <p className="text-xs text-gray-400 mt-2 font-mono break-all">{solicitud.stripeSessionId}</p>
            )}
          </div>

          {/* Cambiar estado */}
          <div className="card p-6">
            <h2 className="font-semibold mb-3">Cambiar estado</h2>
            <SelectorEstado solicitudId={solicitud.id} estadoActual={solicitud.estado} />
          </div>

          {/* Notas internas */}
          <div className="card p-6">
            <h2 className="font-semibold mb-3">Notas internas</h2>
            <NotasInternas solicitudId={solicitud.id} notasIniciales={solicitud.notas} />
          </div>

          {/* Notas */}
          <div className="card p-6">
            <h2 className="font-semibold mb-3">Fechas</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Creada</dt>
                <dd>{new Date(solicitud.createdAt).toLocaleDateString('es-ES')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Actualizada</dt>
                <dd>{new Date(solicitud.updatedAt).toLocaleDateString('es-ES')}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
