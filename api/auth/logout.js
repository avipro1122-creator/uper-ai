module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Clear cookie using a past expiration date
  res.setHeader(
    'Set-Cookie',
    'uperai_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  );

  return res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
};
