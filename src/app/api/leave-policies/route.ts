import { NextRequest, NextResponse } from "next/server";
import { getData, saveData } from "@/database/connection";
import { requireAuth } from "@/lib/auth";
import { leavePolicySchema } from "@/lib/validations";

// GET all leave policies (accessible by both HR and employees)
export async function GET() {
  try {
    await requireAuth();
    const db = getData();
    const policies = db.leave_policies || [];

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

// PUT - Update a leave policy (HR only)
export async function PUT(request: NextRequest) {
  try {
    await requireAuth("hr");
    const body = await request.json();
    const { id, ...policyData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Policy ID is required" },
        { status: 400 }
      );
    }

    const validation = leavePolicySchema.safeParse(policyData);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors: validation.error.errors },
        { status: 400 }
      );
    }

    const db = getData();
    if (!db.leave_policies) db.leave_policies = [];

    const policyIndex = db.leave_policies.findIndex((p) => p.id === id);
    if (policyIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Policy not found" },
        { status: 404 }
      );
    }

    db.leave_policies[policyIndex] = {
      ...db.leave_policies[policyIndex],
      ...validation.data,
      updated_at: new Date().toISOString(),
    };

    // Notify all employees about policy update
    if (!db.notifications) db.notifications = [];
    const { getNextId } = await import("@/database/connection");
    for (const emp of db.employees) {
      db.notifications.push({
        id: getNextId(db.notifications),
        user_id: emp.id,
        user_role: "employee",
        type: "policy_update",
        title: "Leave Policy Updated",
        message: `${validation.data.label} policy has been updated. Monthly quota: ${validation.data.monthly_quota} day(s).`,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    saveData(db);

    return NextResponse.json({
      success: true,
      message: "Policy updated successfully",
      data: db.leave_policies[policyIndex],
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized" || err.message === "Forbidden") {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Update policy error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
