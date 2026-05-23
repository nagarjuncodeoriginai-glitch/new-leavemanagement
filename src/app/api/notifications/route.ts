import { NextRequest, NextResponse } from "next/server";
import { getData, saveData } from "@/database/connection";
import { requireAuth } from "@/lib/auth";

// GET notifications for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");

    const db = getData();
    if (!db.notifications) db.notifications = [];

    let notifications = db.notifications.filter(
      (n) => n.user_id === user.id && n.user_role === user.role
    );

    if (unreadOnly) {
      notifications = notifications.filter((n) => !n.is_read);
    }

    // Sort by created_at descending
    notifications.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const unreadCount = db.notifications.filter(
      (n) => n.user_id === user.id && n.user_role === user.role && !n.is_read
    ).length;

    return NextResponse.json({
      success: true,
      data: notifications.slice(0, limit),
      unreadCount,
      total: notifications.length,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    console.error("Get notifications error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// PUT - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { notification_ids, mark_all } = body;

    const db = getData();
    if (!db.notifications) db.notifications = [];

    if (mark_all) {
      db.notifications = db.notifications.map((n) => {
        if (n.user_id === user.id && n.user_role === user.role) {
          return { ...n, is_read: true };
        }
        return n;
      });
    } else if (notification_ids && Array.isArray(notification_ids)) {
      db.notifications = db.notifications.map((n) => {
        if (
          notification_ids.includes(n.id) &&
          n.user_id === user.id &&
          n.user_role === user.role
        ) {
          return { ...n, is_read: true };
        }
        return n;
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Provide notification_ids array or mark_all: true" },
        { status: 400 }
      );
    }

    saveData(db);

    return NextResponse.json({
      success: true,
      message: "Notifications marked as read",
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    console.error("Update notifications error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
