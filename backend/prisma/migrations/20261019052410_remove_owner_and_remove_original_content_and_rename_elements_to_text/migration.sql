/*
  Warnings:

  - You are about to drop the column `elements` on the `text` table. All the data in the column will be lost.
  - You are about to drop the column `original_content` on the `text` table. All the data in the column will be lost.
  - Added the required column `text` to the `text` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "text" DROP COLUMN "elements",
DROP COLUMN "original_content",
ADD COLUMN  "text" JSONB NOT NULL;
