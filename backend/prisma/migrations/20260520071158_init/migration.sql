/*
  Warnings:

  - The `status` column on the `Issue` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `priority` column on the `Issue` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `type` on the `ActivityLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."IssueStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."IssuePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'DEVELOPER', 'VIEWER');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('ISSUE_CREATED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'ASSIGNEE_CHANGED', 'COMMENT_ADDED', 'COMMENT_DELETED');

-- DropForeignKey
ALTER TABLE "public"."ActivityLog" DROP CONSTRAINT "fk_activity_issue";

-- DropForeignKey
ALTER TABLE "public"."ActivityLog" DROP CONSTRAINT "fk_activity_user";

-- DropForeignKey
ALTER TABLE "public"."Attachment" DROP CONSTRAINT "fk_attachment_issue";

-- DropForeignKey
ALTER TABLE "public"."Attachment" DROP CONSTRAINT "fk_attachment_user";

-- DropForeignKey
ALTER TABLE "public"."Comment" DROP CONSTRAINT "fk_comment_author";

-- DropForeignKey
ALTER TABLE "public"."Comment" DROP CONSTRAINT "fk_comment_issue";

-- DropForeignKey
ALTER TABLE "public"."Issue" DROP CONSTRAINT "fk_issue_assignee";

-- DropForeignKey
ALTER TABLE "public"."Issue" DROP CONSTRAINT "fk_issue_createdby";

-- DropIndex
DROP INDEX "public"."ActivityLog_issue_idx";

-- DropIndex
DROP INDEX "public"."ActivityLog_user_idx";

-- AlterTable
ALTER TABLE "public"."ActivityLog" DROP COLUMN "type",
ADD COLUMN     "type" "public"."ActivityType" NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Attachment" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Comment" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Issue" DROP COLUMN "status",
ADD COLUMN     "status" "public"."IssueStatus" NOT NULL DEFAULT 'OPEN',
DROP COLUMN "priority",
ADD COLUMN     "priority" "public"."IssuePriority" NOT NULL DEFAULT 'MEDIUM',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "passwordHash" VARCHAR(255) NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "public"."Role" NOT NULL DEFAULT 'DEVELOPER',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- DropEnum
DROP TYPE "public"."activitytype";

-- DropEnum
DROP TYPE "public"."issuepriority";

-- DropEnum
DROP TYPE "public"."issuestatus";

-- DropEnum
DROP TYPE "public"."role";

-- CreateIndex
CREATE INDEX "Issue_status_idx" ON "public"."Issue"("status");

-- CreateIndex
CREATE INDEX "Issue_priority_idx" ON "public"."Issue"("priority");

-- AddForeignKey
ALTER TABLE "public"."Issue" ADD CONSTRAINT "Issue_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Issue" ADD CONSTRAINT "Issue_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivityLog" ADD CONSTRAINT "ActivityLog_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attachment" ADD CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attachment" ADD CONSTRAINT "Attachment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "public"."Issue_assignee_idx" RENAME TO "Issue_assigneeId_idx";
