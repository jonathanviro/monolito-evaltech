-- CreateTable
CREATE TABLE "FocusEvent" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "lostAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),
    "durationMs" INTEGER,

    CONSTRAINT "FocusEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FocusEvent" ADD CONSTRAINT "FocusEvent_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
