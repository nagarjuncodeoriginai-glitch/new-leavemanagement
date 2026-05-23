import { NextRequest, NextResponse } from "next/server";
import { getData, saveData, getNextId } from "@/database/connection";
import { requireAuth } from "@/lib/auth";

// PUT - Approve/Reject leave (HR only) OR Cancel leave (Employee)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    const db = getData();
    if (!db.notifications) db.notifications = [];
    const leaveIndex = db.leaves.findIndex((l) => l.id === parseInt(id));

    if (leaveIndex === -1) {
      return NextResponse.json({ success: false, message: "Leave not found" }, { status: 404 });
    }

    const leave = db.leaves[leaveIndex];

    // Employee cancellation
    if (action === "cancelled") {
      if (user.role !== "employee" || leave.employee_id !== user.id) {
        return NextResponse.json(
          { success: false, message: "You can only cancel your own leave requests" },
          { status: 403 }
        );
      }

      if (leave.status !== "pending") {
        return NextResponse.json(
          { success: false, message: "Only pending leaves can be cancelled" },
          { status: 400 }
        );
      }

      db.leaves[leaveIndex].status = "cancelled";
      db.leaves[leaveIndex].cancelled_at = new Date().toISOString();

      // Notify HR about cancellation
      const emp = db.employees.find((e) => e.id === user.id);
      db.notifications.push({
        id: getNextId(db.notifications),
        user_id: 1,
        user_role: "hr",
        type: "leave_cancelled",
        title: "Leave Cancelled",
        message: `${emp?.full_name || "Employee"} cancelled their CL request (${leave.start_date} to ${leave.end_date})`,
        is_read: false,
        created_at: new Date().toISOString(),
        related_id: leave.id,
      });

      saveData(db);

      return NextResponse.json({
        success: true,
        message: "Leave cancelled successfully",
      });
    }

    // HR approval/rejection
    if (user.role !== "hr") {
      return NextResponse.json(
        { success: false, message: "Only HR can approve or reject leaves" },
        { status: 403 }
      );
    }

    if (!["approved", "rejected"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Invalid action. Use 'approved', 'rejected', or 'cancelled'" },
        { status: 400 }
      );
    }

    if (leave.status !== "pending") {
      return NextResponse.json(
        { success: false, message: "Leave already processed" },
        { status: 400 }
      );
    }

    // Update leave status
    db.leaves[leaveIndex].status = action;
    db.leaves[leaveIndex].reviewed_at = new Date().toISOString();
    db.leaves[leaveIndex].reviewed_by = "HR Admin";

    // If approved, update leave balance
    if (action === "approved") {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const month = start.getMonth() + 1;
      const year = start.getFullYear();

      const balanceIndex = db.leave_balance.findIndex(
        (lb) => lb.employee_id === leave.employee_id && lb.month === month && lb.year === year
      );

      if (balanceIndex !== -1) {
        db.leave_balance[balanceIndex].used_cl += diffDays;
        db.leave_balance[balanceIndex].remaining_cl -= diffDays;
      } else {
        db.leave_balance.push({
          id: getNextId(db.leave_balance),
          employee_id: leave.employee_id,
          month,
          year,
          total_cl: 2,
          used_cl: diffDays,
          remaining_cl: 2 - diffDays,
        });
      }
    }

    // Notify the employee
    db.notifications.push({
      id: getNextId(db.notifications),
      user_id: leave.employee_id,
      user_role: "employee",
      type: action === "approved" ? "leave_approved" : "leave_rejected",
      title: action === "approved" ? "Leave Approved" : "Leave Rejected",
      message: `Your Casual Leave request (${leave.start_date} to ${leave.end_date}) has been ${action}.`,
      is_read: false,
      created_at: new Date().toISOString(),
      related_id: leave.id,
    });

    saveData(db);

    return NextResponse.json({
      success: true,
      message: `Leave ${action} successfully`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized" || err.message === "Forbidden") {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Leave action error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
