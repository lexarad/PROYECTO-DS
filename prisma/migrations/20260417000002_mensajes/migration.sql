-- CreateTable
CREATE TABLE "mensajes" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "userId" TEXT,
    "autorRol" "Role" NOT NULL,
    "contenido" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensajes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mensajes_solicitudId_idx" ON "mensajes"("solicitudId");

-- AddForeignKey
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
