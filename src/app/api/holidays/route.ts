import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

// Default holidays data (stored in memory for now)
const defaultHolidays = [
  { id: 1, name: "New Year's Day", date: "2025-01-01", type: "national", day: "Wednesday" },
  { id: 2, name: "Republic Day", date: "2025-01-26", type: "national", day: "Sunday" },
  { id: 3, name: "Holi", date: "2025-03-14", type: "religious", day: "Friday" },
  { id: 4, name: "Good Friday", date: "2025-04-18", type: "religious", day: "Friday" },
  { id: 5, name: "May Day", date: "2025-05-01", type: "national", day: "Thursday" },
  { id: 6, name: "Company Foundation Day", date: "2025-05-15", type: "company", day: "Thursday" },
  { id: 7, name: "Independence Day", date: "2025-08-15", type: "national", day: "Friday" },
  { id: 8, name: "Ganesh Chaturthi", date: "2025-08-27", type: "religious", day: "Wednesday" },
  { id: 9, name: "Gandhi Jayanti", date: "2025-10-02", type: "national", day: "Thursday" },
  { id: 10, name: "Dussehra", date: "2025-10-02", type: "religious", day: "Thursday" },
  { id: 11, name: "Diwali", date: "2025-10-21", type: "religious", day: "Tuesday" },
  { id: 12, name: "Diwali (Day 2)", date: "2025-10-22", type: "religious", day: "Wednesday" },
  { id: 13, name: "Christmas", date: "2025-12-25", type: "religious", day: "Thursday" },
  { id: 14, name: "Year End Break", date: "2025-12-31", type: "company", day: "Wednesday" },
  { id: 15, name: "Eid ul-Fitr", date: "2025-03-31", type: "optional", day: "Monday" },
  { id: 16, name: "Raksha Bandhan", date: "2025-08-09", type: "optional", day: "Saturday" },
];

// GET all holidays (accessible by both HR and employees)
export async function GET() {
  try {
    await requireAuth();
    return NextResponse.json({
      success: true,
      data: defaultHolidays,
      total: defaultHolidays.length,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    console.error("Get holidays error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// POST create a new holiday (HR only)
export async function POST(request: NextRequest) {
  try {
    await requireAuth("hr");
    const body = await request.json();
    const { name, date, type } = body;

    if (!name || !date || !type) {
      return NextResponse.json(
        { success: false, message: "Name, date, and type are required" },
        { status: 400 }
      );
    }

    const validTypes = ["national", "religious", "company", "optional"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, message: "Invalid holiday type" },
        { status: 400 }
      );
    }

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = dayNames[new Date(date).getDay()];

    const newHoliday = {
      id: Math.max(...defaultHolidays.map(h => h.id), 0) + 1,
      name,
      date,
      type,
      day,
    };

    defaultHolidays.push(newHoliday);

    return NextResponse.json(
      { success: true, message: "Holiday created successfully", data: newHoliday },
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
    console.error("Create holiday error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
