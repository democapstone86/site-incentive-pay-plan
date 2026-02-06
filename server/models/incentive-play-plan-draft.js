import mongoose from "mongoose";

const DraftSchema = new mongoose.Schema(
  {
    siteId: {
      type: String,
      required: true,
      index: true,
    },

    serviceType: {
      type: String,
      required: true,
      index: true,
    },

    version: {
      type: String,
      required: true,
      immutable: true,
    },

    name: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "IN_USE", "NOT_IN_USE", "ARCHIVED"],
      default: "PENDING",
    },

    payload: {
      type: Object,
      required: true,
    },

    rootDraftId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },

    createdBy: {
      type: String,
    },

    previousDraftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IncentivePayPlanDraft",
    },

    baseDraftId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
  },
  { timestamps: true },
);

DraftSchema.index(
  {
    siteId: 1,
    serviceType: 1,
    version: 1,
  },
  { unique: true },
);

export const IncentivePayPlanDraft =
  mongoose.models.IncentivePayPlanDraft ??
  mongoose.model("IncentivePayPlanDraft", DraftSchema);
