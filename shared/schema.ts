import { 
  mysqlTable, int, varchar, boolean, decimal, timestamp, date, unique, mysqlEnum, text
} from "drizzle-orm/mysql-core";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

// ---------------------- Employees ----------------------
export const employees = mysqlTable("employees", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  full_name: varchar("full_name", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["employee", "admin"]).notNull().default("employee"),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  created_at: true,
});
export const updateEmployeeSchema = z.object({
  full_name: z.string().optional(),
  role: z.string().optional(),
  is_active: z.boolean().optional(),
});
export type Employee = typeof employees.$inferSelect;

// ---------------------- Inventory ----------------------
export const inventory = mysqlTable("inventory", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["upper", "lower"]).notNull(),
  type: varchar("type", { length: 255 }).notNull(),
  quantity: int("quantity").notNull().default(0),
  min_stock: int("min_stock").notNull().default(0),
  purchase_price: decimal("purchase_price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  created_at: true,
});
export const updateInventorySchema = z.object({
  quantity: z.number().min(0).optional(),
});
export type InventoryItem = typeof inventory.$inferSelect;

// ---------------------- Modifications ----------------------
export const modifications = mysqlTable("modifications", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 100 }).notNull(),
  item_id: int("item_id").notNull(),
  item_name: varchar("item_name", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  total_cost: decimal("total_cost", { precision: 10, scale: 2 }).notNull().default("0.00"),
  description: varchar("description", { length: 500 }).default(""),
  operation_type: mysqlEnum("operation_type", ["add", "subtract", "restock"]).notNull().default("subtract"),
  discord_channel_id: varchar("discord_channel_id", { length: 100 }).default(""),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertModificationSchema = createInsertSchema(modifications).omit({
  id: true,
  created_at: true,
});
export type Modification = typeof modifications.$inferSelect;

// ---------------------- Employee Deductions ----------------------
export const employee_deductions = mysqlTable("employee_deductions", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 100 }).notNull(),
  modification_id: int("modification_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  is_paid: boolean("is_paid").notNull().default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertEmployeeDeductionSchema = createInsertSchema(employee_deductions).omit({
  id: true,
  created_at: true,
});
export type EmployeeDeduction = typeof employee_deductions.$inferSelect;

// ---------------------- Orders ----------------------
export const orders = mysqlTable("orders", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 100 }).notNull(),
  item_name: varchar("item_name", { length: 255 }).notNull(),
  item_id: int("item_id").notNull(),
  quantity: int("quantity").notNull(),
  unit_price: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  total_cost: decimal("total_cost", { precision: 10, scale: 2 }).notNull().default("0.00"),
  profit: decimal("profit", { precision: 10, scale: 2 }).notNull().default("0.00"),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).notNull().default("pending"),
  description: varchar("description", { length: 500 }).default(""),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  created_at: true,
});
export type Order = typeof orders.$inferSelect;

// ---------------------- Salary History ----------------------
export const salary_history = mysqlTable("salary_history", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  description: varchar("description", { length: 500 }).default(""),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertSalaryHistorySchema = createInsertSchema(salary_history).omit({
  id: true,
  created_at: true,
});
export type SalaryHistory = typeof salary_history.$inferSelect;

// ---------------------- Bot Status ----------------------
export const bot_status = mysqlTable("bot_status", {
  id: int("id").primaryKey().notNull().autoincrement(),
  status: varchar("status", { length: 50 }).notNull().default("offline"),
  server_name: varchar("server_name", { length: 255 }).notNull().default(""),
  uptime: varchar("uptime", { length: 100 }).notNull().default(""),
  commands_per_hour: int("commands_per_hour").notNull().default(0),
  last_updated: timestamp("last_updated").notNull().defaultNow().onUpdateNow(),
});


export type BotStatus = typeof bot_status.$inferSelect;

// ---------------------- Selling Prices ----------------------
export const selling_prices = mysqlTable("selling_prices", {
  id: int("id").primaryKey().autoincrement(),
  item_name: varchar("item_name", { length: 255 }).notNull().unique(),
  selling_price: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertSellingPriceSchema = createInsertSchema(selling_prices).omit({
  id: true,
  created_at: true,
});
export type SellingPrice = typeof selling_prices.$inferSelect;

// ---------------------- Daily Earnings ----------------------
export const daily_earnings = mysqlTable("daily_earnings", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).notNull(),
  date: date("date").notNull(),
  total_earnings: decimal("total_earnings", { precision: 10, scale: 2 }).default("0.00"),
  orders_count: int("orders_count").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  uniqueUserDate: unique("unique_user_date").on(table.username, table.date),
}));

export const insertDailyEarningSchema = createInsertSchema(daily_earnings).omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type DailyEarning = typeof daily_earnings.$inferSelect;

// ---------------------- Activity Log ----------------------
export const activity_log = mysqlTable("activity_log", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 100 }).notNull(),
  activity_type: mysqlEnum("activity_type", ["order", "modification", "restock", "deduction"]).notNull(),
  item_name: varchar("item_name", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).default("0.00"),
  description: varchar("description", { length: 500 }).default(""),
  reference_id: int("reference_id"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activity_log).omit({
  id: true,
  created_at: true,
});
export type ActivityLog = typeof activity_log.$inferSelect;
