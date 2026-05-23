import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getData, saveData, getNextId } from "@/database/connection";

// GET all announcements (accessible by both HR and employees)
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const priority = searchParams.get("priority") || "";

    const db = getData();
    let filtered = (db.announcements || []).filter(a => a.isActive);

    if (category) {
      filtered = filtered.filter(a => a.category === category);
    }
    if (priority) {
      filtered = filtered.filter(a => a.priority === priority);
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      data: filtered,
      total: filtered.length,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    console.error("Get announcements error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// POST create a new announcement (HR only)
export async function POST(request: NextRequest) {
  try {
    await requireAuth("hr");
    const body = await request.json();
    const { title, content, category, priority } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { success: false, message: "Title, content, and category are required" },
        { status: 400 }
      );
    }

    const validCategories = ["general", "policy", "event", "celebration", "important", "update"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, message: "Invalid category" },
        { status: 400 }
      );
    }

    const db = getData();
    if (!db.announcements) db.announcements = [];

    const newAnnouncement = {
      id: getNextId(db.announcements),
      title,
      content,
      category,
      date: new Date().toISOString().split("T")[0],
      priority: priority || "medium",
      author: "HR Admin",
      isActive: true,
    };

    db.announcements.push(newAnnouncement);
    saveData(db);

    return NextResponse.json(
      { success: true, message: "Announcement created successfully", data: newAnnouncement },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized" || err.message === "Forbidden") {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Create announcement error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
