import { IncentivePayPlanDraft } from "../../models/incentive-play-plan-draft.js";
import { computeIncentivePayPlanStatus } from "../../services/incentive-pay-plan-status.js";

function isSamePayload(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function extractVersion(name = "") {
  const match = name.match(/-v(\d+\.\d+)/);
  return match ? parseFloat(match[1]) : 1.0;
}

function nextVersion(currentVersion) {
  return (currentVersion + 0.0001).toFixed(4);
}

export async function createDraft(req, res) {
  const { siteId, payload, draftId } = req.body;

  if (!siteId || !payload?.selectedService) {
    return res.status(400).json({ error: "Missing siteId or selectedService" });
  }

  const service = payload.selectedService;
  const status = computeIncentivePayPlanStatus(payload);

  if (draftId) {
    const existingById = await IncentivePayPlanDraft.findById(draftId);

    if (!existingById) {
      return res.status(404).json({ error: "Draft not found" });
    }

    if (isSamePayload(existingById.payload, payload)) {
      return res.status(409).json({
        message: "No changes detected. Draft not updated.",
      });
    }

    const currentVersion = extractVersion(existingById.name);
    const newVersion = nextVersion(currentVersion);

    existingById.payload = payload;
    existingById.status = status;
    existingById.name = `SITE-${siteId}-${service}-v${newVersion}`;
    existingById.updatedAt = new Date();

    await existingById.save();
    return res.status(200).json(existingById);
  }

  // 2️⃣ CHECK FOR EXISTING DRAFT BY SITE + SERVICE
  const existing = await IncentivePayPlanDraft.findOne({
    siteId,
    "payload.selectedService": service,
  });

  if (!existing) {
    const draft = await IncentivePayPlanDraft.create({
      siteId,
      payload,
      name: `SITE-${siteId}-${service}-v1.0000`,
      status,
      createdBy: req.user?.id,
    });

    return res.status(201).json(draft);
  }

  if (isSamePayload(existing.payload, payload)) {
    return res.status(409).json({
      message: "An incentive pay plan draft already exists with no changes.",
    });
  }

  const currentVersion = extractVersion(existing.name);
  const newVersion = nextVersion(currentVersion);

  existing.payload = payload;
  existing.status = status;
  existing.name = `SITE-${siteId}-${service}-v${newVersion}`;
  existing.updatedAt = new Date();

  await existing.save();
  return res.status(200).json(existing);
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
