const { getSessionUser } = require('../utils/auth');
const { readData, writeData } = require('../utils/db');

module.exports = async (req, res) => {
  // Authentication & Authorization check
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized. Please sign in." });
  }
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: "Forbidden. Admin privileges required." });
  }

  const data = readData();
  const now = new Date().toISOString();

  // GET: Load news articles
  if (req.method === 'GET') {
    try {
      return res.status(200).json({
        success: true,
        news: data.news
      });
    } catch (e) {
      return res.status(500).json({ error: "Failed to load news" });
    }
  }

  // POST: Publish a news article
  if (req.method === 'POST') {
    try {
      const { title, content, author } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: "Missing required fields: title, content" });
      }

      const newArticle = {
        id: String(data.news.length + 1),
        title: title.trim(),
        content: content.trim(),
        author: author ? author.trim() : "UperAI News Desk",
        date: now
      };

      data.news.push(newArticle);

      // Log action
      data.logs.push({
        id: String(data.logs.length + 1),
        email: user.email,
        action: "NEWS_PUBLISHED",
        details: `Published news article: ${newArticle.title}`,
        timestamp: now
      });

      writeData(data);

      return res.status(201).json({
        success: true,
        article: newArticle
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to publish news article" });
    }
  }

  // PUT: Update news article
  if (req.method === 'PUT') {
    try {
      const { id, title, content, author } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Missing article ID" });
      }

      const article = data.news.find(n => n.id === String(id));
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }

      // Update fields
      if (title) article.title = title.trim();
      if (content) article.content = content.trim();
      if (author) article.author = author.trim();

      // Log action
      data.logs.push({
        id: String(data.logs.length + 1),
        email: user.email,
        action: "NEWS_UPDATED",
        details: `Updated news article: ${article.title}`,
        timestamp: now
      });

      writeData(data);

      return res.status(200).json({
        success: true,
        article
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to update news article" });
    }
  }

  // DELETE: Remove news article
  if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Missing article ID" });
      }

      const idx = data.news.findIndex(n => n.id === String(id));
      if (idx === -1) {
        return res.status(404).json({ error: "Article not found" });
      }

      const article = data.news[idx];
      data.news.splice(idx, 1);

      // Log action
      data.logs.push({
        id: String(data.logs.length + 1),
        email: user.email,
        action: "NEWS_DELETED",
        details: `Deleted news article: ${article.title}`,
        timestamp: now
      });

      writeData(data);

      return res.status(200).json({
        success: true,
        message: "News article deleted successfully"
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to delete news article" });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
};
