import { NextRequest, NextResponse } from "next/server";
import { getData } from "@/database/connection";
import { verifyPassword, generateToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { JWTPayload } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials format" },
        { status: 400 }
      );
    }

    const { username, password } = validation.data;
    const db = await getData();

    // Check HR Admin first
    const admin = db.hr_admin.find((a) => a.username === username);

    if (admin) {
      const isValid = await verifyPassword(password, admin.password);

      if (isValid) {
        const payload: JWTPayload = {
          id: admin.id,
          username: admin.username,
          role: "hr",
        };

        const token = await generateToken(payload);

        const response = NextResponse.json({
          success: true,
          token,
          role: "hr",
          user: { id: admin.id, username: admin.username },
        });

        response.cookies.set("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 8 * 60 * 60,
          path: "/",
        });

        return response;
      }
    }

    // Check Employee
    const employee = db.employees.find(
      (e) => e.username === username && e.status === "active"
    );

    if (employee) {
      const isValid = await verifyPassword(password, employee.password);

      if (isValid) {
        const payload: JWTPayload = {
          id: employee.id,
          username: employee.username,
          role: "employee",
          emp_id: employee.emp_id,
          name: employee.full_name,
        };

        const token = await generateToken(payload);

        const response = NextResponse.json({
          success: true,
          token,
          role: "employee",
          user: {
            id: employee.id,
            username: employee.username,
            name: employee.full_name,
            emp_id: employee.emp_id,
          },
        });

        response.cookies.set("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 8 * 60 * 60,
          path: "/",
        });

        return response;
      }
    }

    return NextResponse.json(
      { success: false, message: "Invalid username or password" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
