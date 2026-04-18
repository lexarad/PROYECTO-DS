-- CreateTable
CREATE TABLE "adjuntos" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "blobPathname" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tamanio" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adjuntos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "adjuntos_solicitudId_idx" ON "adjuntos"("solicitudId");

-- AddForeignKey
ALTER TABLE "adjuntos" ADD CONSTRAINT "adjuntos_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
