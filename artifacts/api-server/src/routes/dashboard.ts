import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, resumesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

// GET /api/dashboard/stats
router.get("/dashboard/stats", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const allResumes = await db
      .select()
      .from(resumesTable)
      .where(eq(resumesTable.userId, userId));

    const analyzed = allResumes.filter((r) => r.status === "done");
    const scores = analyzed.map((r) => r.atsScore).filter((s): s is number => s !== null);

    const averageAtsScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null;

    const bestScore = scores.length > 0 ? Math.max(...scores) : null;

    const recentActivity = [...allResumes]
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, 5);

    res.json({
      totalResumes: allResumes.length,
      averageAtsScore,
      bestScore,
      analyzedCount: analyzed.length,
      recentActivity,
    });
  } catch (err) {
    logger.error({ err }, "Dashboard stats error");
    res.status(500).json({ error: "Failed to get stats" });
  }
});

// GET /api/dashboard/skill-gaps
router.get("/dashboard/skill-gaps", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const resumes = await db
      .select({ missingSkills: resumesTable.missingSkills })
      .from(resumesTable)
      .where(eq(resumesTable.userId, userId));

    const counts: Record<string, number> = {};
    for (const resume of resumes) {
      if (!resume.missingSkills) continue;
      try {
        const skills: string[] = JSON.parse(resume.missingSkills);
        for (const skill of skills) {
          counts[skill] = (counts[skill] ?? 0) + 1;
        }
      } catch {
        // ignore malformed JSON
      }
    }

    const result = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([skill, count]) => ({ skill, count }));

    res.json(result);
  } catch (err) {
    logger.error({ err }, "Skill gaps error");
    res.status(500).json({ error: "Failed to get skill gaps" });
  }
});

export default router;
