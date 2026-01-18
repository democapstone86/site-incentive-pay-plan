import { Router } from "express";
import {
  createDraft,
  getSites,
  getDraftById,
  getDraftsBySite,
  updateDraft,
  submitDraft,
  deleteDraft,
} from "./incentive.controller.js";

const router = Router();

router.get("/sites", getSites);
router.post("/draft", createDraft);
router.get("/draft", getDraftsBySite);
router.get("/draft/:id", getDraftById);
router.patch("/draft/:id", updateDraft);
router.post("/submit/:id", submitDraft);
router.delete("/draft/:id", deleteDraft);

export default router;
