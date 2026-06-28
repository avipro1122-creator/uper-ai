import { NextResponse } from 'next/server';
import { getSessionUser } from '../../../../lib/auth';
import { readData, writeData } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

// Helper to check admin authorization
async function checkAdminAuth() {
  const user = await getSessionUser();
  if (!user || user.email.toLowerCase() !== 'avipro1122@gmail.com') {
    return { authorized: false, response: NextResponse.json({ error: "Forbidden. Admin privileges required." }, { status: 403 }), user: null };
  }
  return { authorized: true, response: null, user };
}

// GET: Fetch all feedback items
export async function GET() {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response!;

    const data = await readData();
    // Sort feedback by date descending
    const sortedFeedback = [...(data.feedback || [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    return NextResponse.json({
      success: true,
      feedback: sortedFeedback
    });
  } catch (error) {
    console.error("Fetch feedback error:", error);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}

// DELETE: Remove a feedback item
export async function DELETE(request: Request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response!;

    const { feedbackId } = await request.json();
    if (!feedbackId) {
      return NextResponse.json({ error: "Missing feedbackId in request body" }, { status: 400 });
    }

    const data = await readData();
    const now = new Date().toISOString();

    const targetFeedbackIdx = data.feedback.findIndex(f => f.id === String(feedbackId));
    if (targetFeedbackIdx === -1) {
      return NextResponse.json({ error: "Feedback item not found" }, { status: 404 });
    }

    const deletedFeedback = data.feedback[targetFeedbackIdx];
    data.feedback.splice(targetFeedbackIdx, 1);

    // Log action
    data.logs.push({
      id: String(data.logs.length + 1),
      email: auth.user!.email,
      action: "FEEDBACK_DELETED",
      details: `Deleted feedback from ${deletedFeedback.name} (${deletedFeedback.email})`,
      timestamp: now
    });

    await writeData(data);

    return NextResponse.json({
      success: true,
      message: "Feedback deleted successfully"
    });
  } catch (error) {
    console.error("Delete feedback error:", error);
    return NextResponse.json({ error: "Failed to delete feedback" }, { status: 500 });
  }
}
