import { NextRequest, NextResponse } from "next/server";
import { getData, saveData } from "@/database/connection";
import { requireAuth, hashPassword } from "@/lib/auth";

// GET single employee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const db = await getData();

    let employee;

    if (user.role === "hr") {
      employee = db.employees.find((e) => e.id === parseInt(id));
    } else {
      employee = db.employees.find((e) => e.id === user.id);
    }

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 });
    }

    // Remove password from response
    const { password, ...safeEmployee } = employee;
    return NextResponse.json({ success: true, data: safeEmployee });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized" || err.message === "Forbidden") {
      return NextResponse.json({ success: false, message: err.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// PUT update employee (HR only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth("hr");
    const { id } = await params;
    const body = await request.json();
    const db = await getData();

    const index = db.employees.findIndex((e) => e.id === parseInt(id));
    if (index === -1) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 });
    }

    const allowedFields = [
      "full_name", "email", "phone", "gender", "date_of_birth", "address",
      "department", "designation", "manager_name", "doj", "employment_type",
      "probation_period", "confirmation_date", "work_location", "shift_timing",
      "salary_package", "bank_account_number", "ifsc_code", "pan_number",
      "aadhaar_number", "username", "status", "profile_photo",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (db.employees[index] as Record<string, unknown>)[field] = body[field];
      }
    }

    // Handle password update separately
    if (body.password && body.password.length > 0) {
      db.employees[index].password = await hashPassword(body.password);
    }

    db.employees[index].updated_at = new Date().toISOString();
    await saveData(db);

    return NextResponse.json({ success: true, message: "Employee updated successfully" });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized" || err.message === "Forbidden") {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.message === "Unauthorized" ? 401 : 403 }
      );
    }
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// DELETE employee (HR only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth("hr");
    const { id } = await params;
    const db = await getData();
    const empId = parseInt(id);

    db.employees = db.employees.filter((e) => e.id !== empId);
    db.leaves = db.leaves.filter((l) => l.employee_id !== empId);
    db.leave_balance = db.leave_balance.filter((lb) => lb.employee_id !== empId);

    await saveData(db);

    return NextResponse.json({ success: true, message: "Employee deleted successfully" });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized" || err.message === "Forbidden") {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.message === "Unauthorized" ? 401 : 403 }
      );
    }
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
