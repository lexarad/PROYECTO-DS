-- AlterTable: add referral fields to users
ALTER TABLE "users"
  ADD COLUMN "referralCode"  TEXT UNIQUE,
  ADD COLUMN "referidoPorId" TEXT;

-- AddForeignKey: self-referential referral link
ALTER TABLE "users"
  ADD CONSTRAINT "users_referidoPorId_fkey"
  FOREIGN KEY ("referidoPorId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: referral credits
CREATE TABLE "creditos_referido" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "referidoId"  TEXT NOT NULL,
  "codigoPromo" TEXT,
  "cantidad"    DOUBLE PRECISION NOT NULL DEFAULT 5,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "creditos_referido_pkey" PRIMARY KEY ("id")
);

-- UniqueIndex: one credit per referred user
CREATE UNIQUE INDEX "creditos_referido_referidoId_key" ON "creditos_referido"("referidoId");

-- AddForeignKey: credits → users
ALTER TABLE "creditos_referido"
  ADD CONSTRAINT "creditos_referido_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
