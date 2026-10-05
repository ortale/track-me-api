import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
	createJourney,
	createJourneyPoint,
	createJourneyPoints,
	deleteJourney,
	deleteJourneyPoints,
	getJourney,
	listJourneyPoints,
	listJourneys,
	updateJourney,
} from "../controllers/journey.controller";

const router = Router();

router.get("/", requireAuth, listJourneys);
router.post("/", requireAuth, createJourney);

router.get("/:id", requireAuth, getJourney);
router.put("/:id", requireAuth, updateJourney);
router.delete("/:id", requireAuth, deleteJourney);

router.get("/:id/points", requireAuth, listJourneyPoints);
router.post("/:id/points", requireAuth, createJourneyPoint);
router.post("/:id/points/bulk", requireAuth, createJourneyPoints);
router.delete("/:id/points", requireAuth, deleteJourneyPoints);

export default router;
