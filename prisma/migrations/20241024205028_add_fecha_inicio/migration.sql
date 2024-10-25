/*
  Warnings:

  - Added the required column `fecha_inicio` to the `Junta` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Junta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fecha_inicio" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "Junta_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Junta" ("createdAt", "createdById", "description", "id", "name", "updatedAt") SELECT "createdAt", "createdById", "description", "id", "name", "updatedAt" FROM "Junta";
DROP TABLE "Junta";
ALTER TABLE "new_Junta" RENAME TO "Junta";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
