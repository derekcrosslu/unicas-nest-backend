-- CreateTable
CREATE TABLE "PerformanceMetric" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "pathname" TEXT NOT NULL,
    "searchParams" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "navigationStart" DOUBLE PRECISION,
    "navigationDuration" DOUBLE PRECISION,
    "elementId" TEXT,
    "elementTag" TEXT,
    "url" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PerformanceMetric_type_timestamp_idx" ON "PerformanceMetric"("type", "timestamp");
