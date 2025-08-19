import Post from "../models/Post.js";
import User from "../models/User.js";

/**
 * Создание нового поста с абсолютными URL изображений
 */
export const createPost = async (req, res) => {
  try {
    const { userId, description } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Функция для создания абсолютного URL
    const getFullUrl = (filename) => {
      if (!filename) return null;
      if (filename.startsWith('http')) return filename;
      return `${req.protocol}://${req.get('host')}/assets/${filename}`;
    };

    const picturePath = req.file ? getFullUrl(req.file.filename) : null;
    const userPicturePath = getFullUrl(user.picturePath);

    const newPost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      description,
      userPicturePath,
      picturePath,
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
 */
export const getFeedPosts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const totalPosts = await Post.countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Фиксим URL для существующих постов
    const postsWithFixedUrls = posts.map(post => ({
      ...post,
      picturePath: post.picturePath && !post.picturePath.startsWith('http') 
        ? `${req.protocol}://${req.get('host')}/assets/${post.picturePath}`
        : post.picturePath,
      userPicturePath: post.userPicturePath && !post.userPicturePath.startsWith('http')
        ? `${req.protocol}://${req.get('host')}/assets/${post.userPicturePath}`
        : post.userPicturePath
    }));

    res.status(200).json({
      posts: postsWithFixedUrls,
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

    // Фиксим URL для существующих постов
    const postsWithFixedUrls = posts.map(post => ({
      ...post,
      picturePath: post.picturePath && !post.picturePath.startsWith('http') 
        ? `${req.protocol}://${req.get('host')}/assets/${post.picturePath}`
        : post.picturePath,
      userPicturePath: post.userPicturePath && !post.userPicturePath.startsWith('http')
        ? `${req.protocol}://${req.get('host')}/assets/${post.userPicturePath}`
        : post.userPicturePath
    }));

    res.status(200).json({
      posts: postsWithFixedUrls,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Лайк/дизлайк поста
 */
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const isLiked = post.likes.get(userId);
    if (isLiked) {
      post.likes.delete(userId);
    } else {
      post.likes.set(userId, true);
    }

    await post.save();
    res.status(200).json(post.toObject());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Добавление комментария к посту
 */
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Функция для создания абсолютного URL
    const getFullUrl = (filename) => {
      if (!filename) return null;
      if (filename.startsWith('http')) return filename;
      return `${req.protocol}://${req.get('host')}/assets/${filename}`;
    };

    const newComment = {
      userId,
      userFirstName: user.firstName,
      userLastName: user.lastName,
      userPicturePath: getFullUrl(user.picturePath),
      text: text.trim(),
      createdAt: new Date(),
    };

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
 * Удаление комментария
 */
export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.userId.toString() !== userId && post.userId.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    comment.remove();
    await post.save();
    res.status(200).json(post.toObject());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Удаление поста
 */
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.userId.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    await Post.findByIdAndDelete(id);
    await User.updateMany(
      { savedPosts: id },
      { $pull: { savedPosts: id } }
    );

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Фикс URL для существующих постов
 */
export const fixImageUrls = async (req, res) => {
  try {
    const posts = await Post.find();
    
    for (const post of posts) {
      if (post.picturePath && !post.picturePath.startsWith('http')) {
        post.picturePath = `${req.protocol}://${req.get('host')}/assets/${post.picturePath}`;
      }
      if (post.userPicturePath && !post.userPicturePath.startsWith('http')) {
        post.userPicturePath = `${req.protocol}://${req.get('host')}/assets/${post.userPicturePath}`;
      }
      await post.save();
    }
    
    res.json({ message: "Image URLs fixed successfully", fixedCount: posts.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};