import { Router } from "express";
import {
  createDraft,
  getDraft,
  updateDraft,
  submitDraft,
} from "./incentive.controller.js";

const router = Router();

router.post("/draft", createDraft);
router.get("/draft/:id", getDraft);
router.patch("/draft/:id", updateDraft);
router.post("/submit/:id", submitDraft);

export default router;
