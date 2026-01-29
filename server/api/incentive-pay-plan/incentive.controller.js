import { IncentivePayPlanDraft } from "../../models/incentive-play-plan-draft.js";
import { computeIncentivePayPlanStatus } from "../../services/incentive-pay-plan-status.js";

function nextVersion(version = "v1.0000") {
  const [, major, patch] = version.match(/^v(\d+)\.(\d{4})$/) || [];
  if (!major || !patch) return "v1.0000";
  return `v${major}.${String(Number(patch) + 1).padStart(4, "0")}`;
}

export async function createDraft(req, res) {
  const rawSiteId = req.body.siteId;
  const siteId = String(rawSiteId);
  const { payload, draftId, mode } = req.body;

  const serviceType = payload?.selectedService;

  if (!siteId || !serviceType) {
    return res.status(400).json({ error: "Missing siteId or serviceType" });
  }

  const status = computeIncentivePayPlanStatus(payload);

  let baseDraft;

  if (draftId) {
    baseDraft = await IncentivePayPlanDraft.findById(draftId);

    if (!baseDraft) {
      return res.status(404).json({ message: "Draft not found" });
    }
  } else {
    baseDraft = await IncentivePayPlanDraft.findOne({
      siteId,
      serviceType,
    }).sort({ createdAt: -1 });
  }

  if (!baseDraft) {
    const draft = await IncentivePayPlanDraft.create({
      siteId,
      serviceType,
      payload,
      status,
      version: "v1.0000",
      name: `SITE-${siteId}-${serviceType}-v1.0000`,
      createdBy: req.user?.id,
    });

    return res.status(201).json(draft);
  }

  if (draftId) {
    const hasChanges =
      JSON.stringify(baseDraft.payload) !== JSON.stringify(payload);

    if (!hasChanges) {
      return res.status(409).json({ message: "No changes detected" });
    }
  }

  const latestDraft = await IncentivePayPlanDraft.findOne({
    siteId,
    serviceType,
  }).sort({ createdAt: -1 });

  const newVersion = nextVersion(latestDraft?.version ?? "v1.0000");

  try {
    const newDraft = await IncentivePayPlanDraft.create({
      siteId,
      serviceType,
      payload,
      status,
      version: newVersion,
      name: `SITE-${siteId}-${serviceType}-${newVersion}`,
      createdBy: req.user?.id,
      previousDraftId: baseDraft._id,
    });

    return res.status(201).json(newDraft);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "This version already exists." });
    }

    throw err;
  }
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
