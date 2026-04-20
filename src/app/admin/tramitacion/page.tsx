import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { AccionesTramitacion } from '@/components/admin/AccionesTramitacion'
import { getCertificado } from '@/lib/certificados'
import { AutomatizarBtn } from '@/components/admin/AutomatizarBtn'
import { esAutomatizable } from '@/lib/automatizacion/runner'

const ENLACES_ORGANISMO: Record<string, { url: string; label: string }> = {
  NACIMIENTO:           { url: 'https://sede.mjusticia.gob.es/tramites/certificado-nacimiento', label: 'MJ · Nacimiento' },
  MATRIMONIO:           { url: 'https://sede.mjusticia.gob.es/tramites/certificado-matrimonio', label: 'MJ · Matrimonio' },
  DEFUNCION:            { url: 'https://sede.mjusticia.gob.es/tramites/certificado-defuncion', label: 'MJ · Defunción' },
  EMPADRONAMIENTO:      { url: 'https://www.padron.gob.es', label: 'Ayuntamiento' },
  ANTECEDENTES_PENALES: { url: 'https://sede.mjusticia.gob.es/tramites/certificado-antecedentes-penales', label: 'MJ · Antecedentes' },
  VIDA_LABORAL:         { url: 'https://portal.seg-social.gob.es/wps/portal/importass/importass/Ciudadanos/vidaLaboral', label: 'Seg. Social' },
  ULTIMAS_VOLUNTADES:   { url: 'https://sede.mjusticia.gob.es/tramites/certificado-ultimas-voluntades', label: 'MJ · Últ. Voluntades' },
  SEGUROS_FALLECIMIENTO:{ url: 'https://sede.mjusticia.gob.es/tramites/certificado-contratos-seguros', label: 'MJ · Seguros' },
  OCR_EXTRACCION:       { url: '', label: 'Procesado interno (IA)' },
  TITULARIDAD_INMUEBLE: { url: 'https://www.registradores.org/', label: 'Registro de la Propiedad' },
}

function DatosCertificado({ tipo, datos }: { tipo: string; datos: Record<string, string> }) {
  const config = getCertificado(tipo)
  if (!config) {
    return (
      <dl className="space-y-1.5">
        {Object.entries(datos).slice(0, 6).map(([k, v]) => (
          <div key={k} className="flex gap-2 text-sm">
            <dt className="text-gray-400 min-w-0 shrink-0 capitalize">{k.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').toLowerCase()}:</dt>
            <dd className="font-medium text-gray-800 truncate">{v || '—'}</dd>
          </div>
        ))}
      </dl>
    )
  }

  // Show up to 8 fields with proper labels, skipping solicitante section
  const campos = config.campos
    .filter((c) => c.seccion !== 'Tus datos (solicitante)')
    .slice(0, 8)

  return (
    <dl className="space-y-1.5">
      {campos.map((campo) => (
        <div key={campo.nombre} className="flex gap-2 text-sm">
          <dt className="text-gray-400 shrink-0 w-36 truncate">{campo.label}:</dt>
          <dd className="font-medium text-gray-800 truncate">{datos[campo.nombre] || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

function SolicitanteDatos({ datos }: { datos: Record<string, string> }) {
  const nombre = [datos.solNombre, datos.solApellido1, datos.solApellido2].filter(Boolean).join(' ')
  const telefono = datos.solTelefono ?? datos.telefono ?? '—'
  const dir = [datos.solDireccion, datos.solCp, datos.solMunicipio, datos.solProvincia].filter(Boolean).join(', ')
  return (
    <dl className="space-y-1 text-sm">
      <div className="flex gap-2"><dt className="text-gray-400 w-20 shrink-0">Nombre:</dt><dd className="font-medium">{nombre || '—'}</dd></div>
      <div className="flex gap-2"><dt className="text-gray-400 w-20 shrink-0">Tel:</dt><dd className="font-medium">{telefono}</dd></div>
      {dir && <div className="flex gap-2"><dt className="text-gray-400 w-20 shrink-0">Dirección:</dt><dd className="font-medium text-xs leading-snug">{dir}</dd></div>}
    </dl>
  )
}

function TarjetaEncargo({
  s,
  showOrganismo,
}: {
  s: Awaited<ReturnType<typeof prisma.solicitud.findMany>>[number] & {
    user: { name: string | null; email: string } | null
    automatizacion?: { id: string; estado: string } | null
  }
  showOrganismo: boolean
}) {
  const datos = s.datos as Record<string, string>
  const enlace = ENLACES_ORGANISMO[s.tipo]
  const emailCliente = s.user?.email ?? s.emailInvitado ?? '—'
  const nombreCliente = s.user?.name ?? s.emailInvitado ?? 'Invitado'
  const diasEspera = Math.floor((Date.now() - new Date(s.updatedAt).getTime()) / 86400000)

  return (
    <div className="card p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-xs text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded">
            {s.referencia}
          </span>
          <span className="font-semibold text-gray-800 text-sm">
            {s.tipo.replace(/_/g, ' ')}
          </span>
          <EstadoBadge estado={s.estado} />
          {diasEspera >= 2 && s.estado !== 'COMPLETADA' && (
            <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
              {diasEspera}d en espera
            </span>
          )}
        </div>
        <span className="text-sm font-bold text-gray-700 shrink-0">{s.precio.toFixed(2)} €</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">

        {/* Datos del certificado */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Datos del certificado</p>
          <DatosCertificado tipo={s.tipo} datos={datos} />
        </div>

        {/* Solicitante */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Solicitante</p>
          <SolicitanteDatos datos={datos} />
          <div className="mt-3 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-medium">{nombreCliente}</p>
            <p className="text-xs text-gray-400">{emailCliente}</p>
            {!s.userId && (
              <span className="mt-1 inline-block text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Invitado</span>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="px-5 py-4 flex flex-col gap-2 justify-center">
          {showOrganismo && (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tramitar en</p>
              {esAutomatizable(s.tipo) ? (
                <AutomatizarBtn
                  solicitudId={s.id}
                  jobExistente={s.automatizacion ?? null}
                />
              ) : enlace ? (
                <a
                  href={enlace.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary text-sm text-center"
                >
                  {enlace.label} →
                </a>
              ) : null}
            </>
          )}
          <AccionesTramitacion solicitudId={s.id} estadoActual={s.estado} />
          <Link
            href={`/admin/solicitudes/${s.id}`}
            className="btn-secondary text-sm text-center"
          >
            Ver detalles
          </Link>
          <Link
            href={`/seguimiento/${s.referencia}`}
            target="_blank"
            className="text-xs text-center text-gray-400 hover:text-gray-600 hover:underline"
          >
            Vista del cliente →
          </Link>
        </div>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'

export default async function TramitacionPage() {
  const [enProceso, tramitados, completadasRecientes, totalCompletadas, jobsManuales, jobsEnProceso] = await Promise.all([
    prisma.solicitud.findMany({
      where: { pagado: true, estado: 'EN_PROCESO' },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { name: true, email: true } }, automatizacion: { select: { id: true, estado: true } } },
    }),
    prisma.solicitud.findMany({
      where: { pagado: true, estado: 'TRAMITADO' },
      orderBy: { updatedAt: 'asc' },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.solicitud.findMany({
      where: {
        estado: 'COMPLETADA',
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.solicitud.count({ where: { estado: 'COMPLETADA' } }),
    (prisma as any).automatizacionJob.findMany({
      where: { estado: 'REQUIERE_MANUAL' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        tipo: true,
        error: true,
        intentos: true,
        createdAt: true,
        solicitud: { select: { id: true, referencia: true } },
      },
    }),
    (prisma as any).automatizacionJob.findMany({
      where: { estado: { in: ['EN_CURSO', 'FALLIDO'] } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        tipo: true,
        estado: true,
        intentos: true,
        createdAt: true,
        solicitud: { select: { id: true, referencia: true } },
      },
    }),
  ])

  const hayActividad = enProceso.length > 0 || tramitados.length > 0

  return (
    <div className="space-y-8">
      {/* Alerta: jobs que requieren tramitación manual */}
      {(jobsManuales as any[]).length > 0 && (
        <div className="bg-orange-50 border border-orange-300 rounded-xl px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="text-orange-500 text-xl mt-0.5">!</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-orange-900 text-sm">
                {(jobsManuales as any[]).length} encargo{(jobsManuales as any[]).length !== 1 ? 's requieren' : ' requiere'} tramitación manual en la sede del Ministerio
              </p>
              <p className="text-xs text-orange-700 mt-0.5 mb-3">
                El bot no pudo completar estos casos automáticamente. Accede a cada job para ver el motivo, tramitar en la sede electrónica y registrar el resultado.
              </p>
              <div className="space-y-2">
                {(jobsManuales as any[]).map((j: any) => (
                  <div key={j.id} className="flex items-center justify-between gap-4 bg-white border border-orange-200 rounded-lg px-4 py-2.5">
                    <div className="min-w-0">
                      <span className="font-mono text-xs text-gray-500 mr-2">{j.solicitud?.referencia ?? '—'}</span>
                      <span className="text-sm font-medium text-gray-700">{j.tipo?.replace(/_/g, ' ')}</span>
                      {j.error && (
                        <p className="text-xs text-red-600 mt-0.5 truncate max-w-xs">{j.error}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400">{j.intentos} intentos</span>
                      <Link
                        href={`/admin/automatizacion/${j.id}`}
                        className="text-xs font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        Gestionar →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerta: jobs en proceso automático */}
      {(jobsEnProceso as any[]).length > 0 && (
        <div className="bg-blue-50 border border-blue-300 rounded-xl px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="text-blue-500 text-xl mt-0.5">⟳</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-blue-900 text-sm">
                {(jobsEnProceso as any[]).length} encargo{(jobsEnProceso as any[]).length !== 1 ? 's están' : ' está'} siendo procesado{(jobsEnProceso as any[]).length !== 1 ? 's' : ''} automáticamente
              </p>
              <p className="text-xs text-blue-700 mt-0.5 mb-3">
                El bot está trabajando en estos casos. Se completarán automáticamente cuando el organismo responda.
              </p>
              <div className="space-y-2">
                {(jobsEnProceso as any[]).map((j: any) => (
                  <div key={j.id} className="flex items-center justify-between gap-4 bg-white border border-blue-200 rounded-lg px-4 py-2.5">
                    <div className="min-w-0">
                      <span className="font-mono text-xs text-gray-500 mr-2">{j.solicitud?.referencia ?? '—'}</span>
                      <span className="text-sm font-medium text-gray-700">{j.tipo?.replace(/_/g, ' ')}</span>
                      <p className="text-xs text-blue-600 mt-0.5">Estado: {j.estado} ({j.intentos} intentos)</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/admin/automatizacion/${j.id}`}
                        className="text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        Ver progreso →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cola de tramitación</h1>
          <p className="text-sm text-gray-500 mt-0.5">Seguimiento de todos los encargos pagados</p>
        </div>
        <div className="flex gap-3 text-sm flex-wrap justify-end">
          {enProceso.length > 0 && (
            <span className="bg-blue-50 text-blue-700 font-semibold px-3 py-1.5 rounded-lg">
              {enProceso.length} pendiente{enProceso.length !== 1 ? 's' : ''} de enviar
            </span>
          )}
          {tramitados.length > 0 && (
            <span className="bg-orange-50 text-orange-700 font-semibold px-3 py-1.5 rounded-lg">
              {tramitados.length} esperando al organismo
            </span>
          )}
          <span className="bg-green-50 text-green-700 font-semibold px-3 py-1.5 rounded-lg">
            {totalCompletadas} completadas en total
          </span>
        </div>
      </div>

      {/* Sección 1: Acción requerida */}
      {enProceso.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="font-semibold text-gray-800">Acción requerida — enviar formulario al organismo</h2>
            <span className="text-xs text-gray-500">({enProceso.length})</span>
          </div>
          <div className="space-y-4">
            {enProceso.map((s) => (
              <TarjetaEncargo key={s.id} s={s} showOrganismo={true} />
            ))}
          </div>
        </section>
      )}

      {/* Sección 2: Esperando al organismo */}
      {tramitados.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
            <h2 className="font-semibold text-gray-800">Esperando al organismo — certificado pendiente de recibir</h2>
            <span className="text-xs text-gray-500">({tramitados.length})</span>
          </div>
          <div className="space-y-4">
            {tramitados.map((s) => (
              <TarjetaEncargo key={s.id} s={s} showOrganismo={false} />
            ))}
          </div>
        </section>
      )}

      {/* Cola vacía */}
      {!hayActividad && (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="font-semibold text-gray-700">Cola vacía</p>
          <p className="text-sm text-gray-400 mt-1">No hay encargos pendientes de tramitar</p>
        </div>
      )}

      {/* Sección 3: Completadas recientemente */}
      {completadasRecientes.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <h2 className="font-semibold text-gray-700">Completadas en los últimos 7 días</h2>
            <span className="text-xs text-gray-500">({completadasRecientes.length})</span>
          </div>
          <div className="space-y-3">
            {completadasRecientes.map((s) => (
              <div key={s.id} className="card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs text-gray-400">{s.referencia}</span>
                  <span className="text-sm font-medium text-gray-700">{s.tipo.replace(/_/g, ' ')}</span>
                  <EstadoBadge estado={s.estado} />
                </div>
                <div className="flex items-center gap-3 text-sm shrink-0">
                  <span className="text-gray-400 text-xs">
                    {new Date(s.updatedAt).toLocaleDateString('es-ES', { dateStyle: 'medium' })}
                  </span>
                  <Link href={`/admin/solicitudes/${s.id}`} className="text-brand-600 hover:underline text-xs">
                    Ver →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
