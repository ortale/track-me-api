/*
  Warnings:

  - You are about to drop the column `supabaseUserId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[authUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `authUserId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_supabaseUserId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "supabaseUserId",
ADD COLUMN     "authUserId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_authUserId_key" ON "User"("authUserId");
