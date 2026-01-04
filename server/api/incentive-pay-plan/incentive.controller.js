import { IncentivePayPlanDraft } from "../../models/incentive-play-plan-draft.js";

export async function createDraft(req, res) {
  const { siteId, payload } = req.body;

  if (!siteId || !payload) {
    return res.status(400).json({ error: "Missing siteId or payload" });
  }

  const existingDraftCount = await IncentivePayPlanDraft.countDocuments({
    siteId,
    status: "DRAFT",
  });

  // Subject to change
  if (existingDraftCount >= 5) {
    return res.status(409).json({
      error: "Draft limit reached",
      message: "A maximum of 5 draft incentive pay plans is allowed per site.",
    });
  }

  const draft = await IncentivePayPlanDraft.create({
    siteId: req.body.siteId,
    payload: req.body.payload,
    createdBy: req.user?.id,
    status: "DRAFT",
  });

  res.status(201).json(draft);
}

export async function getDraft(req, res) {
  const draft = await IncentivePayPlanDraft.findById(req.params.id);
  res.json(draft);
}

export async function updateDraft(req, res) {
  await IncentivePayPlanDraft.findByIdAndUpdate(req.params.id, {
    payload: req.body.payload,
  });

  res.sendStatus(204);
}

export async function submitDraft(req, res) {
  const draft = await IncentivePayPlanDraft.findById(req.params.id);
  if (!draft) return res.sendStatus(404);

  draft.status = "SUBMITTED";
  await draft.save();

  res.sendStatus(200);
}
