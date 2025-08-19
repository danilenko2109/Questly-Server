import express from "express";
import {
  createCustomChallenge,
  getUserCreatedChallenges,
  updateChallenge,
  deleteChallenge
} from "../controllers/challengeController";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/custom", verifyToken, createCustomChallenge);
router.get("/user-created", verifyToken, getUserCreatedChallenges);
router.patch("/:id", verifyToken, updateChallenge);
router.delete("/:id", verifyToken, deleteChallenge);

export default router;
