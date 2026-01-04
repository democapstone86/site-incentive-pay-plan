import mongoose from "mongoose";

const DraftSchema = new mongoose.Schema(
  {
    siteId: { type: String, required: true },

    status: {
      type: String,
      enum: ["DRAFT", "SUBMITTED", "ARCHIVED"],
      default: "DRAFT",
    },

    payload: {
      type: Object,
      required: true,
    },

    createdBy: String,
  },
  { timestamps: true }
);

export const IncentivePayPlanDraft =
  mongoose.models.IncentivePayPlanDraft ??
  mongoose.model("IncentivePayPlanDraft", DraftSchema);
