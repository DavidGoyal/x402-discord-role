/*
  Warnings:

  - Added the required column `ownerAddress` to the `Server` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Server" ADD COLUMN     "ownerAddress" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Server_ownerAddress_idx" ON "Server"("ownerAddress");
