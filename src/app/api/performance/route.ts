import { NextRequest, NextResponse } from "next/server";
import { getData, saveData, getNextId } from "@/database/connection";
import { requireAuth } from "@/lib/auth";

// GET all performance data (goals, feedback, skills)
export async function GET() {
  try {
    const user = await requireAuth();
    const db = getData();

    let goals = db.performance_goals || [];
    let feedback = db.performance_feedback || [];
    let skills = db.performance_skills || [];

    // Employees can only see their own data
    if (user.role === "employee" && user.emp_id) {
      goals = goals.filter(g => g.employeeId === user.emp_id);
      feedback = feedback.filter(f => f.employeeId === user.emp_id);
      skills = skills.filter(s => s.employeeId === user.emp_id);
    }

    return NextResponse.json({
      success: true,
      data: {
        goals,
        feedback,
        skills,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized" || err.message === "Forbidden") {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Get performance error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// POST - Add goal, feedback, or skill
export async function POST(request: NextRequest) {
  try {
    await requireAuth("hr");
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { success: false, message: "type and data are required" },
        { status: 400 }
      );
    }

    const db = getData();
    if (!db.performance_goals) db.performance_goals = [];
    if (!db.performance_feedback) db.performance_feedback = [];
    if (!db.performance_skills) db.performance_skills = [];

    if (type === "goal") {
      if (!data.title || !data.employeeId || !data.dueDate || !data.category) {
        return NextResponse.json(
          { success: false, message: "title, employeeId, dueDate, category are required" },
          { status: 400 }
        );
      }
      const newGoal = {
        id: getNextId(db.performance_goals),
        title: data.title,
        description: data.description || "",
        progress: data.progress || 0,
        status: data.status || "not_started",
        dueDate: data.dueDate,
        category: data.category,
        assignedBy: "HR Admin",
        assignedAt: new Date().toISOString(),
        employeeId: data.employeeId,
      };
      db.performance_goals.push(newGoal);
      saveData(db);
      return NextResponse.json({ success: true, message: "Goal assigned", data: newGoal }, { status: 201 });
    }

    if (type === "feedback") {
      if (!data.message || !data.employeeId) {
        return NextResponse.json(
          { success: false, message: "message and employeeId are required" },
          { status: 400 }
        );
      }
      const newFeedback = {
        id: getNextId(db.performance_feedback),
        from: "HR Admin",
        role: "HR",
        message: data.message,
        rating: data.rating || 5,
        date: new Date().toISOString().split("T")[0],
        type: data.type || "general",
        employeeId: data.employeeId,
      };
      db.performance_feedback.push(newFeedback);
      saveData(db);
      return NextResponse.json({ success: true, message: "Feedback submitted", data: newFeedback }, { status: 201 });
    }

    if (type === "skill") {
      if (!data.skill || !data.employeeId) {
        return NextResponse.json(
          { success: false, message: "skill and employeeId are required" },
          { status: 400 }
        );
      }
      // Remove existing rating for same skill+employee, then add new
      db.performance_skills = db.performance_skills.filter(
        (s) => !(s.employeeId === data.employeeId && s.skill === data.skill)
      );
      const newSkill = {
        skill: data.skill,
        rating: data.rating || 3,
        max: 5,
        employeeId: data.employeeId,
      };
      db.performance_skills.push(newSkill);
      saveData(db);
      return NextResponse.json({ success: true, message: "Skill rated", data: newSkill }, { status: 201 });
    }

    return NextResponse.json({ success: false, message: "Invalid type. Use: goal, feedback, skill" }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized" || err.message === "Forbidden") {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Create performance error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update a goal
export async function PUT(request: NextRequest) {
  try {
    await requireAuth("hr");
    const body = await request.json();
    const { type, id, data } = body;

    if (!type || !data) {
      return NextResponse.json({ success: false, message: "type and data required" }, { status: 400 });
    }

    const db = getData();
    if (!db.performance_goals) db.performance_goals = [];

    if (type === "goal") {
      const index = db.performance_goals.findIndex((g) => g.id === id);
      if (index === -1) {
        return NextResponse.json({ success: false, message: "Goal not found" }, { status: 404 });
      }
      db.performance_goals[index] = {
        ...db.performance_goals[index],
        title: data.title ?? db.performance_goals[index].title,
        description: data.description ?? db.performance_goals[index].description,
        progress: data.progress ?? db.performance_goals[index].progress,
        status: data.status ?? db.performance_goals[index].status,
        dueDate: data.dueDate ?? db.performance_goals[index].dueDate,
        category: data.category ?? db.performance_goals[index].category,
        employeeId: data.employeeId ?? db.performance_goals[index].employeeId,
      };
      saveData(db);
      return NextResponse.json({ success: true, message: "Goal updated", data: db.performance_goals[index] });
    }

    return NextResponse.json({ success: false, message: "Only goal updates supported" }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized" || err.message === "Forbidden") {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Update performance error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove goal or feedback
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth("hr");
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = parseInt(searchParams.get("id") || "0");

    if (!type || !id) {
      return NextResponse.json({ success: false, message: "type and id required" }, { status: 400 });
    }

    const db = getData();

    if (type === "goal") {
      if (!db.performance_goals) db.performance_goals = [];
      const before = db.performance_goals.length;
      db.performance_goals = db.performance_goals.filter((g) => g.id !== id);
      if (db.performance_goals.length === before) {
        return NextResponse.json({ success: false, message: "Goal not found" }, { status: 404 });
      }
      saveData(db);
      return NextResponse.json({ success: true, message: "Goal deleted" });
    }

    if (type === "feedback") {
      if (!db.performance_feedback) db.performance_feedback = [];
      const before = db.performance_feedback.length;
      db.performance_feedback = db.performance_feedback.filter((f) => f.id !== id);
      if (db.performance_feedback.length === before) {
        return NextResponse.json({ success: false, message: "Feedback not found" }, { status: 404 });
      }
      saveData(db);
      return NextResponse.json({ success: true, message: "Feedback deleted" });
    }

    return NextResponse.json({ success: false, message: "Invalid type. Use: goal, feedback" }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized" || err.message === "Forbidden") {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Delete performance error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
