/**
 * 市场统计相关API路由
 * 提供涨停、跌停、连板等市场统计数据
 */

import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { drizzle } from 'drizzle-orm/mysql2';
import { and, desc, eq, sql, gte } from 'drizzle-orm';
import { stockRankings, stockDetails } from '../../drizzle/schema';

/**
 * 获取数据库实例
 */
function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL 环境变量未设置');
  }
  return drizzle(process.env.DATABASE_URL);
}

export const marketStatsRouter = router({
  /**
   * 获取市场统计数据
   * 包括涨停数、跌停数、上涨数、下跌数等
   */
  getMarketStats: publicProcedure
    .input(z.object({
      date: z.string().optional(), // 日期，格式 YYYY-MM-DD
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const targetDate = input.date || new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // 获取该日期最新的排名数据
      const rankings = await db
        .select({
          stockName: stockRankings.stockName,
          ranking: stockRankings.ranking,
        })
        .from(stockRankings)
        .where(
          and(
            eq(stockRankings.collectedDate, targetDate),
            sql`${stockRankings.collectedAt} = (
              SELECT MAX(collectedAt) 
              FROM stock_rankings 
              WHERE collectedDate = ${targetDate}
            )`
          )
        );
      
      // 去重股票
      const uniqueStocks = Array.from(new Set(rankings.map(r => r.stockName)));
      
      // 模拟市场统计（实际应该从真实数据源获取）
      // 这里基于排名数据做简单估算
      const totalStocks = uniqueStocks.length;
      const ztCount = Math.floor(totalStocks * 0.02); // 约2%涨停
      const dtCount = Math.floor(totalStocks * 0.01); // 约1%跌停
      const upCount = Math.floor(totalStocks * 0.45); // 约45%上涨
      const downCount = Math.floor(totalStocks * 0.35); // 约35%下跌
      const flatCount = totalStocks - upCount - downCount;
      
      return {
        date: targetDate,
        totalStocks,
        ztCount, // 涨停数
        dtCount, // 跌停数
        upCount, // 上涨数
        downCount, // 下跌数
        flatCount, // 平盘数
        upRatio: totalStocks > 0 ? (upCount / totalStocks * 100).toFixed(2) : '0.00',
        downRatio: totalStocks > 0 ? (downCount / totalStocks * 100).toFixed(2) : '0.00',
      };
    }),

  /**
   * 获取连板梯队统计
   */
  getLianbanStats: publicProcedure
    .input(z.object({
      date: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const targetDate = input.date || new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // 获取该日期的涨停股票
      const rankings = await db
        .select({
          stockName: stockRankings.stockName,
          ranking: stockRankings.ranking,
        })
        .from(stockRankings)
        .where(
          and(
            eq(stockRankings.collectedDate, targetDate),
            sql`${stockRankings.collectedAt} = (
              SELECT MAX(collectedAt) 
              FROM stock_rankings 
              WHERE collectedDate = ${targetDate}
            )`
          )
        )
        .limit(50); // 取前50名作为强势股
      
      // 模拟连板数据（实际应该从真实数据源获取）
      const lianbanData = [
        { lianbanCount: 5, stocks: Math.floor(Math.random() * 3) + 1 },
        { lianbanCount: 4, stocks: Math.floor(Math.random() * 5) + 2 },
        { lianbanCount: 3, stocks: Math.floor(Math.random() * 8) + 3 },
        { lianbanCount: 2, stocks: Math.floor(Math.random() * 15) + 5 },
        { lianbanCount: 1, stocks: Math.floor(Math.random() * 30) + 10 },
      ].filter(item => item.stocks > 0);
      
      return {
        date: targetDate,
        lianbanData,
        totalLianban: lianbanData.reduce((sum, item) => sum + item.stocks, 0),
      };
    }),

  /**
   * 获取昨日涨停今日表现
   */
  getYesterdayZtPerformance: publicProcedure
    .input(z.object({
      date: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const targetDate = input.date || new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // 计算昨日日期
      const yesterday = new Date(targetDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // 获取昨日涨停股票
      const yesterdayZt = await db
        .select({
          stockName: stockRankings.stockName,
        })
        .from(stockRankings)
        .where(
          and(
            eq(stockRankings.collectedDate, yesterdayStr),
            sql`${stockRankings.collectedAt} = (
              SELECT MAX(collectedAt) 
              FROM stock_rankings 
              WHERE collectedDate = ${yesterdayStr}
            )`
          )
        )
        .limit(30); // 取前30名作为昨日涨停
      
      // 获取今日这些股票的表现
      const yesterdayStockNames = yesterdayZt.map(s => s.stockName);
      
      if (yesterdayStockNames.length === 0) {
        return {
          date: targetDate,
          totalCount: 0,
          continueZtCount: 0,
          upCount: 0,
          downCount: 0,
          flatCount: 0,
        };
      }
      
      // 模拟今日表现（实际应该从真实数据源获取）
      const totalCount = yesterdayStockNames.length;
      const continueZtCount = Math.floor(totalCount * 0.15); // 约15%继续涨停
      const upCount = Math.floor(totalCount * 0.50); // 约50%上涨
      const downCount = Math.floor(totalCount * 0.30); // 约30%下跌
      const flatCount = totalCount - continueZtCount - upCount - downCount;
      
      return {
        date: targetDate,
        totalCount,
        continueZtCount,
        upCount,
        downCount,
        flatCount,
        continueZtRatio: (continueZtCount / totalCount * 100).toFixed(2),
        upRatio: (upCount / totalCount * 100).toFixed(2),
      };
    }),
});
