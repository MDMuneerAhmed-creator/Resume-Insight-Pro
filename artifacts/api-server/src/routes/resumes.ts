import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db, resumesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
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
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

const router = Router();

router.post("/resumes/upload", upload.single("file"), async (req, res) => {
  try {
    const { userId, fileName } = req.body as { userId: string; fileName: string };

    if (!userId || !fileName) {
      res.status(400).json({ error: "userId and fileName are required" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "PDF file is required" });
      return;
    }

    const [resume] = await db
      .insert(resumesTable)
      .values({
        userId,
        fileName,
        status: "analyzing",
      })
      .returning();

    res.status(201).json(resume);

    analyzeResume(resume.id, req.file.path).catch((err) => {
      logger.error({ err, resumeId: resume.id }, "Background analysis failed");
    });
  } catch (err) {
    logger.error({ err }, "Upload error");
    res.status(500).json({ error: "Upload failed" });
  }
});

router.get("/resumes", async (req, res) => {
  try {
    const { userId } = req.query as { userId: string };
    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const resumes = await db
      .select()
      .from(resumesTable)
      .where(eq(resumesTable.userId, userId))
      .orderBy(resumesTable.uploadedAt);

    res.json(resumes.reverse());
  } catch (err) {
    logger.error({ err }, "List resumes error");
    res.status(500).json({ error: "Failed to list resumes" });
  }
});

router.get("/resumes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
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

    res.json(resume);
  } catch (err) {
    logger.error({ err }, "Get resume error");
    res.status(500).json({ error: "Failed to get resume" });
  }
});

router.delete("/resumes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const deleted = await db
      .delete(resumesTable)
      .where(eq(resumesTable.id, id))
      .returning();

    if (!deleted.length) {
      res.status(404).json({ error: "Resume not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    logger.error({ err }, "Delete resume error");
    res.status(500).json({ error: "Failed to delete resume" });
  }
});

router.post("/resumes/:id/reanalyze", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
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

    if (!resume.extractedText) {
      res.status(400).json({ error: "No extracted text to reanalyze" });
      return;
    }

    const [updated] = await db
      .update(resumesTable)
      .set({ status: "analyzing" })
      .where(eq(resumesTable.id, id))
      .returning();

    res.json(updated);

    analyzeResume(id, null, resume.extractedText).catch((err) => {
      logger.error({ err, resumeId: id }, "Reanalysis failed");
    });
  } catch (err) {
    logger.error({ err }, "Reanalyze error");
    res.status(500).json({ error: "Failed to reanalyze" });
  }
});

export default router;
