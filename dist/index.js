var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";
import cors from "cors";
import { drizzle as drizzle2 } from "drizzle-orm/mysql2";
import mysql2 from "mysql2/promise";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  bot_status: () => bot_status,
  employee_deductions: () => employee_deductions,
  employees: () => employees,
  insertEmployeeDeductionSchema: () => insertEmployeeDeductionSchema,
  insertEmployeeSchema: () => insertEmployeeSchema,
  insertInventorySchema: () => insertInventorySchema,
  insertModificationSchema: () => insertModificationSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertSalaryHistorySchema: () => insertSalaryHistorySchema,
  inventory: () => inventory,
  modifications: () => modifications,
  orders: () => orders,
  salary_history: () => salary_history,
  updateEmployeeSchema: () => updateEmployeeSchema,
  updateInventorySchema: () => updateInventorySchema
});
import {
  mysqlTable,
  int,
  varchar,
  boolean,
  decimal,
  timestamp
} from "drizzle-orm/mysql-core";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
var employees = mysqlTable("employees", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  full_name: varchar("full_name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("employee"),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").defaultNow()
});
var insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  created_at: true
});
var updateEmployeeSchema = z.object({
  full_name: z.string().optional(),
  role: z.string().optional(),
  is_active: z.boolean().optional()
});
var inventory = mysqlTable("inventory", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(),
  quantity: int("quantity").notNull().default(0),
  min_stock: int("min_stock").notNull().default(0),
  purchase_price: decimal("purchase_price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  created_at: timestamp("created_at").defaultNow()
});
var insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  created_at: true
});
var updateInventorySchema = z.object({
  quantity: z.number().min(0).optional()
});
var modifications = mysqlTable("modifications", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 100 }).notNull(),
  item_id: int("item_id").notNull(),
  item_name: varchar("item_name", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  total_cost: decimal("total_cost", { precision: 10, scale: 2 }).notNull().default("0.00"),
  description: varchar("description", { length: 500 }).default(""),
  discord_channel_id: varchar("discord_channel_id", { length: 100 }).default(""),
  created_at: timestamp("created_at").defaultNow()
});
var insertModificationSchema = createInsertSchema(modifications).omit({
  id: true,
  created_at: true
});
var employee_deductions = mysqlTable("employee_deductions", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 100 }).notNull(),
  modification_id: int("modification_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  is_paid: boolean("is_paid").notNull().default(false),
  created_at: timestamp("created_at").defaultNow()
});
var insertEmployeeDeductionSchema = createInsertSchema(employee_deductions).omit({
  id: true,
  created_at: true
});
var orders = mysqlTable("orders", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 100 }).notNull(),
  item_name: varchar("item_name", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  total_cost: decimal("total_cost", { precision: 10, scale: 2 }).notNull().default("0.00"),
  description: varchar("description", { length: 500 }).default(""),
  created_at: timestamp("created_at").defaultNow()
});
var insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  created_at: true
});
var salary_history = mysqlTable("salary_history", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  // YYYY-MM-DD
  description: varchar("description", { length: 500 }).default(""),
  created_at: timestamp("created_at").defaultNow()
});
var insertSalaryHistorySchema = createInsertSchema(salary_history).omit({
  id: true,
  created_at: true
});
var bot_status = mysqlTable("bot_status", {
  id: int("id").primaryKey().notNull().autoincrement(),
  status: varchar("status", { length: 50 }).notNull().default("offline"),
  server_name: varchar("server_name", { length: 255 }).notNull().default(""),
  uptime: varchar("uptime", { length: 100 }).notNull().default(""),
  commands_per_hour: int("commands_per_hour").notNull().default(0),
  last_updated: timestamp("last_updated").notNull().defaultNow().onUpdateNow()
});

// server/routes.ts
import express from "express";

// server/mysql-storage.ts
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
var pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: parseInt(process.env.MYSQL_PORT || "3306"),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "officina_db"
});
var db = drizzle(pool, {
  schema: schema_exports,
  mode: "default"
  // 🔑 necessario
});

// server/routes.ts
import { eq } from "drizzle-orm";
var router = express.Router();
router.get("/employees", async (_req, res) => {
  const result = await db.query.employees.findMany();
  res.json(result);
});
router.post("/employees", async (req, res) => {
  const parsed = insertEmployeeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const inserted = await db.insert(employees).values(parsed.data).$returningId();
  const employee = await db.query.employees.findFirst({ where: eq(employees.id, inserted[0].id) });
  res.json(employee);
});
router.put("/employees/:username", async (req, res) => {
  const { username } = req.params;
  const parsed = updateEmployeeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  await db.update(employees).set(parsed.data).where(eq(employees.username, username));
  const employee = await db.query.employees.findFirst({ where: eq(employees.username, username) });
  res.json(employee);
});
router.get("/inventory", async (_req, res) => {
  const result = await db.query.inventory.findMany();
  res.json(result);
});
router.put("/inventory/:id", async (req, res) => {
  const { id } = req.params;
  const parsed = updateInventorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  await db.update(inventory).set(parsed.data).where(eq(inventory.id, Number(id)));
  const item = await db.query.inventory.findFirst({ where: eq(inventory.id, Number(id)) });
  res.json(item);
});
router.post("/modifications", async (req, res) => {
  const { username, item_id, item_name, quantity, total_cost, description, discord_channel_id } = req.body;
  const inserted = await db.insert(modifications).values({
    username,
    item_id: Number(item_id),
    item_name,
    quantity: Number(quantity),
    total_cost: String(total_cost),
    description: description || "",
    discord_channel_id: discord_channel_id || ""
  }).$returningId();
  const modification = await db.query.modifications.findFirst({ where: eq(modifications.id, inserted[0].id) });
  if (!modification) return res.status(500).json({ error: "Failed to insert modification" });
  const item = await db.query.inventory.findFirst({ where: eq(inventory.id, Number(item_id)) });
  if (item) {
    const newQuantity = Number(item.quantity) + Number(quantity);
    await db.update(inventory).set({ quantity: newQuantity }).where(eq(inventory.id, Number(item_id)));
  }
  await db.insert(employee_deductions).values({
    username,
    modification_id: modification.id,
    amount: String(total_cost),
    is_paid: false
  });
  res.json(modification);
});
router.post("/orders", async (req, res) => {
  const { username, item_name, quantity, total_cost, description } = req.body;
  const inserted = await db.insert(orders).values({
    username,
    item_name,
    quantity: Number(quantity),
    total_cost: String(total_cost),
    description: description || ""
  }).$returningId();
  const order = await db.query.orders.findFirst({ where: eq(orders.id, inserted[0].id) });
  res.json(order);
});
router.post("/salary-history", async (req, res) => {
  const { username, amount, date, description } = req.body;
  const inserted = await db.insert(salary_history).values({
    username,
    amount: String(amount),
    date,
    description: description || ""
  }).$returningId();
  const record = await db.query.salary_history.findFirst({ where: eq(salary_history.id, inserted[0].id) });
  res.json(record);
});
var routes_default = router;

// server/index.ts
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express2();
app.use(cors());
app.use(express2.json());
var connection = await mysql2.createConnection({
  host: "127.0.0.1",
  user: "workshop_user",
  password: "workshop_password123",
  database: "sito_larrys",
  port: 3306
});
var db2 = drizzle2(connection, { schema: schema_exports, mode: "default" });
app.use("/api", routes_default);
var clientPath = path.join(__dirname, "../dist/public");
app.use(express2.static(clientPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});
var port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
export {
  db2 as db
};
