import { NextRequest, NextResponse } from "next/server";
import { getData, saveData, getNextId } from "@/database/connection";
import { requireAuth, hashPassword } from "@/lib/auth";
import { employeeSchema } from "@/lib/validations";

// GET all employees (HR only)
export async function GET(request: NextRequest) {
  try {
    await requireAuth("hr");

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const db = await getData();
    let filtered = [...db.employees];

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.full_name.toLowerCase().includes(s) ||
          e.emp_id.toLowerCase().includes(s) ||
          e.email.toLowerCase().includes(s) ||
          e.department.toLowerCase().includes(s)
      );
    }

    if (department) {
      filtered = filtered.filter((e) => e.department === department);
    }

    if (status) {
      filtered = filtered.filter((e) => e.status === status);
    }

    // Sort by created_at descending
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const paged = filtered.slice(offset, offset + limit);

    // Remove password from response
    const safeData = paged.map(({ password, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      data: safeData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized" || err.message === "Forbidden") {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Get employees error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// POST create new employee (HR only)
export async function POST(request: NextRequest) {
  try {
    await requireAuth("hr");

    const body = await request.json();
    const validation = employeeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;
    const db = await getData();

    // Check for duplicates
    if (db.employees.find((e) => e.emp_id === data.emp_id)) {
      return NextResponse.json({ success: false, message: "Employee ID already exists" }, { status: 409 });
    }
    if (db.employees.find((e) => e.email === data.email)) {
      return NextResponse.json({ success: false, message: "Email already exists" }, { status: 409 });
    }
    if (db.employees.find((e) => e.username === data.username)) {
      return NextResponse.json({ success: false, message: "Username already exists" }, { status: 409 });
    }

    const hashedPassword = await hashPassword(data.password);
    const now = new Date().toISOString();
    const newId = getNextId(db.employees);

    const newEmployee = {
      id: newId,
      emp_id: data.emp_id,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      gender: data.gender,
      date_of_birth: data.date_of_birth || "",
      address: data.address || "",
      department: data.department,
      designation: data.designation,
      manager_name: data.manager_name || "",
      doj: data.doj,
      employment_type: data.employment_type,
      probation_period: data.probation_period || "",
      confirmation_date: data.confirmation_date || "",
      work_location: data.work_location || "",
      shift_timing: data.shift_timing || "",
      salary_package: data.salary_package || "",
      bank_account_number: data.bank_account_number || "",
      ifsc_code: data.ifsc_code || "",
      pan_number: data.pan_number || "",
      aadhaar_number: data.aadhaar_number || "",
      username: data.username,
      password: hashedPassword,
      profile_photo: (body.profile_photo as string) || "",
      status: data.status || "active" as const,
      created_at: now,
      updated_at: now,
    };

    db.employees.push(newEmployee);

    // Create initial leave balance for current month
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    db.leave_balance.push({
      id: getNextId(db.leave_balance),
      employee_id: newId,
      month: currentMonth,
      year: currentYear,
      total_cl: 2,
      used_cl: 0,
      remaining_cl: 2,
    });

    await saveData(db);

    return NextResponse.json(
      { success: true, message: "Employee created successfully", id: newId },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized" || err.message === "Forbidden") {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Create employee error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
