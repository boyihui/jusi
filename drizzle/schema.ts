import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here

/**
 * 平台配置表 - 存储监控的平台信息
 */
export const platforms = mysqlTable("platforms", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(), // 平台名称，如"开盘啦"
  code: varchar("code", { length: 50 }).notNull().unique(), // 平台代码，如"kaipanla"
  displayOrder: int("displayOrder").notNull().default(0), // 显示顺序
  isActive: int("isActive").notNull().default(1), // 是否启用（1=启用，0=禁用）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Platform = typeof platforms.$inferSelect;
export type InsertPlatform = typeof platforms.$inferInsert;

/**
 * 股票排名数据表 - 存储每次采集的排名数据
 */
export const stockRankings = mysqlTable("stock_rankings", {
  id: int("id").autoincrement().primaryKey(),
  platformId: int("platformId").notNull(), // 关联平台ID
  stockName: varchar("stockName", { length: 100 }).notNull(), // 股票名称
  ranking: int("ranking").notNull(), // 排名位置
  collectedAt: timestamp("collectedAt").notNull(), // 采集时间
  collectedDate: varchar("collectedDate", { length: 10 }).notNull(), // 采集日期（YYYY-MM-DD）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StockRanking = typeof stockRankings.$inferSelect;
export type InsertStockRanking = typeof stockRankings.$inferInsert;

/**
 * 股票详情表 - 存储股票的基本信息（代码、名称、行业、概念）
 */
export const stockDetails = mysqlTable("stock_details", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(), // 股票代码，如"000001"
  name: varchar("name", { length: 100 }).notNull(), // 股票名称
  industry: text("industry"), // 一级行业
  secondaryIndustry: text("secondaryIndustry"), // 二级行业
  hotConcept: text("hotConcept"), // 最热概念（取第一个概念）
  allConcepts: text("allConcepts"), // 所有概念（逗号分隔）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StockDetail = typeof stockDetails.$inferSelect;
export type InsertStockDetail = typeof stockDetails.$inferInsert;

/**
 * 数据采集日志表 - 记录每次采集的状态
 */
export const collectionLogs = mysqlTable("collection_logs", {
  id: int("id").autoincrement().primaryKey(),
  collectedAt: timestamp("collectedAt").notNull(), // 采集时间
  status: mysqlEnum("status", ["success", "failed", "partial"]).notNull(), // 采集状态
  totalRecords: int("totalRecords").notNull().default(0), // 采集的总记录数
  errorMessage: text("errorMessage"), // 错误信息
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CollectionLog = typeof collectionLogs.$inferSelect;
export type InsertCollectionLog = typeof collectionLogs.$inferInsert;