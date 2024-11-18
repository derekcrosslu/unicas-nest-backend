-- AlterTable
ALTER TABLE "Accion" ADD COLUMN     "agendaItemId" TEXT;

-- AlterTable
ALTER TABLE "Multa" ADD COLUMN     "agendaItemId" TEXT;

-- AlterTable
ALTER TABLE "PagoPrestamoNew" ADD COLUMN     "agendaItemId" TEXT;

-- AlterTable
ALTER TABLE "PrestamoNew" ADD COLUMN     "agendaItemId" TEXT;

-- CreateTable
CREATE TABLE "Asistencia" (
    "id" TEXT NOT NULL,
    "asistio" BOOLEAN NOT NULL DEFAULT false,
    "fecha" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "agendaItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Asistencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserAgendaItems" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Asistencia_agendaItemId_idx" ON "Asistencia"("agendaItemId");

-- CreateIndex
CREATE INDEX "Asistencia_userId_idx" ON "Asistencia"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "_UserAgendaItems_AB_unique" ON "_UserAgendaItems"("A", "B");

-- CreateIndex
CREATE INDEX "_UserAgendaItems_B_index" ON "_UserAgendaItems"("B");

-- CreateIndex
CREATE INDEX "Accion_memberId_idx" ON "Accion"("memberId");

-- CreateIndex
CREATE INDEX "Accion_agendaItemId_idx" ON "Accion"("agendaItemId");

-- CreateIndex
CREATE INDEX "AgendaItem_juntaId_idx" ON "AgendaItem"("juntaId");

-- CreateIndex
CREATE INDEX "CapitalMovement_prestamoId_idx" ON "CapitalMovement"("prestamoId");

-- CreateIndex
CREATE INDEX "CapitalMovement_multaId_idx" ON "CapitalMovement"("multaId");

-- CreateIndex
CREATE INDEX "CapitalMovement_accionId_idx" ON "CapitalMovement"("accionId");

-- CreateIndex
CREATE INDEX "CapitalMovement_pagoId_idx" ON "CapitalMovement"("pagoId");

-- CreateIndex
CREATE INDEX "GastoCapital_capitalSocialId_idx" ON "GastoCapital"("capitalSocialId");

-- CreateIndex
CREATE INDEX "IngresoCapital_capitalSocialId_idx" ON "IngresoCapital"("capitalSocialId");

-- CreateIndex
CREATE INDEX "Junta_createdById_idx" ON "Junta"("createdById");

-- CreateIndex
CREATE INDEX "JuntaMember_juntaId_idx" ON "JuntaMember"("juntaId");

-- CreateIndex
CREATE INDEX "JuntaMember_userId_idx" ON "JuntaMember"("userId");

-- CreateIndex
CREATE INDEX "Multa_juntaId_idx" ON "Multa"("juntaId");

-- CreateIndex
CREATE INDEX "Multa_memberId_idx" ON "Multa"("memberId");

-- CreateIndex
CREATE INDEX "Multa_agendaItemId_idx" ON "Multa"("agendaItemId");

-- CreateIndex
CREATE INDEX "PagoPrestamo_prestamoId_idx" ON "PagoPrestamo"("prestamoId");

-- CreateIndex
CREATE INDEX "PagoPrestamoNew_prestamoId_idx" ON "PagoPrestamoNew"("prestamoId");

-- CreateIndex
CREATE INDEX "PagoPrestamoNew_agendaItemId_idx" ON "PagoPrestamoNew"("agendaItemId");

-- CreateIndex
CREATE INDEX "Prestamo_juntaId_idx" ON "Prestamo"("juntaId");

-- CreateIndex
CREATE INDEX "Prestamo_memberId_idx" ON "Prestamo"("memberId");

-- CreateIndex
CREATE INDEX "PrestamoNew_agendaItemId_idx" ON "PrestamoNew"("agendaItemId");

-- CreateIndex
CREATE INDEX "PrestamoNew_memberId_idx" ON "PrestamoNew"("memberId");

-- CreateIndex
CREATE INDEX "PrestamoNew_avalId_idx" ON "PrestamoNew"("avalId");

-- CreateIndex
CREATE INDEX "PrestamoNew_juntaId_idx" ON "PrestamoNew"("juntaId");

-- AddForeignKey
ALTER TABLE "PrestamoNew" ADD CONSTRAINT "PrestamoNew_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES "AgendaItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Accion" ADD CONSTRAINT "Accion_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES "AgendaItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Multa" ADD CONSTRAINT "Multa_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES "AgendaItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoPrestamoNew" ADD CONSTRAINT "PagoPrestamoNew_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES "AgendaItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES "AgendaItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserAgendaItems" ADD CONSTRAINT "_UserAgendaItems_A_fkey" FOREIGN KEY ("A") REFERENCES "AgendaItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserAgendaItems" ADD CONSTRAINT "_UserAgendaItems_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
