import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCertificado } from '@/lib/certificados'
import { SeguimientoPoller } from '@/components/ui/SeguimientoPoller'
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

export const dynamic = 'force-dynamic'

export default async function SeguimientoPage({ params }: Props) {
  const solicitud = await prisma.solicitud.findUnique({
    where: { referencia: params.ref },
    select: {
      tipo: true,
      referencia: true,
      precio: true,
      pagado: true,
      userId: true,
      estado: true,
      createdAt: true,
      historial: { orderBy: { createdAt: 'asc' }, select: { estado: true, nota: true, createdAt: true } },
      documentos: { orderBy: { createdAt: 'desc' }, select: { id: true, nombre: true, url: true } },
    },
  })

  if (!solicitud) notFound()

  const config = getCertificado(solicitud.tipo)

  const initialData = {
    estado: solicitud.estado,
    pagado: solicitud.pagado,
    historial: solicitud.historial.map(h => ({
      ...h,
      createdAt: h.createdAt.toISOString(),
    })),
    documentos: solicitud.documentos,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-700">CertiDocs</Link>
          <Link href="/solicitar" className="text-sm text-gray-500 hover:text-gray-700">Nueva solicitud</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-5">

        {/* Cabecera solicitud (estática) */}
        <div className="card p-6">
          <p className="text-xs text-gray-400 mb-1">Seguimiento de solicitud</p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">{config?.label ?? solicitud.tipo.replace(/_/g, ' ')}</h1>
              <p className="text-sm font-mono text-gray-500 mt-0.5">{solicitud.referencia}</p>
            </div>
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

        {/* Polling section — estado, documentos, historial */}
        <SeguimientoPoller ref_={params.ref} initialData={initialData} />

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
