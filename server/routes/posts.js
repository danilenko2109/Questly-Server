import express from "express";
import multer from "multer";
import {
  getFeedPosts,
  getUserPosts,
  likePost,
  createPost,
  deletePost,
  addComment,
  deleteComment,
  fixImageUrls
} from "../controllers/posts.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/assets"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// Пагинация: /posts?page=1&limit=10
router.get("/", verifyToken, getFeedPosts);

// Получить посты пользователя с пагинацией
router.get("/:userId/posts", verifyToken, getUserPosts);

// Создать пост
router.post("/", verifyToken, upload.single("picture"), createPost);

// Лайк поста
router.patch("/:id/like", verifyToken, likePost);

// Комментарии
router.patch("/:id/comment", verifyToken, addComment);
router.delete("/:id/comments/:commentId", verifyToken, deleteComment);

// Удаление поста
router.delete("/:id", verifyToken, deletePost);

// Фикс URL изображений (временный endpoint)
router.patch("/fix/urls", verifyToken, fixImageUrls);

export default router;