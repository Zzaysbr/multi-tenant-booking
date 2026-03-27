import { pgTable, serial, varchar, timestamp, integer, pgEnum, text } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["ADMIN", "OWNER", "STAFF", "CUSTOMER"]);
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "canceled", "completed"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed", "refunded"]);

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  path_name: varchar("path_name", { length: 100 }).notNull().unique(),
  line_channel_token: text("line_channel_token"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: roleEnum("role").default("CUSTOMER").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const staffs = pgTable("staffs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  price: integer("price").notNull(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  customerId: integer("customer_id").references(() => users.id).notNull(),
  staffId: integer("staff_id").references(() => staffs.id).notNull(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  status: bookingStatusEnum("status").default("pending").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  method: varchar("method", { length: 50 }).notNull(),
  slipUrl: text("slip_url"),
  status: paymentStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});