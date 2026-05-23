import { NextRequest, NextResponse } from "next/server";
import { getData, saveData, getNextId } from "@/database/connection";
import { requireAuth } from "@/lib/auth";

// GET leave balance - now supports all leave types
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const employeeId = searchParams.get("employee_id");

    const db = getData();

    // Get policy quotas
    const clPolicy = (db.leave_policies || []).find((p) => p.leave_type === "CL");
    const slPolicy = (db.leave_policies || []).find((p) => p.leave_type === "SL");
    const elPolicy = (db.leave_policies || []).find((p) => p.leave_type === "EL");
    const wfhPolicy = (db.leave_policies || []).find((p) => p.leave_type === "WFH");

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
      // Create default balance using policy quotas
      balance = {
        id: getNextId(db.leave_balance),
        employee_id: targetId,
        month,
        year,
        total_cl: clPolicy?.monthly_quota ?? 2,
        used_cl: 0,
        remaining_cl: clPolicy?.monthly_quota ?? 2,
        total_sl: slPolicy?.monthly_quota ?? 1,
        used_sl: 0,
        remaining_sl: slPolicy?.monthly_quota ?? 1,
        total_el: elPolicy?.monthly_quota ?? 1,
        used_el: 0,
        remaining_el: elPolicy?.monthly_quota ?? 1,
        total_wfh: wfhPolicy?.monthly_quota ?? 4,
        used_wfh: 0,
        remaining_wfh: wfhPolicy?.monthly_quota ?? 4,
      };
      db.leave_balance.push(balance);
      saveData(db);
    } else {
      // Ensure all fields exist (migration)
      balance.total_sl = balance.total_sl ?? (slPolicy?.monthly_quota ?? 1);
      balance.used_sl = balance.used_sl ?? 0;
      balance.remaining_sl = balance.remaining_sl ?? (slPolicy?.monthly_quota ?? 1);
      balance.total_el = balance.total_el ?? (elPolicy?.monthly_quota ?? 1);
      balance.used_el = balance.used_el ?? 0;
      balance.remaining_el = balance.remaining_el ?? (elPolicy?.monthly_quota ?? 1);
      balance.total_wfh = balance.total_wfh ?? (wfhPolicy?.monthly_quota ?? 4);
      balance.used_wfh = balance.used_wfh ?? 0;
      balance.remaining_wfh = balance.remaining_wfh ?? (wfhPolicy?.monthly_quota ?? 4);
    }

    // Also return active policies for the UI
    const activePolicies = (db.leave_policies || []).filter((p) => p.is_active);

    return NextResponse.json({ success: true, data: balance, policies: activePolicies });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    console.error("Get balance error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
