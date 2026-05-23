import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

// GET leave policies - only CL is available
export async function GET() {
  try {
    await requireAuth();

    const policies = [
      {
        id: 1,
        leave_type: "CL",
        label: "Casual Leave",
        monthly_quota: 2,
        carry_forward: false,
        requires_approval: true,
        max_consecutive_days: 2,
      },
    ];

    return NextResponse.json({
      success: true,
      data: policies,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    console.error("Get policies error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
