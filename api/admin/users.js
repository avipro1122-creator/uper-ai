const { getSessionUser } = require('../_utils/auth');
const { readData, writeData } = require('../_utils/db');

module.exports = async (req, res) => {
  // Authentication & Authorization check
  const user = getSessionUser(req);
  if (!user || user.email.toLowerCase() !== 'avipro1122@gmail.com') {
    return res.status(403).json({ error: "Forbidden. Admin privileges required." });
  }

  const data = readData();
  const now = new Date().toISOString();

  // GET: Fetch all users
  if (req.method === 'GET') {
    try {
      return res.status(200).json({
        success: true,
        users: data.users
      });
    } catch (e) {
      return res.status(500).json({ error: "Failed to fetch users" });
    }
  }

  // PUT: Update user role (RBAC)
  if (req.method === 'PUT') {
    try {
      const { userId, role } = req.body;
      if (!userId || !role) {
        return res.status(400).json({ error: "Missing userId or role in request body" });
      }

      const targetUser = data.users.find(u => u.id === String(userId));
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Business rule: The primary administrator (avipro1122-creator) must stay ADMIN
      if (targetUser.email.toLowerCase() === 'avipro1122@gmail.com' && role !== 'ADMIN') {
        return res.status(400).json({ error: "The primary administrator role cannot be altered." });
      }

      const oldRole = targetUser.role;
      targetUser.role = role;
      targetUser.updatedAt = now;

      // Log action
      data.logs.push({
        id: String(data.logs.length + 1),
        email: user.email,
        action: "USER_ROLE_UPDATED",
        details: `Updated role of ${targetUser.email} from ${oldRole} to ${role}`,
        timestamp: now
      });

      writeData(data);

      return res.status(200).json({
        success: true,
        user: targetUser
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to update user role" });
    }
  }

  // DELETE: Remove a user
  if (req.method === 'DELETE') {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId in request body" });
      }

      const targetUserIdx = data.users.findIndex(u => u.id === String(userId));
      if (targetUserIdx === -1) {
        return res.status(404).json({ error: "User not found" });
      }

      const targetUser = data.users[targetUserIdx];
      
      // Business rule: Primary admin cannot be deleted
      if (targetUser.email.toLowerCase() === 'avipro1122@gmail.com') {
        return res.status(400).json({ error: "The primary administrator account cannot be deleted." });
      }

      data.users.splice(targetUserIdx, 1);

      // Log action
      data.logs.push({
        id: String(data.logs.length + 1),
        email: user.email,
        action: "USER_DELETED",
        details: `Deleted user: ${targetUser.email} (${targetUser.name})`,
        timestamp: now
      });

      writeData(data);

      return res.status(200).json({
        success: true,
        message: "User deleted successfully"
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to delete user" });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
};
