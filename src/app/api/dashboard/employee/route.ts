import { NextResponse } from "next/server";
import { getData, saveData, getNextId } from "@/database/connection";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth("employee");
    const db = await getData();

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get or create leave balance
    let balance = db.leave_balance.find(
      (lb) => lb.employee_id === user.id && lb.month === currentMonth && lb.year === currentYear
    );

    if (!balance) {
      balance = {
        id: getNextId(db.leave_balance),
        employee_id: user.id,
        month: currentMonth,
        year: currentYear,
        total_cl: 2,
        used_cl: 0,
        remaining_cl: 2,
      };
      db.leave_balance.push(balance);
      await saveData(db);
    }

    // Counts
    const myLeaves = db.leaves.filter((l) => l.employee_id === user.id);
    const pendingLeaves = myLeaves.filter((l) => l.status === "pending").length;
    const approvedLeaves = myLeaves.filter(
      (l) => l.status === "approved" && new Date(l.start_date).getFullYear() === currentYear
    ).length;

    // Recent leaves
    const recentLeaves = myLeaves
      .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        leaveBalance: balance,
        pendingLeaves,
        approvedLeaves,
        recentLeaves,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized" || err.message === "Forbidden") {
      return NextResponse.json({ success: false, message: err.message }, { status: 401 });
    }
    console.error("Employee Dashboard error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
