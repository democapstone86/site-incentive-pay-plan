import { Router } from "express";
import {
  createDraft,
  getSites,
  getDraftsBySite,
  updateDraft,
  submitDraft,
} from "./incentive.controller.js";

const router = Router();

router.get("/sites", getSites);
router.post("/draft", createDraft);
router.get("/draft", getDraftsBySite);
router.patch("/draft/:id", updateDraft);
router.post("/submit/:id", submitDraft);

export default router;
