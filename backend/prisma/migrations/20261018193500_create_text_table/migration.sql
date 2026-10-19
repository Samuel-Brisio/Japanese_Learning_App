-- CreateTable
CREATE TABLE "text" (
    "text_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID NOT NULL,
    "processing_id" UUID NOT NULL,
    "original_content" TEXT NOT NULL,
    "elements" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "text_pkey" PRIMARY KEY ("text_id")
);

-- CreateIndex
CREATE INDEX "text_owner_id_idx" ON "text"("owner_id");

-- CreateIndex
CREATE INDEX "text_processing_id_idx" ON "text"("processing_id");

-- AddForeignKey
ALTER TABLE "text" ADD CONSTRAINT "text_owner_id_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "user"("user_id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
