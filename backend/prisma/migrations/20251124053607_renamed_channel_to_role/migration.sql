/*
  Warnings:

  - You are about to drop the column `channelId` on the `RoleAssigned` table. All the data in the column will be lost.
  - You are about to drop the column `expiryTime` on the `RoleAssigned` table. All the data in the column will be lost.
  - You are about to drop the `Channel` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `expiresOn` to the `RoleAssigned` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresOn` to the `Server` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Channel" DROP CONSTRAINT "Channel_serverId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RoleAssigned" DROP CONSTRAINT "RoleAssigned_channelId_fkey";

-- DropIndex
DROP INDEX "public"."RoleAssigned_expiryTime_idx";

-- AlterTable
ALTER TABLE "RoleAssigned" DROP COLUMN "channelId",
DROP COLUMN "expiryTime",
ADD COLUMN     "expiresOn" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Server" ADD COLUMN     "expiresOn" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "public"."Channel";

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "costInUsdc" BIGINT NOT NULL,
    "roleId" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "roleApplicableTime" INTEGER[],

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoleAssigned_expiresOn_idx" ON "RoleAssigned"("expiresOn");

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssigned" ADD CONSTRAINT "RoleAssigned_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
