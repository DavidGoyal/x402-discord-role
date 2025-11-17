/*
  Warnings:

  - Added the required column `username` to the `RoleAssigned` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RoleAssigned" ADD COLUMN     "username" TEXT NOT NULL;
