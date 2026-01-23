import { config } from "dotenv";

import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";

config();

const seedJobs = [
  {
    id: crypto.randomUUID(),
    slug: "senior-frontend-engineer",
    title: "Senior Frontend Engineer",
    description: `We're looking for a Senior Frontend Engineer to join our team and help build the next generation of our product.

You'll work closely with designers and backend engineers to create beautiful, performant user interfaces.

**What you'll do:**
- Build and maintain React components
- Optimize application performance
- Mentor junior developers
- Participate in code reviews`,
    requirements: `- 5+ years of frontend development experience
- Strong proficiency in React and TypeScript
- Experience with modern CSS (Tailwind, CSS-in-JS)
- Understanding of web performance optimization
- Excellent communication skills`,
    benefits: `- Competitive salary (70,000 - 90,000)
- Remote-first culture
- 30 days vacation
- Learning budget
- Home office setup allowance`,
    location: "remote",
    employmentType: "full-time",
    industry: "technology",
    salaryMin: 70000,
    salaryMax: 90000,
    isActive: true,
  },
  {
    id: crypto.randomUUID(),
    slug: "product-designer",
    title: "Product Designer",
    description: `Join our design team to create intuitive and beautiful user experiences.

You'll own the design process from research to implementation.

**What you'll do:**
- Conduct user research and usability testing
- Create wireframes, prototypes, and high-fidelity designs
- Maintain and evolve our design system
- Collaborate with engineering on implementation`,
    requirements: `- 3+ years of product design experience
- Proficiency in Figma
- Experience with design systems
- Strong portfolio demonstrating UX process`,
    benefits: `- Competitive salary (55,000 - 75,000)
- Flexible working hours
- Health insurance
- Team offsites`,
    location: "berlin",
    employmentType: "full-time",
    industry: "design",
    salaryMin: 55000,
    salaryMax: 75000,
    isActive: true,
  },
  {
    id: crypto.randomUUID(),
    slug: "backend-engineer-node",
    title: "Backend Engineer (Node.js)",
    description: `We're expanding our backend team and looking for engineers passionate about building scalable APIs.

**What you'll do:**
- Design and build RESTful and GraphQL APIs
- Optimize database queries and architecture
- Implement security best practices`,
    requirements: `- 3+ years of Node.js/TypeScript experience
- Experience with PostgreSQL or similar databases
- Understanding of API design principles`,
    benefits: `- Competitive salary (60,000 - 80,000)
- Stock options
- Remote work options`,
    location: "hybrid",
    employmentType: "full-time",
    industry: "technology",
    salaryMin: 60000,
    salaryMax: 80000,
    isActive: true,
  },
  {
    id: crypto.randomUUID(),
    slug: "marketing-manager",
    title: "Marketing Manager",
    description: `Lead our marketing efforts and help us reach more customers.

**What you'll do:**
- Develop marketing strategy and campaigns
- Manage social media presence
- Analyze marketing metrics and optimize`,
    requirements: `- 4+ years of marketing experience
- Experience with B2B marketing
- Strong analytical skills`,
    benefits: `- Competitive salary (50,000 - 65,000)
- Performance bonuses
- Flexible hours`,
    location: "munich",
    employmentType: "full-time",
    industry: "marketing",
    salaryMin: 50000,
    salaryMax: 65000,
    isActive: true,
  },
  {
    id: crypto.randomUUID(),
    slug: "freelance-data-analyst",
    title: "Freelance Data Analyst",
    description: `We need a data analyst for a 3-month project.

**Project scope:**
- Analyze user engagement data
- Create dashboards and reports
- Provide actionable insights`,
    requirements: `- Experience with SQL and Python
- Proficiency in data visualization tools
- Strong analytical mindset`,
    benefits: `- Competitive hourly rate
- Flexible schedule
- Remote work`,
    location: "remote",
    employmentType: "freelance",
    industry: "technology",
    salaryMin: null,
    salaryMax: null,
    isActive: true,
  },
];

async function seed() {
  // biome-ignore lint/suspicious/noConsole: Script output
  console.log("Seeding jobs...");

  for (const job of seedJobs) {
    await db.insert(jobs).values(job).onConflictDoNothing();
    // biome-ignore lint/suspicious/noConsole: Script output
    console.log(`  Created: ${job.title}`);
  }

  // biome-ignore lint/suspicious/noConsole: Script output
  console.log("Done!");
  process.exit(0);
}

seed().catch((error) => {
  // biome-ignore lint/suspicious/noConsole: Script output
  console.error("Seed failed:", error);
  process.exit(1);
});
