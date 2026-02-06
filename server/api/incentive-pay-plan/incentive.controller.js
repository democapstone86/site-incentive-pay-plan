import { IncentivePayPlanDraft } from "../../models/incentive-play-plan-draft.js";
import { computeIncentivePayPlanStatus } from "../../services/incentive-pay-plan-status.js";

function parseVersion(version = "v1.0000") {
  const [, major, patch] = version.match(/^v(\d+)\.(\d{4})$/) || [];
  return {
    major: Number(major || 1),
    patch: Number(patch || 0),
  };
}

function nextMajorVersion(version) {
  const { major } = parseVersion(version);
  return `v${major + 1}.0000`;
}

function nextPatchVersion(version) {
  const { major, patch } = parseVersion(version);
  return `v${major}.${String(patch + 1).padStart(4, "0")}`;
}

export async function createDraft(req, res) {
  const { siteId: rawSiteId, payload, draftId } = req.body;
  const siteId = String(rawSiteId);
  const serviceType = payload?.selectedService;

  if (!siteId || !serviceType) {
    return res.status(400).json({ error: "Missing siteId or serviceType" });
  }

  try {
    if (draftId) {
      const revised = await reviseDraft({
        baseDraftId: draftId,
        payload,
        userId: req.user?.id,
      });

      if (!revised) {
        return res.status(404).json({ message: "Draft not found" });
      }

      return res.status(201).json(revised);
    }

    const created = await createNewDraft({
      siteId,
      serviceType,
      payload,
    });
    return res.status(201).json(created);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "This version already exists." });
    }
    throw err;
  }
}

async function createNewDraft({ siteId, serviceType, payload, userId }) {
  const status = computeIncentivePayPlanStatus(payload);

  const latestDraft = await IncentivePayPlanDraft.findOne({
    siteId,
    serviceType,
  }).sort({ createdAt: -1 });

  const version = latestDraft
    ? nextMajorVersion(latestDraft.version)
    : "v1.0000";

  return IncentivePayPlanDraft.create({
    siteId,
    serviceType,
    payload,
    status,
    version,
    name: `SITE-${siteId}-${serviceType}-${version}`,
    createdBy: userId,
    previousDraftId: latestDraft?._id,
    rootDraftId: undefined,
  });
}

async function reviseDraft({ baseDraftId, payload, userId }) {
  const baseDraft = await IncentivePayPlanDraft.findById(baseDraftId);
  if (!baseDraft) return null;

  const status = computeIncentivePayPlanStatus(payload);
  const newVersion = nextPatchVersion(baseDraft.version);

  return IncentivePayPlanDraft.create({
    siteId: baseDraft.siteId,
    serviceType: baseDraft.serviceType,
    payload,
    status,
    version: newVersion,
    name: `SITE-${baseDraft.siteId}-${baseDraft.serviceType}-${newVersion}`,
    createdBy: userId,
    previousDraftId: baseDraft._id,
    rootDraftId: baseDraft.rootDraftId ?? baseDraft._id,
  });
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
    .sort({ createdAt: -1 })
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
