import { Router } from "express";
import incentiveRoutes from "./incentive-pay-plan/incentive.routes.js";

const router = Router();

router.use("/incentive-pay-plan", incentiveRoutes);

export default router;
