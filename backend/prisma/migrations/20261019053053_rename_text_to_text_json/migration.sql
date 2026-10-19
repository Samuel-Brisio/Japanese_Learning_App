/*
  Warnings:

  - You are about to drop the column `text` on the `text` table. All the data in the column will be lost.
  - Added the required column `textJson` to the `text` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "text" DROP COLUMN "text",
ADD COLUMN     "textJson" JSONB NOT NULL;
