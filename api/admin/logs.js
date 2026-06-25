const { getSessionUser } = require('../_utils/auth');
const { readData } = require('../_utils/db');

module.exports = async (req, res) => {
  // Authentication & Authorization check
  const user = getSessionUser(req);
  if (!user || user.email.toLowerCase() !== 'avipro1122@gmail.com') {
    return res.status(403).json({ error: "Forbidden. Admin privileges required." });
  }

  const data = readData();

  // GET: Fetch all logs
  if (req.method === 'GET') {
    try {
      // Sort logs by timestamp descending
      const sortedLogs = [...(data.logs || [])].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      return res.status(200).json({
        success: true,
        logs: sortedLogs
      });
    } catch (e) {
      return res.status(500).json({ error: "Failed to fetch logs" });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
};
