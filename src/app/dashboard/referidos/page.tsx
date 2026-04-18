import { PanelReferidos } from '@/components/dashboard/PanelReferidos'

export const metadata = { title: 'Programa de referidos – CertiDocs' }

export default function ReferidosPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Programa de referidos</h1>
        <p className="text-gray-500 mt-1">
          Invita a colegas o amigos y gana descuentos cuando hagan su primera compra.
        </p>
      </div>

      <div className="card p-4 bg-blue-50 border border-blue-200 mb-6">
        <p className="text-sm text-blue-800 font-medium">¿Cómo funciona?</p>
        <ol className="text-sm text-blue-700 mt-2 space-y-1 list-decimal list-inside">
          <li>Comparte tu enlace de referido con quien quieras</li>
          <li>Se registran y hacen su primera solicitud de certificado</li>
          <li>Recibes automáticamente un código de <strong>15% de descuento</strong> por email</li>
          <li>Aplica el código en tu próxima solicitud (válido 90 días)</li>
        </ol>
      </div>

      <PanelReferidos />
    </div>
  )
}
