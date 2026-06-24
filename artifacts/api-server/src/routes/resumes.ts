import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db, resumesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { analyzeResume } from "../lib/resumeAnalyzer";

const workspaceRoot = process.cwd().endsWith(path.join("artifacts", "api-server"))
  ? path.resolve(process.cwd(), "../..")
  : process.cwd();

const uploadsDir = path.resolve(workspaceRoot, "artifacts/api-server/uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    // Sanitize original filename to prevent path traversal
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${unique}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB matches frontend validation
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

const router = Router();

// Helper: get authenticated userId from Clerk middleware
function getAuthUserId(req: Parameters<typeof router.use>[1] extends (req: infer R, ...args: any[]) => any ? R : never): string | null {
  // @clerk/express attaches auth to req
  const auth = (req as any).auth;
  return auth?.userId ?? null;
}

// POST /api/resumes/upload
router.post("/resumes/upload", upload.single("file"), async (req, res) => {
  try {
    const authUserId = getAuthUserId(req as any);
    if (!authUserId) {
      // Clean up uploaded file if auth fails
      if (req.file) fs.unlink(req.file.path, () => {});
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { fileName } = req.body as { fileName?: string };

    if (!fileName) {
      if (req.file) fs.unlink(req.file.path, () => {});
      res.status(400).json({ error: "fileName is required" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "PDF file is required" });
      return;
    }

    // Sanitize fileName to prevent XSS/injection
    const safeFileName = fileName.slice(0, 255).replace(/[<>:"/\\|?*\x00-\x1f]/g, "_");

    const [resume] = await db
      .insert(resumesTable)
      .values({
        userId: authUserId, // Always use server-side auth, never trust client-sent userId
        fileName: safeFileName,
        filePath: req.file.path,
        status: "analyzing",
      })
      .returning();

    res.status(201).json(resume);

    analyzeResume(resume.id, req.file.path).catch((err) => {
      logger.error({ err, resumeId: resume.id }, "Background analysis failed");
    });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    logger.error({ err }, "Upload error");
    res.status(500).json({ error: "Upload failed" });
  }
});

// GET /api/resumes
router.get("/resumes", async (req, res) => {
  try {
    const authUserId = getAuthUserId(req as any);
    if (!authUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Always use the authenticated user's ID, ignore any query param
    const resumes = await db
      .select()
      .from(resumesTable)
      .where(eq(resumesTable.userId, authUserId))
      .orderBy(resumesTable.uploadedAt);

    res.json(resumes.reverse());
  } catch (err) {
    logger.error({ err }, "List resumes error");
    res.status(500).json({ error: "Failed to list resumes" });
  }
});

// GET /api/resumes/:id
router.get("/resumes/:id", async (req, res) => {
  try {
    const authUserId = getAuthUserId(req as any);
    if (!authUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [resume] = await db
      .select()
      .from(resumesTable)
      .where(eq(resumesTable.id, id));

    if (!resume) {
      res.status(404).json({ error: "Resume not found" });
      return;
    }

    // Ensure user can only access their own resumes
    if (resume.userId !== authUserId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.json(resume);
  } catch (err) {
    logger.error({ err }, "Get resume error");
    res.status(500).json({ error: "Failed to get resume" });
  }
});

// DELETE /api/resumes/:id
router.delete("/resumes/:id", async (req, res) => {
  try {
    const authUserId = getAuthUserId(req as any);
    if (!authUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    // Fetch first to verify ownership
    const [existing] = await db
      .select()
      .from(resumesTable)
      .where(eq(resumesTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "Resume not found" });
      return;
    }

    if (existing.userId !== authUserId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await db.delete(resumesTable).where(eq(resumesTable.id, id));

    // Clean up uploaded file
    if (existing.filePath && fs.existsSync(existing.filePath)) {
      fs.unlink(existing.filePath, (err) => {
        if (err) logger.warn({ err, filePath: existing.filePath }, "Failed to delete file");
      });
    }

    res.status(204).send();
  } catch (err) {
    logger.error({ err }, "Delete resume error");
    res.status(500).json({ error: "Failed to delete resume" });
  }
});

// POST /api/resumes/:id/reanalyze
router.post("/resumes/:id/reanalyze", async (req, res) => {
  try {
    const authUserId = getAuthUserId(req as any);
    if (!authUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [resume] = await db
      .select()
      .from(resumesTable)
      .where(eq(resumesTable.id, id));

    if (!resume) {
      res.status(404).json({ error: "Resume not found" });
      return;
    }

    if (resume.userId !== authUserId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (!resume.extractedText && !resume.filePath) {
      res.status(400).json({ error: "No file or extracted text available for re-analysis" });
      return;
    }

    const [updated] = await db
      .update(resumesTable)
      .set({ status: "analyzing" })
      .where(eq(resumesTable.id, id))
      .returning();

    res.json(updated);

    analyzeResume(id, resume.filePath ?? null, resume.extractedText ?? undefined).catch((err) => {
      logger.error({ err, resumeId: id }, "Reanalysis failed");
    });
  } catch (err) {
    logger.error({ err }, "Reanalyze error");
    res.status(500).json({ error: "Failed to reanalyze" });
  }
});

export default router;
