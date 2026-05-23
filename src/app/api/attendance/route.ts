import { NextRequest, NextResponse } from "next/server";
import { getData, saveData, getNextId } from "@/database/connection";
import { requireAuth } from "@/lib/auth";

// GET attendance records
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || "";
    const employeeId = searchParams.get("employee_id") || "";

    const db = getData();
    if (!db.attendance) db.attendance = [];

    let records = [...db.attendance];

    // Employees can only see their own
    if (user.role === "employee") {
      records = records.filter(r => r.employee_id === user.id);
    }

    if (date) {
      records = records.filter(r => r.date === date);
    }
    if (employeeId) {
      records = records.filter(r => r.employee_id === parseInt(employeeId));
    }

    // Sort by date desc, then by check_in desc
    records.sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return (b.check_in || "").localeCompare(a.check_in || "");
    });

    return NextResponse.json({
      success: true,
      data: records,
      total: records.length,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    console.error("Get attendance error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// Helper: parse time string like "03:15 pm" or "15:15" to hours (0-23) and minutes
function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
  if (!match) return -1;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const period = match[3];
  if (period) {
    const p = period.toUpperCase();
    if (p === "PM" && h !== 12) h += 12;
    if (p === "AM" && h === 12) h = 0;
  }
  return h * 60 + m;
}

// POST check-in or check-out
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth("employee");
    const body = await request.json();
    const { action, location, latitude, longitude } = body;

    if (!action || !["check_in", "check_out"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Invalid action. Use 'check_in' or 'check_out'" },
        { status: 400 }
      );
    }

    const db = getData();
    if (!db.attendance) db.attendance = [];

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

    // Find employee info
    const employee = db.employees.find(e => e.id === user.id);
    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 });
    }

    // Check if there's already a record for today
    const existingIndex = db.attendance.findIndex(
      r => r.employee_id === user.id && r.date === today
    );

    if (action === "check_in") {
      if (existingIndex >= 0 && db.attendance[existingIndex].check_in) {
        return NextResponse.json(
          { success: false, message: "Already checked in today" },
          { status: 400 }
        );
      }

      const isLate = now.getHours() > 10 || (now.getHours() === 10 && now.getMinutes() > 30);
      const locationStr = location || (latitude && longitude ? `Lat: ${latitude}, Lng: ${longitude}` : "Unknown");

      if (existingIndex >= 0) {
        db.attendance[existingIndex].check_in = timeStr;
        db.attendance[existingIndex].check_in_location = locationStr;
        db.attendance[existingIndex].status = isLate ? "late" : "present";
      } else {
        const newRecord = {
          id: getNextId(db.attendance),
          employee_id: user.id,
          emp_id: employee.emp_id,
          full_name: employee.full_name,
          date: today,
          check_in: timeStr,
          check_out: null,
          check_in_location: locationStr,
          check_out_location: null,
          status: (isLate ? "late" : "present") as "present" | "late" | "absent",
          hours: 0,
          is_auto: false,
        };
        db.attendance.push(newRecord);
      }

      saveData(db);
      return NextResponse.json({
        success: true,
        message: `Checked in at ${timeStr}`,
        data: { time: timeStr, location: locationStr, status: isLate ? "late" : "present" },
      });
    }

    if (action === "check_out") {
      if (existingIndex < 0 || !db.attendance[existingIndex].check_in) {
        return NextResponse.json(
          { success: false, message: "Not checked in today" },
          { status: 400 }
        );
      }
      if (db.attendance[existingIndex].check_out) {
        return NextResponse.json(
          { success: false, message: "Already checked out today" },
          { status: 400 }
        );
      }

      const locationStr = location || (latitude && longitude ? `Lat: ${latitude}, Lng: ${longitude}` : "Unknown");

      // Calculate hours worked using check_in and current time
      const checkInMinutes = parseTimeToMinutes(db.attendance[existingIndex].check_in || "");
      const checkOutMinutes = now.getHours() * 60 + now.getMinutes();
      let hoursWorked = 0;
      if (checkInMinutes >= 0 && checkOutMinutes > checkInMinutes) {
        hoursWorked = (checkOutMinutes - checkInMinutes) / 60;
      }

      db.attendance[existingIndex].check_out = timeStr;
      db.attendance[existingIndex].check_out_location = locationStr;
      db.attendance[existingIndex].hours = parseFloat(hoursWorked.toFixed(1));

      saveData(db);
      return NextResponse.json({
        success: true,
        message: `Checked out at ${timeStr}. Worked ${hoursWorked.toFixed(1)} hours.`,
        data: { time: timeStr, hours: parseFloat(hoursWorked.toFixed(1)) },
      });
    }

    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized" || err.message === "Forbidden") {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Attendance action error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// DELETE attendance record (HR only)
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth("hr");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Attendance record ID is required" },
        { status: 400 }
      );
    }

    const db = getData();
    if (!db.attendance) db.attendance = [];

    const recordIndex = db.attendance.findIndex(r => r.id === parseInt(id));
    if (recordIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Attendance record not found" },
        { status: 404 }
      );
    }

    db.attendance.splice(recordIndex, 1);
    saveData(db);

    return NextResponse.json({
      success: true,
      message: "Attendance record deleted successfully",
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized" || err.message === "Forbidden") {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Delete attendance error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
