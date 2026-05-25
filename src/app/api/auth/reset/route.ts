import { NextResponse } from "next/server";
import { getData, saveData } from "@/database/connection";
import bcrypt from "bcryptjs";

// GET /api/auth/reset - Reset HR admin password (one-time fix)
// Access this URL once to fix login: https://your-domain.vercel.app/api/auth/reset
export async function GET() {
  try {
    const db = await getData();
    
    // Reset HR admin password to a fresh hash
    const freshHash = bcrypt.hashSync("hrcodeoriginai@1234", 10);
    db.hr_admin = [{ id: 1, username: "codeorigin", password: freshHash }];
    
    await saveData(db);
    
    return NextResponse.json({
      success: true,
      message: "HR admin password reset successfully. Login with: codeorigin / hrcodeoriginai@1234",
    });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json({ success: false, message: String(error) }, { status: 500 });
  }
}
