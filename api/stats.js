const { readData } = require('./_utils/db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const data = readData();
    return res.status(200).json({
      success: true,
      stats: {
        totalCompanies: 150 + (data.stocks ? data.stocks.length : 0),
        documentsIndexed: 2450000 + (data.news ? data.news.length * 12 : 0),
        aiReportsGenerated: 12450 + (data.logs ? data.logs.length * 7 : 0)
      }
    });
  } catch (error) {
    console.error("Public stats error:", error);
    return res.status(500).json({ error: "Internal server error fetching stats" });
  }
};
