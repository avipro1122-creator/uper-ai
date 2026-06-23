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

  // GET: Fetch all feedback items
  if (req.method === 'GET') {
    try {
      // Sort feedback by date descending
      const sortedFeedback = [...(data.feedback || [])].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      return res.status(200).json({
        success: true,
        feedback: sortedFeedback
      });
    } catch (e) {
      return res.status(500).json({ error: "Failed to fetch feedback" });
    }
  }

  // DELETE: Remove a feedback item
  if (req.method === 'DELETE') {
    try {
      const { feedbackId } = req.body;
      if (!feedbackId) {
        return res.status(400).json({ error: "Missing feedbackId in request body" });
      }

      const targetFeedbackIdx = data.feedback.findIndex(f => f.id === String(feedbackId));
      if (targetFeedbackIdx === -1) {
        return res.status(404).json({ error: "Feedback item not found" });
      }

      const deletedFeedback = data.feedback[targetFeedbackIdx];
      data.feedback.splice(targetFeedbackIdx, 1);

      // Log action
      data.logs.push({
        id: String(data.logs.length + 1),
        email: user.email,
        action: "FEEDBACK_DELETED",
        details: `Deleted feedback from ${deletedFeedback.name} (${deletedFeedback.email})`,
        timestamp: now
      });

      writeData(data);

      return res.status(200).json({
        success: true,
        message: "Feedback deleted successfully"
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to delete feedback" });
    }
  }

  res.setHeader('Allow', ['GET', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
};
