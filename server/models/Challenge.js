import mongoose from "mongoose";

const ChallengeSchema = new mongoose.Schema({
  title: { type: String, required: true, minlength: 3 },
  description: { type: String },
  reward: { type: Number, default: 0 },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isCustom: { type: Boolean, default: false },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  category: { type: String, enum: ['daily', 'weekly', 'monthly', 'custom'], default: 'custom' },
  goal: { type: Number, default: 1 },
  progressType: { type: String, enum: ['boolean', 'incremental', 'streak'], default: 'boolean' },
  public: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Challenge", ChallengeSchema);
