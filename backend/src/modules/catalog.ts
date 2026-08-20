import { FeatureModule } from "../types/feature.js";

export const featureCatalog: FeatureModule[] = [
  {
    slug: "employees",
    name: "Employee Management",
    description: "Core employee records, documents, and profile management.",
    capabilities: ["profiles", "documents", "personal-data"]
  },
  {
    slug: "recruitment",
    name: "Recruitment",
    description: "Job postings, applicant tracking, and interview coordination.",
    capabilities: ["job-postings", "applicant-tracking", "interview-scheduling"]
  },
  {
    slug: "payroll",
    name: "Payroll & Compensation",
    description: "Salary, benefits, and pay-stub administration.",
    capabilities: ["salary-management", "benefits", "pay-stubs"]
  },
  {
    slug: "time-attendance",
    name: "Time & Attendance",
    description: "Time tracking, attendance, and leave workflows.",
    capabilities: ["time-tracking", "attendance", "leave-management"]
  },
  {
    slug: "performance",
    name: "Performance Management",
    description: "Goals, reviews, and ongoing feedback cycles.",
    capabilities: ["reviews", "goals", "feedback"]
  },
  {
    slug: "reports",
    name: "Reports & Analytics",
    description: "HR dashboards and operational reporting.",
    capabilities: ["dashboards", "employee-reports", "analytics"]
  }
];
