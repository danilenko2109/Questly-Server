import mongoose from "mongoose";

const UserChallengeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  completions: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("UserChallenge", UserChallengeSchema);
