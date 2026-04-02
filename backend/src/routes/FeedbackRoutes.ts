import { Router } from "express";
import {
  submitFeedback,
  getAllFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  deleteFeedback,
  retriggerAI,
} from "../controllers/FeedbackController";
import { protect } from "../middleware/AuthMiddleware";

const router = Router();

router.post("/", submitFeedback);
router.get("/", protect, getAllFeedback);
router.get("/:id", protect, getFeedbackById);
router.patch("/:id", protect, updateFeedbackStatus);
router.delete("/:id", protect, deleteFeedback);
router.post("/:id/retrigger", protect, retriggerAI);

export default router;