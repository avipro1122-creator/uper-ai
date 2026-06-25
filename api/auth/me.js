const { getSessionUser } = require('../_utils/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const user = getSessionUser(req);
    if (!user) {
      return res.status(200).json({
        authenticated: false,
        user: null
      });
    }

    return res.status(200).json({
      authenticated: true,
      user: {
        id: user.id,
        googleId: user.googleId,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error("Session verification error:", error);
    return res.status(500).json({ error: "Internal server session error" });
  }
};
