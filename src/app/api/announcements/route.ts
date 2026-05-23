import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

// Default announcements data
const announcements = [
  {
    id: 1,
    title: "Annual Performance Review Cycle Begins",
    content: "The Q2 2025 performance review cycle starts from June 1st. Please ensure your goals are updated in the system. Self-assessment forms will be shared by May 28th.",
    category: "important",
    date: "2025-05-22",
    priority: "high",
    author: "HR Team",
    isActive: true,
  },
  {
    id: 2,
    title: "New Work From Home Policy Update",
    content: "Effective June 1, 2025, employees can avail up to 2 WFH days per week with prior manager approval. Please refer to the updated policy document for guidelines.",
    category: "policy",
    date: "2025-05-20",
    priority: "high",
    author: "HR Admin",
    isActive: true,
  },
  {
    id: 3,
    title: "Team Building Event - Adventure Outing",
    content: "Join us for an exciting team building adventure on June 15th at Eco Park. Activities include trekking, team challenges, and BBQ dinner. Register by June 5th.",
    category: "event",
    date: "2025-05-18",
    priority: "medium",
    author: "People & Culture",
    isActive: true,
  },
  {
    id: 4,
    title: "Happy Birthday Celebrations - May Birthdays",
    content: "Wishing a wonderful birthday to our May stars! Join us for cake cutting at 4 PM in the cafeteria on their respective dates.",
    category: "celebration",
    date: "2025-05-15",
    priority: "low",
    author: "Fun Committee",
    isActive: true,
  },
  {
    id: 5,
    title: "IT Security Awareness Training",
    content: "Mandatory IT security training session scheduled for May 30th, 2-3 PM. Topics include phishing prevention, password hygiene, and data protection.",
    category: "important",
    date: "2025-05-14",
    priority: "high",
    author: "IT Security",
    isActive: true,
  },
  {
    id: 6,
    title: "Monthly Town Hall - May 2025",
    content: "Our monthly town hall will be held on May 28th at 11 AM. CEO will share company updates, Q1 results, and roadmap for H2.",
    category: "general",
    date: "2025-05-12",
    priority: "medium",
    author: "Leadership Team",
    isActive: true,
  },
  {
    id: 7,
    title: "Employee Wellness Program Launch",
    content: "We're excited to launch our new Employee Wellness Program! Benefits include free gym membership, mental health counseling, and meditation app subscriptions.",
    category: "update",
    date: "2025-05-10",
    priority: "medium",
    author: "Wellness Team",
    isActive: true,
  },
  {
    id: 8,
    title: "Referral Bonus Increased to Rs 50,000",
    content: "Great news! Our employee referral bonus has been increased from Rs 25,000 to Rs 50,000 for all positions. Refer talented friends and earn rewards.",
    category: "update",
    date: "2025-05-08",
    priority: "medium",
    author: "Talent Acquisition",
    isActive: true,
  },
];

// GET all announcements (accessible by both HR and employees)
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const priority = searchParams.get("priority") || "";

    let filtered = announcements.filter(a => a.isActive);

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

    const newAnnouncement = {
      id: Math.max(...announcements.map(a => a.id), 0) + 1,
      title,
      content,
      category,
      date: new Date().toISOString().split("T")[0],
      priority: priority || "medium",
      author: "HR Admin",
      isActive: true,
    };

    announcements.push(newAnnouncement);

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
