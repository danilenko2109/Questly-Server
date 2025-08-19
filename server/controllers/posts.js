import Post from "../models/Post.js";
import User from "../models/User.js";

/**
 * Создание нового поста с возможностью загрузки нескольких изображений
 */
export const createPost = async (req, res) => {
  try {
    const { userId, description } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Одна картинка
    const picturePath = req.file ? req.file.filename : null;

    const newPost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      description,
      userPicturePath: user.picturePath,
      picturePath, // одна картинка
      likes: {},
      comments: [],
    });

    await newPost.save();

    res.status(201).json(newPost.toObject());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/**
 * Получение ленты постов с пагинацией
 * Запрос: GET /posts?page=1&limit=10
 */
export const getFeedPosts = async (req, res) => {
  try {
    // Читаем параметры пагинации с дефолтами
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 10); // максимум 100

    const skip = (page - 1) * limit;

    // Считаем общее количество постов
    const totalPosts = await Post.countDocuments();

    // Забираем посты с сортировкой по дате создания (новые — сверху)
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Отправляем ответ с пагинацией
    res.status(200).json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Получение постов конкретного пользователя с пагинацией
 * Запрос: GET /:userId/posts?page=1&limit=10
 */
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const totalPosts = await Post.countDocuments({ userId });

    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Лайк/дизлайк поста (переключение)
 * PATCH /posts/:id/like
 */
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;      // id поста
    const { userId } = req.body;    // id пользователя, который лайкает

    // Находим пост
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Проверяем, есть ли лайк от пользователя
    const isLiked = post.likes.get(userId);

    if (isLiked) {
      post.likes.delete(userId);  // убираем лайк
    } else {
      post.likes.set(userId, true); // добавляем лайк
    }

    // Сохраняем изменения
    await post.save();

    // Отправляем обновлённый пост
    res.status(200).json(post.toObject());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Добавление комментария к посту
 * PATCH /posts/:id/comment
 */
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;          // id поста
    const { userId, text } = req.body;  // данные комментария

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Создаём объект комментария
    const newComment = {
      userId,
      userFirstName: user.firstName,
      userLastName: user.lastName,
      userPicturePath: user.picturePath,
      text: text.trim(),
      createdAt: new Date(),
    };

    // Добавляем комментарий в массив
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $push: { comments: newComment } },
      { new: true }
    ).lean();

    if (!updatedPost) return res.status(404).json({ message: "Post not found" });

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Удаление комментария из поста
 * DELETE /posts/:id/comments/:commentId
 */
export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Проверяем права на удаление (автор комментария или автор поста)
    if (
      comment.userId.toString() !== userId &&
      post.userId.toString() !== userId
    ) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    // Удаляем комментарий
    comment.remove();
    await post.save();

    res.status(200).json(post.toObject());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Удаление поста
 * DELETE /posts/:id
 */
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Проверяем, что пользователь — автор поста
    if (post.userId.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    // Удаляем пост
    await Post.findByIdAndDelete(id);

    // Удаляем пост из сохранённых у пользователей
    await User.updateMany(
      { savedPosts: id },
      { $pull: { savedPosts: id } }
    );

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
