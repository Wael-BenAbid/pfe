import { pgTable, text, serial, integer, boolean, date, timestamp, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  user_type: text("user_type").notNull().default('employee'),
  leave_balance: decimal("leave_balance").notNull().default("30"),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  user_type: true,
  leave_balance: true,
  first_name: true,
  last_name: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Leave schema
export const leaves = pgTable("leaves", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  user_name: text("user_name").notNull(),
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default('pending'),
  created_at: timestamp("created_at").notNull().defaultNow()
});

export const insertLeaveSchema = createInsertSchema(leaves).pick({
  user_id: true,
  start_date: true,
  end_date: true,
  reason: true
});

export type InsertLeave = z.infer<typeof insertLeaveSchema>;
export type Leave = typeof leaves.$inferSelect;

// Mission schema
export const missions = pgTable("missions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  assigned_to_id: integer("assigned_to_id").notNull().references(() => users.id),
  assigned_to_name: text("assigned_to_name").notNull(),
  supervisor_id: integer("supervisor_id").notNull().references(() => users.id),
  supervisor_name: text("supervisor_name").notNull(),
  deadline: date("deadline").notNull(),
  completed: boolean("completed").notNull().default(false),
  created_at: timestamp("created_at").notNull().defaultNow()
});

export const insertMissionSchema = createInsertSchema(missions).pick({
  title: true,
  description: true,
  assigned_to_id: true,
  supervisor_id: true,
  deadline: true
});

export type InsertMission = z.infer<typeof insertMissionSchema>;
export type Mission = typeof missions.$inferSelect;

// Work Hours schema
export const workHours = pgTable("work_hours", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  user_name: text("user_name").notNull(),
  date: date("date").notNull(),
  hours_worked: decimal("hours_worked").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow()
});

export const insertWorkHoursSchema = createInsertSchema(workHours).pick({
  user_id: true,
  date: true,
  hours_worked: true
});

export type InsertWorkHours = z.infer<typeof insertWorkHoursSchema>;
export type WorkHours = typeof workHours.$inferSelect;

// Internship schema
export const internships = pgTable("internships", {
  id: serial("id").primaryKey(),
  intern_id: integer("intern_id").notNull().references(() => users.id),
  intern_name: text("intern_name").notNull(),
  supervisor_id: integer("supervisor_id").notNull().references(() => users.id),
  supervisor_name: text("supervisor_name").notNull(),
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),
  status: text("status").notNull().default('pending'),
  created_at: timestamp("created_at").notNull().defaultNow()
});

export const insertInternshipSchema = createInsertSchema(internships).pick({
  intern_id: true,
  supervisor_id: true,
  start_date: true,
  end_date: true
});

export type InsertInternship = z.infer<typeof insertInternshipSchema>;
export type Internship = typeof internships.$inferSelect;

// Job Application schema
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  application_type: text("application_type").notNull(),
  position: text("position").notNull(),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  education: text("education").notNull(),
  experience: text("experience").notNull(),
  motivation: text("motivation").notNull(),
  cv_file: text("cv_file").notNull(),
  status: text("status").notNull().default('pending'),
  created_at: timestamp("created_at").notNull().defaultNow()
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).pick({
  user_id: true,
  application_type: true,
  position: true,
  first_name: true,
  last_name: true,
  email: true,
  phone: true,
  education: true,
  experience: true,
  motivation: true,
  cv_file: true
});

export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type JobApplication = typeof jobApplications.$inferSelect;
