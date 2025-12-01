/*
  Warnings:

  - You are about to drop the column `roleId` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `serverId` on the `Server` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[serverDiscordId]` on the table `Server` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `roleDiscordId` to the `Role` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serverDiscordId` to the `Server` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Server_serverId_idx";

-- DropIndex
DROP INDEX "public"."Server_serverId_key";

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "roleId",
ADD COLUMN     "roleDiscordId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Server" DROP COLUMN "serverId",
ADD COLUMN     "serverDiscordId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Server_serverDiscordId_key" ON "Server"("serverDiscordId");

-- CreateIndex
CREATE INDEX "Server_serverDiscordId_idx" ON "Server"("serverDiscordId");
