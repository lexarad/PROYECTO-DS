-- CreateTable
CREATE TABLE "precio_config" (
    "tipo" TEXT NOT NULL,
    "precioBase" DOUBLE PRECISION NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "descripcion" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "precio_config_pkey" PRIMARY KEY ("tipo")
);
