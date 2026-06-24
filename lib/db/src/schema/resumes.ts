import { pgTable, text, serial, timestamp, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const resumesTable = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  fileName: text("file_name").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  status: text("status").notNull().default("pending"),
  filePath: text("file_path"),
  atsScore: integer("ats_score"),
  extractedText: text("extracted_text"),
  skills: text("skills"),
  missingSkills: text("missing_skills"),
  suggestions: text("suggestions"),
  education: text("education"),
  experience: text("experience"),
  projects: text("projects"),
}, (table) => [
  index("resumes_user_id_idx").on(table.userId),
  index("resumes_user_id_uploaded_at_idx").on(table.userId, table.uploadedAt),
]);

export const insertResumeSchema = createInsertSchema(resumesTable).omit({
  id: true,
  uploadedAt: true,
});
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumesTable.$inferSelect;
