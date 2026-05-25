import { NextResponse } from "next/server";
import { getData, saveData, getNextId } from "@/database/connection";

// POST - Monthly leave reset
export async function POST() {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const db = await getData();
    const activeEmployees = db.employees.filter((e) => e.status === "active");

    let resetCount = 0;

    for (const emp of activeEmployees) {
      const existingIndex = db.leave_balance.findIndex(
        (lb) => lb.employee_id === emp.id && lb.month === currentMonth && lb.year === currentYear
      );

      if (existingIndex !== -1) {
        db.leave_balance[existingIndex].total_cl = 2;
        db.leave_balance[existingIndex].used_cl = 0;
        db.leave_balance[existingIndex].remaining_cl = 2;
      } else {
        db.leave_balance.push({
          id: getNextId(db.leave_balance),
          employee_id: emp.id,
          month: currentMonth,
          year: currentYear,
          total_cl: 2,
          used_cl: 0,
          remaining_cl: 2,
        });
      }
      resetCount++;
    }

    await saveData(db);

    return NextResponse.json({
      success: true,
      message: `Leave balance reset for ${resetCount} employees for ${currentMonth}/${currentYear}`,
    });
  } catch (error) {
    console.error("Leave reset error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
