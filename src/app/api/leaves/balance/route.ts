import { NextRequest, NextResponse } from "next/server";
import { getData, saveData, getNextId } from "@/database/connection";
import { requireAuth } from "@/lib/auth";

// GET leave balance (CL only)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const employeeId = searchParams.get("employee_id");

    const db = getData();

    if (user.role === "hr" && !employeeId) {
      // HR viewing all balances
      const balances = db.leave_balance
        .filter((lb) => lb.month === month && lb.year === year)
        .map((lb) => {
          const emp = db.employees.find((e) => e.id === lb.employee_id);
          return { ...lb, full_name: emp?.full_name, emp_id: emp?.emp_id };
        });
      return NextResponse.json({ success: true, data: balances });
    }

    const targetId = user.role === "hr" && employeeId ? parseInt(employeeId) : user.id;

    let balance = db.leave_balance.find(
      (lb) => lb.employee_id === targetId && lb.month === month && lb.year === year
    );

    if (!balance) {
      // Create default balance
      balance = {
        id: getNextId(db.leave_balance),
        employee_id: targetId,
        month,
        year,
        total_cl: 2,
        used_cl: 0,
        remaining_cl: 2,
      };
      db.leave_balance.push(balance);
      saveData(db);
    }

    return NextResponse.json({ success: true, data: balance });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    console.error("Get balance error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
