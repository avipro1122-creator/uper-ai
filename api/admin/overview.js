const { getSessionUser } = require('../utils/auth');
const { readData } = require('../utils/db');

module.exports = async (req, res) => {
  // Authentication & Authorization check
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized. Please sign in." });
  }
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: "Forbidden. Admin privileges required." });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const data = readData();
    return res.status(200).json({
      success: true,
      stats: {
        totalUsers: data.users.length,
        totalStocks: data.stocks.length,
        totalNews: data.news.length,
        totalFeedback: data.feedback.length,
        totalLogs: data.logs.length
      }
    });
  } catch (error) {
    console.error("Overview stats error:", error);
    return res.status(500).json({ error: "Internal server error fetching admin stats" });
  }
};
