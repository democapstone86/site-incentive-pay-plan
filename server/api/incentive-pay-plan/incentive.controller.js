import { IncentivePayPlanDraft } from "../../models/incentive-play-plan-draft.js";
import { computeIncentivePayPlanStatus } from "../../services/incentive-pay-plan-status.js";

function nextVersion(version = "v1.0000") {
  const [, major, patch] = version.match(/^v(\d+)\.(\d{4})$/) || [];
  if (!major || !patch) return "v1.0000";
  return `v${major}.${String(Number(patch) + 1).padStart(4, "0")}`;
}

export async function createDraft(req, res) {
  const { siteId, payload, draftId, mode } = req.body;
  const service = payload?.selectedService;

  if (!siteId || !payload?.selectedService) {
    return res.status(400).json({ error: "Missing siteId or selectedService" });
  }

  const status = computeIncentivePayPlanStatus(payload);

  let draft = draftId
    ? await IncentivePayPlanDraft.findById(draftId)
    : await IncentivePayPlanDraft.findOne({
        siteId,
        "payload.selectedService": service,
      });

  const hasChanges =
    !draft || JSON.stringify(draft.payload) !== JSON.stringify(payload);

  if (!draft) {
    draft = await IncentivePayPlanDraft.create({
      siteId,
      payload,
      status,
      version: "v1.0000",
      name: `SITE-${siteId}-${service}-v1.0000`,
      createdBy: req.user?.id,
    });

    return res.status(201).json(draft);
  }

  if (!hasChanges && mode !== "view" && mode !== "edit") {
    return res.status(409).json({ message: "No changes detected" });
  }

  if (shouldIncrementVersion({ mode, siteId, service, hasChanges })) {
    draft.version = nextVersion(draft.version);
    draft.name = `SITE-${siteId}-${service}-${draft.version}`;
  }

  draft.payload = payload;
  draft.status = status;
  draft.updatedAt = new Date();

  await draft.save();
  res.status(200).json(draft);
}

export async function deleteDraft(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Missing draft id" });
  }

  const draft = await IncentivePayPlanDraft.findById(id);

  if (!draft) {
    return res.sendStatus(404);
  }

  await IncentivePayPlanDraft.deleteOne({ _id: id });

  res.sendStatus(204);
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

export async function getDraftById(req, res) {
  const { id } = req.params;

  const draft = await IncentivePayPlanDraft.findById(id);
  if (!draft) return res.sendStatus(404);

  res.json(draft);
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
