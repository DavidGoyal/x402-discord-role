/*
  Warnings:

  - Added the required column `channelName` to the `Channel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roleName` to the `Channel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `channelId` to the `RoleAssigned` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Server` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "channelName" TEXT NOT NULL,
ADD COLUMN     "roleName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RoleAssigned" ADD COLUMN     "channelId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Server" ADD COLUMN     "name" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "RoleAssigned" ADD CONSTRAINT "RoleAssigned_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
