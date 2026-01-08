import mongoose from "mongoose";

const DraftSchema = new mongoose.Schema(
  {
    siteId: {
      type: String,
      required: true,
      index: true,
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

    createdBy: {
      type: String,
    },
  },
  { timestamps: true }
);

export const IncentivePayPlanDraft =
  mongoose.models.IncentivePayPlanDraft ??
  mongoose.model("IncentivePayPlanDraft", DraftSchema);
