import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database with default accounts...");

  const defaultUsers = [
    // Student accounts
    { email: "student1@campus.edu", password: "student123", role: "student" as const, department: "none" as const, fullName: "Student One" },
    { email: "student2@campus.edu", password: "student123", role: "student" as const, department: "none" as const, fullName: "Student Two" },
    { email: "student3@campus.edu", password: "student123", role: "student" as const, department: "none" as const, fullName: "Student Three" },
    
    // Staff accounts
    { email: "medical.staff@campus.edu", password: "medical123", role: "staff" as const, department: "medical" as const, fullName: "Medical Staff" },
    { email: "security.staff@campus.edu", password: "security123", role: "staff" as const, department: "security" as const, fullName: "Security Staff" },
    { email: "guidance.staff@campus.edu", password: "guidance123", role: "staff" as const, department: "guidance" as const, fullName: "Guidance Staff" },
    
    // Admin account
    { email: "admin@campus.edu", password: "admin123", role: "admin" as const, department: "none" as const, fullName: "System Administrator" },
  ];

  for (const user of defaultUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    try {
      await db.insert(users).values({
        email: user.email,
        password: hashedPassword,
        role: user.role,
        department: user.department,
        fullName: user.fullName,
        isActive: true,
      });
      console.log(`✓ Created ${user.role}: ${user.email}`);
    } catch (error: any) {
      if (error.code === '23505') {
        console.log(`• Skipped ${user.email} (already exists)`);
      } else {
        console.error(`✗ Failed to create ${user.email}:`, error.message);
      }
    }
  }

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
