-- CreateTable
CREATE TABLE "PrestamoNew" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "request_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monthly_interest" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "number_of_installments" INTEGER NOT NULL DEFAULT 1,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "rejected" BOOLEAN NOT NULL DEFAULT false,
    "rejection_reason" TEXT,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "remaining_amount" DOUBLE PRECISION NOT NULL,
    "loan_type" TEXT NOT NULL DEFAULT 'REGULAR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "juntaId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "original_prestamo_id" TEXT,

    CONSTRAINT "PrestamoNew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoPrestamoNew" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prestamoId" TEXT NOT NULL,
    "original_pago_id" TEXT,

    CONSTRAINT "PagoPrestamoNew_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrestamoNew_original_prestamo_id_idx" ON "PrestamoNew"("original_prestamo_id");

-- CreateIndex
CREATE INDEX "PagoPrestamoNew_original_pago_id_idx" ON "PagoPrestamoNew"("original_pago_id");

-- AddForeignKey
ALTER TABLE "PrestamoNew" ADD CONSTRAINT "PrestamoNew_juntaId_fkey" FOREIGN KEY ("juntaId") REFERENCES "Junta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestamoNew" ADD CONSTRAINT "PrestamoNew_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoPrestamoNew" ADD CONSTRAINT "PagoPrestamoNew_prestamoId_fkey" FOREIGN KEY ("prestamoId") REFERENCES "PrestamoNew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
