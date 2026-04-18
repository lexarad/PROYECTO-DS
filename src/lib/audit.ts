import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

export type AccionAudit =
  | 'ESTADO_CAMBIADO'
  | 'DOCUMENTO_AÑADIDO'
  | 'REEMBOLSO'
  | 'PAGO_CONFIRMADO'
  | 'NOTA_ACTUALIZADA'
  | 'MENSAJE_ENVIADO'
  | 'BULK_ESTADO'
  | 'PROMO_CREADA'
  | 'PROMO_ELIMINADA'
  | 'JOB_RETRY'
  | 'JOB_RESOLUCION_MANUAL'
  | 'USUARIO_ACTUALIZADO'
  | 'VISTA_USUARIO'
  | 'PRECIO_ACTUALIZADO'
  | 'PRECIO_ELIMINADO'

export async function registrarAudit(
  adminId: string,
  adminEmail: string,
  accion: AccionAudit,
  entidad: string,
  entidadId: string,
  resumen: string,
  req?: NextRequest,
): Promise<void> {
  try {
    const ip = req
      ? (req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? null)
      : null
    await prisma.auditLog.create({
      data: { adminId, adminEmail, accion, entidad, entidadId, resumen, ip },
    })
  } catch {
    // best-effort: no bloquear el flujo principal
  }
}
