/*
  Warnings:

  - Added the required column `amount` to the `RoleAssigned` table without a default value. This is not possible if the table is not empty.
  - Added the required column `txnLink` to the `RoleAssigned` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discordUsername` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RoleAssigned" ADD COLUMN     "amount" BIGINT NOT NULL,
ADD COLUMN     "txnLink" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "discordUsername" TEXT NOT NULL;
