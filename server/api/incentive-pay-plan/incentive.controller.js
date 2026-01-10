import { IncentivePayPlanDraft } from "../../models/incentive-play-plan-draft.js";
import { computeIncentivePayPlanStatus } from "../../services/incentive-pay-plan-status.js";

export async function createDraft(req, res) {
  const { siteId, payload } = req.body;

  if (!siteId || !payload) {
    return res.status(400).json({ error: "Missing siteId or payload" });
  }

  const status = computeIncentivePayPlanStatus(payload);

  const draft = await IncentivePayPlanDraft.create({
    siteId,
    payload,
    name: payload?.selectedService
      ? `SITE-${siteId}-${payload.selectedService}-v1.0000`
      : `SITE-${siteId}-v1.0000`,
    status,
    createdBy: req.user?.id,
  });

  res.status(201).json(draft);
}

export async function getSites(req, res) {
  try {
    const sites = await IncentivePayPlanDraft.aggregate([
      {
        $match: {
          siteId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: { $toString: "$siteId" },
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          name: "$_id",
        },
      },
      { $sort: { id: 1 } },
    ]);

    res.json(sites);
  } catch (err) {
    console.error("❌ Failed to load sites:", err);
    res.status(500).json({ message: "Failed to load sites" });
  }
}

export async function getDraftsBySite(req, res) {
  const { siteId } = req.query;

  if (!siteId) {
    return res.status(400).json({ error: "Missing siteId" });
  }

  const drafts = await IncentivePayPlanDraft.find({ siteId })
    .sort({ updatedAt: -1 })
    .lean();

  res.json(drafts);
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
