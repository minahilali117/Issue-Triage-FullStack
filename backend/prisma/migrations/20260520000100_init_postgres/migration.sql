-- Create enums
CREATE TYPE role AS ENUM ('ADMIN','DEVELOPER','VIEWER');
CREATE TYPE issuestatus AS ENUM ('OPEN','IN_PROGRESS','RESOLVED','CLOSED');
CREATE TYPE issuepriority AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');
CREATE TYPE activitytype AS ENUM ('ISSUE_CREATED','STATUS_CHANGED','PRIORITY_CHANGED','ASSIGNEE_CHANGED','COMMENT_ADDED','COMMENT_DELETED');

-- Create users table
CREATE TABLE "User" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "name" VARCHAR(100),
  "role" role NOT NULL DEFAULT 'VIEWER',
  "avatarUrl" VARCHAR(500),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create issues table
CREATE TABLE "Issue" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "status" issuestatus NOT NULL DEFAULT 'OPEN',
  "priority" issuepriority NOT NULL DEFAULT 'MEDIUM',
  "category" VARCHAR(100),
  "assigneeId" INTEGER,
  "createdById" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_issue_assignee FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL,
  CONSTRAINT fk_issue_createdby FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE INDEX "Issue_status_idx" ON "Issue" ("status");
CREATE INDEX "Issue_priority_idx" ON "Issue" ("priority");
CREATE INDEX "Issue_category_idx" ON "Issue" ("category");
CREATE INDEX "Issue_assignee_idx" ON "Issue" ("assigneeId");

-- Create comments table
CREATE TABLE "Comment" (
  "id" SERIAL PRIMARY KEY,
  "content" TEXT NOT NULL,
  "issueId" INTEGER NOT NULL,
  "authorId" INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_comment_issue FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE,
  CONSTRAINT fk_comment_author FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL
);

-- Create activity log table
CREATE TABLE "ActivityLog" (
  "id" SERIAL PRIMARY KEY,
  "type" activitytype NOT NULL,
  "message" TEXT,
  "issueId" INTEGER,
  "userId" INTEGER,
  "oldValue" TEXT,
  "newValue" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_activity_issue FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE,
  CONSTRAINT fk_activity_user FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL
);

CREATE INDEX "ActivityLog_issue_idx" ON "ActivityLog" ("issueId");
CREATE INDEX "ActivityLog_user_idx" ON "ActivityLog" ("userId");

-- Attachments
CREATE TABLE "Attachment" (
  "id" SERIAL PRIMARY KEY,
  "fileName" VARCHAR(255) NOT NULL,
  "filePath" VARCHAR(1024) NOT NULL,
  "uploadedById" INTEGER,
  "issueId" INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_attachment_user FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE SET NULL,
  CONSTRAINT fk_attachment_issue FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE
);
