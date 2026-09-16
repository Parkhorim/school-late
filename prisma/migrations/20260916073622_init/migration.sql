-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "studentNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "classNo" INTEGER NOT NULL,
    "numberInClass" INTEGER NOT NULL,
    "gender" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TardyRecord" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "recordedBy" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TardyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentNumber_key" ON "Student"("studentNumber");

-- CreateIndex
CREATE INDEX "Student_grade_classNo_idx" ON "Student"("grade", "classNo");

-- CreateIndex
CREATE INDEX "TardyRecord_occurredAt_idx" ON "TardyRecord"("occurredAt");

-- CreateIndex
CREATE INDEX "TardyRecord_studentId_idx" ON "TardyRecord"("studentId");

-- AddForeignKey
ALTER TABLE "TardyRecord" ADD CONSTRAINT "TardyRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
