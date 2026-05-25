import { NextResponse } from "next/server";
import { getData } from "@/database/connection";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth("hr");

    const db = await getData();
    const deptMap: Record<string, number> = {};

    for (const emp of db.employees) {
      deptMap[emp.department] = (deptMap[emp.department] || 0) + 1;
    }

    const departments = Object.entries(deptMap).map(([department, count]) => ({
      department,
      count,
    }));

    departments.sort((a, b) => a.department.localeCompare(b.department));

    return NextResponse.json({ success: true, data: departments });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
