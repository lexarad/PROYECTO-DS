import { prisma } from '@/lib/prisma'

export type TipoNotificacion = 'ESTADO_CAMBIADO' | 'MENSAJE' | 'DOCUMENTO' | 'PAGO'

export async function crearNotificacion(
  userId: string,
  tipo: TipoNotificacion,
  titulo: string,
  cuerpo: string,
  enlace?: string,
): Promise<void> {
  try {
    await prisma.notificacion.create({
      data: { userId, tipo, titulo, cuerpo, enlace: enlace ?? null },
    })
    // Limitar a 200 notificaciones por usuario (borra las más antiguas)
    const total = await prisma.notificacion.count({ where: { userId } })
    if (total > 200) {
      const oldest = await prisma.notificacion.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        take: total - 200,
        select: { id: true },
      })
      await prisma.notificacion.deleteMany({ where: { id: { in: oldest.map(n => n.id) } } })
    }
  } catch {
    // best-effort: no bloquear el flujo principal
  }
}
