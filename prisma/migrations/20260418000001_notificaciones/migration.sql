-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "enlace" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notificaciones_userId_leida_idx" ON "notificaciones"("userId", "leida");

-- CreateIndex
CREATE INDEX "notificaciones_userId_createdAt_idx" ON "notificaciones"("userId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
