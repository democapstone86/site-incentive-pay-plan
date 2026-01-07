import { Router } from "express";
import {
  createDraft,
  getDraftsBySite,
  updateDraft,
  submitDraft,
} from "./incentive.controller.js";

const router = Router();

router.post("/draft", createDraft);
router.get("/draft", getDraftsBySite);
router.patch("/draft/:id", updateDraft);
router.post("/submit/:id", submitDraft);

export default router;
