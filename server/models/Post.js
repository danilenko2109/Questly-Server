import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    userId: String,
    userFirstName: String,
    userLastName: String,
    userPicturePath: String,
    text: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const postSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    firstName: String,
    lastName: String,
    location: String,
    description: String,
    userPicturePath: String,
    picturePath: String,  // поменял с массива на строку
    likes: { type: Map, of: Boolean, default: {} },
    comments: { type: [commentSchema], default: [] },
  },
  { timestamps: true }
);


const Post = mongoose.model("Post", postSchema);
export default Post;
