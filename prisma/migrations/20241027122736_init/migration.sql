-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT '$2b$10$6jXzYyNVXB5V6863yxGIzOC5D.yqNoE1lO9H.hU4UYVKiV5BOh2S6',
    "role" TEXT NOT NULL DEFAULT 'USER',
    "document_type" TEXT,
    "document_number" TEXT,
    "full_name" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "birth_date" TIMESTAMP(3),
    "province" TEXT,
    "district" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Junta" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Junta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JuntaMember" (
    "id" TEXT NOT NULL,
    "juntaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JuntaMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prestamo" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "juntaId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "Prestamo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoPrestamo" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prestamoId" TEXT NOT NULL,

    CONSTRAINT "PagoPrestamo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Multa" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "juntaId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "Multa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Accion" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "juntaId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "Accion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendaItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "juntaId" TEXT NOT NULL,

    CONSTRAINT "AgendaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapitalSocial" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "juntaId" TEXT NOT NULL,

    CONSTRAINT "CapitalSocial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngresoCapital" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capitalSocialId" TEXT NOT NULL,

    CONSTRAINT "IngresoCapital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GastoCapital" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capitalSocialId" TEXT NOT NULL,

    CONSTRAINT "GastoCapital_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "JuntaMember_juntaId_userId_key" ON "JuntaMember"("juntaId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CapitalSocial_juntaId_key" ON "CapitalSocial"("juntaId");

-- AddForeignKey
ALTER TABLE "Junta" ADD CONSTRAINT "Junta_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JuntaMember" ADD CONSTRAINT "JuntaMember_juntaId_fkey" FOREIGN KEY ("juntaId") REFERENCES "Junta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JuntaMember" ADD CONSTRAINT "JuntaMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prestamo" ADD CONSTRAINT "Prestamo_juntaId_fkey" FOREIGN KEY ("juntaId") REFERENCES "Junta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prestamo" ADD CONSTRAINT "Prestamo_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoPrestamo" ADD CONSTRAINT "PagoPrestamo_prestamoId_fkey" FOREIGN KEY ("prestamoId") REFERENCES "Prestamo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Multa" ADD CONSTRAINT "Multa_juntaId_fkey" FOREIGN KEY ("juntaId") REFERENCES "Junta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Multa" ADD CONSTRAINT "Multa_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Accion" ADD CONSTRAINT "Accion_juntaId_fkey" FOREIGN KEY ("juntaId") REFERENCES "Junta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Accion" ADD CONSTRAINT "Accion_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaItem" ADD CONSTRAINT "AgendaItem_juntaId_fkey" FOREIGN KEY ("juntaId") REFERENCES "Junta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitalSocial" ADD CONSTRAINT "CapitalSocial_juntaId_fkey" FOREIGN KEY ("juntaId") REFERENCES "Junta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngresoCapital" ADD CONSTRAINT "IngresoCapital_capitalSocialId_fkey" FOREIGN KEY ("capitalSocialId") REFERENCES "CapitalSocial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GastoCapital" ADD CONSTRAINT "GastoCapital_capitalSocialId_fkey" FOREIGN KEY ("capitalSocialId") REFERENCES "CapitalSocial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
