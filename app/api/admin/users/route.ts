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

// GET: Fetch all users
export async function GET() {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response!;

    const data = readData();
    return NextResponse.json({
      success: true,
      users: data.users
    });
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// PUT: Update user role
export async function PUT(request: Request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response!;

    const { userId, role } = await request.json();
    if (!userId || !role) {
      return NextResponse.json({ error: "Missing userId or role in request body" }, { status: 400 });
    }

    const data = readData();
    const now = new Date().toISOString();

    const targetUser = data.users.find(u => u.id === String(userId));
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Business rule: The primary administrator must stay ADMIN
    if (targetUser.email.toLowerCase() === 'avipro1122@gmail.com' && role !== 'ADMIN') {
      return NextResponse.json({ error: "The primary administrator role cannot be altered." }, { status: 400 });
    }

    const oldRole = targetUser.role;
    targetUser.role = role as 'ADMIN' | 'USER';
    targetUser.updatedAt = now;

    // Log action
    data.logs.push({
      id: String(data.logs.length + 1),
      email: auth.user!.email,
      action: "USER_ROLE_UPDATED",
      details: `Updated role of ${targetUser.email} from ${oldRole} to ${role}`,
      timestamp: now
    });

    writeData(data);

    return NextResponse.json({
      success: true,
      user: targetUser
    });
  } catch (error) {
    console.error("Update user role error:", error);
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}

// DELETE: Remove a user
export async function DELETE(request: Request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response!;

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId in request body" }, { status: 400 });
    }

    const data = readData();
    const now = new Date().toISOString();

    const targetUserIdx = data.users.findIndex(u => u.id === String(userId));
    if (targetUserIdx === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUser = data.users[targetUserIdx];
    
    // Business rule: Primary admin cannot be deleted
    if (targetUser.email.toLowerCase() === 'avipro1122@gmail.com') {
      return NextResponse.json({ error: "The primary administrator account cannot be deleted." }, { status: 400 });
    }

    data.users.splice(targetUserIdx, 1);

    // Log action
    data.logs.push({
      id: String(data.logs.length + 1),
      email: auth.user!.email,
      action: "USER_DELETED",
      details: `Deleted user: ${targetUser.email} (${targetUser.name})`,
      timestamp: now
    });

    writeData(data);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
