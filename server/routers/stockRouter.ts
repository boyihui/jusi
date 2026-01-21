/**
 * 股票排名相关API路由
 */

import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { drizzle } from 'drizzle-orm/mysql2';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { platforms, stockRankings, stockDetails } from '../../drizzle/schema';

/**
 * 获取数据库实例
 */
function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL 环境变量未设置');
  }
  return drizzle(process.env.DATABASE_URL);
}

export const stockRouter = router({
  /**
   * 获取评分排名数据（按平均得分排序）
   * 评分规则：第1名100分，第2名99分，依次递减
   * 平均得分 = (所有平台得分之和) / 6
   */
  getScoreRankings: publicProcedure
    .input(z.object({
      date: z.string().optional(), // 日期，格式 YYYY-MM-DD，不传则使用当天
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const { date } = input;
      
      // 如果没有传日期，使用当天日期（北京时间）
      const targetDate = date || new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      console.log('[getScoreRankings] 查询日期:', targetDate);
      
      // 获取所有平台
      const allPlatforms = await db.select().from(platforms);
      const platformCount = allPlatforms.length; // 6个平台
      
      console.log('[getScoreRankings] 平台数量:', platformCount);
      
      // 获取该日期最新的排名数据（所有平台）
      const rankings = await db
        .select({
          stockName: stockRankings.stockName,
          platformId: stockRankings.platformId,
          ranking: stockRankings.ranking,
          collectedAt: stockRankings.collectedAt,
        })
        .from(stockRankings)
        .where(
          eq(stockRankings.collectedDate, targetDate)
        )
        .orderBy(desc(stockRankings.collectedAt));
      
      console.log('[getScoreRankings] 查询到排名数据数量:', rankings.length);
      
      // 按股票名称分组，计算每个股票的得分
      const stockScores = new Map<string, {
        totalScore: number;
        platformCount: number;
        platforms: { name: string; rank: number; score: number }[];
      }>();
      
      // 记录每个平台的最新采集时间
      const latestCollectedAt = new Map<number, Date>();
      for (const r of rankings) {
        const current = latestCollectedAt.get(r.platformId);
        if (!current || new Date(r.collectedAt) > current) {
          latestCollectedAt.set(r.platformId, new Date(r.collectedAt));
        }
      }
      
      // 只处理每个平台最新的数据
      for (const r of rankings) {
        const latest = latestCollectedAt.get(r.platformId);
        if (!latest || new Date(r.collectedAt).getTime() !== latest.getTime()) {
          continue; // 跳过非最新数据
        }
        
        const score = Math.max(101 - r.ranking, 1); // 第1名100分，第2名99分，最低1分
        const platform = allPlatforms.find(p => p.id === r.platformId);
        
        if (!stockScores.has(r.stockName)) {
          stockScores.set(r.stockName, {
            totalScore: 0,
            platformCount: 0,
            platforms: [],
          });
        }
        
        const stockData = stockScores.get(r.stockName)!;
        stockData.totalScore += score;
        stockData.platformCount += 1;
        stockData.platforms.push({
          name: platform?.name || '未知',
          rank: r.ranking,
          score: score,
        });
      }
      
      console.log('[getScoreRankings] 股票数量:', stockScores.size);
      
      // 获取股票详情（行业、概念）
      const stockNames = Array.from(stockScores.keys());
      const stockDetailsData = await db
        .select()
        .from(stockDetails)
        .where(inArray(stockDetails.name, stockNames));
      
      const stockDetailsMap = new Map(
        stockDetailsData.map(d => [d.name, d])
      );
      
      // 计算平均得分并排序
      const result = Array.from(stockScores.entries())
        .map(([stockName, data]) => {
          const avgScore = data.totalScore / platformCount; // 总分除以6
          const details = stockDetailsMap.get(stockName);
          
          return {
            stockName,
            avgScore: Math.round(avgScore * 100) / 100, // 保留2位小数
            platformCount: data.platformCount,
            platforms: data.platforms,
            industry: details?.industry || '',
            concept: details?.hotConcept || '',
          };
        })
        .sort((a, b) => {
          // 按平均得分降序
          if (b.avgScore !== a.avgScore) {
            return b.avgScore - a.avgScore;
          }
          // 得分相同时，按平台数量降序
          if (b.platformCount !== a.platformCount) {
            return b.platformCount - a.platformCount;
          }
          // 平台数量也相同时，按股票名称排序
          return a.stockName.localeCompare(b.stockName, 'zh-CN');
        });
      
      console.log('[getScoreRankings] 排序后股票数量:', result.length);
      console.log('[getScoreRankings] TOP 10:', result.slice(0, 10).map(r => `${r.stockName}(${r.avgScore}分)`));
      
      return result;
    }),
  /**
   * 获取多个日期的排名数据（用于新布局）
   * 返回格式：{ dates: string[], rankings: { rank: number, stocks: { [date]: stockName } }[] }
   */
  getMultiDateRankings: publicProcedure
    .input(z.object({
      dates: z.array(z.string()), // 日期数组，格式 YYYY-MM-DD
      platformId: z.number(), // 平台ID
      limit: z.number().default(100), // 每个日期显示的排名数量
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const { dates, platformId, limit } = input;
      
      // 对每个日期获取最新的排名数据
      const results: { [date: string]: { [rank: number]: string } } = {};
      
      for (const date of dates) {
        // 直接获取该日期最新的排名数据（按采集时间降序）
        const rankings = await db
          .select()
          .from(stockRankings)
          .where(
            and(
              eq(stockRankings.collectedDate, date),
              eq(stockRankings.platformId, platformId)
            )
          )
          .orderBy(sql`${stockRankings.collectedAt} DESC, ${stockRankings.ranking} ASC`)
          .limit(limit);
        
        if (rankings.length === 0) {
          results[date] = {};
          continue;
        }
        
        // 构建 rank -> stockName 的映射
        const rankMap: { [rank: number]: string } = {};
        rankings.forEach(r => {
          rankMap[r.ranking] = r.stockName;
        });
        
        results[date] = rankMap;
      }
      
      // 转换为前端需要的格式
      const rankingsArray = [];
      for (let rank = 1; rank <= limit; rank++) {
        const stocks: { [date: string]: string } = {};
        dates.forEach(date => {
          stocks[date] = results[date][rank] || '';
        });
        rankingsArray.push({ rank, stocks });
      }
      
      return {
        dates,
        rankings: rankingsArray,
      };
    }),
  /**
   * 获取所有平台列表
   */
  getPlatforms: publicProcedure.query(async () => {
    const db = getDb();
    const platformList = await db
      .select()
      .from(platforms)
      .where(eq(platforms.isActive, 1))
      .orderBy(platforms.displayOrder);
    
    return platformList;
  }),

  /**
   * 获取当日实时数据
   */
  getTodayRankings: publicProcedure.query(async () => {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // 使用子查询直接获取最新采集时间的数据，并关联股票详情
    const rankings = await db
      .select({
        id: stockRankings.id,
        platformId: stockRankings.platformId,
        platformName: platforms.name,
        stockName: stockRankings.stockName,
        ranking: stockRankings.ranking,
        collectedAt: stockRankings.collectedAt,
        industry: stockDetails.industry,
        secondaryIndustry: stockDetails.secondaryIndustry,
        hotConcept: stockDetails.hotConcept,
      })
      .from(stockRankings)
      .innerJoin(platforms, eq(stockRankings.platformId, platforms.id))
      .leftJoin(stockDetails, eq(stockRankings.stockName, stockDetails.name))
      .where(
        and(
          eq(stockRankings.collectedDate, today),
          sql`${stockRankings.collectedAt} = (
            SELECT MAX(collectedAt) 
            FROM stock_rankings 
            WHERE collectedDate = ${today}
          )`
        )
      )
      .orderBy(stockRankings.ranking, platforms.displayOrder);
    
    const latestCollectionTime = rankings[0]?.collectedAt || null;
    
    return {
      date: today,
      collectedAt: latestCollectionTime,
      rankings,
    };
  }),

  /**
   * 获取指定日期的排名数据
   */
  getRankingsByDate: publicProcedure
    .input(z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    }))
    .query(async ({ input }) => {
      const db = getDb();
      
      // 使用子查询直接获取最新采集时间的数据，并关联股票详情
      const rankings = await db
        .select({
          id: stockRankings.id,
          platformId: stockRankings.platformId,
          platformName: platforms.name,
          stockName: stockRankings.stockName,
          ranking: stockRankings.ranking,
          collectedAt: stockRankings.collectedAt,
          industry: stockDetails.industry,
          secondaryIndustry: stockDetails.secondaryIndustry,
          hotConcept: stockDetails.hotConcept,
        })
        .from(stockRankings)
        .innerJoin(platforms, eq(stockRankings.platformId, platforms.id))
        .leftJoin(stockDetails, eq(stockRankings.stockName, stockDetails.name))
        .where(
          and(
            eq(stockRankings.collectedDate, input.date),
            sql`${stockRankings.collectedAt} = (
              SELECT MAX(collectedAt) 
              FROM stock_rankings 
              WHERE collectedDate = ${input.date}
            )`
          )
        )
        .orderBy(stockRankings.ranking, platforms.displayOrder);
      
      const latestCollectionTime = rankings[0]?.collectedAt || null;
      
      return {
        date: input.date,
        collectedAt: latestCollectionTime,
        rankings,
      };
    }),

  /**
   * 获取热门板块（行业或概念）
   */
  getHotSectors: publicProcedure
    .input(
      z.object({
        date: z.string(),
        type: z.enum(['industry', 'concept']),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const { date, type } = input;

      console.log('[getHotSectors] 输入参数:', { date, type });

      // 直接使用子查询获取最新采集时间的数据
      const rankings = await db
        .select({
          stockName: stockRankings.stockName,
        })
        .from(stockRankings)
        .where(
          and(
            eq(stockRankings.collectedDate, date),
            sql`${stockRankings.collectedAt} = (
              SELECT MAX(collectedAt) 
              FROM stock_rankings 
              WHERE collectedDate = ${date}
            )`
          )
        );

      console.log('[getHotSectors] 排名数据数量:', rankings.length);

      // 获取所有上榜股票的详情
      const stockNames = Array.from(new Set(rankings.map(r => r.stockName)));
      console.log('[getHotSectors] 去重后股票数量:', stockNames.length);
      
      if (stockNames.length === 0) {
        console.log('[getHotSectors] 没有股票数据');
        return [];
      }

      const stockDetailsList = await db
        .select()
        .from(stockDetails)
        .where(inArray(stockDetails.name, stockNames))
        .execute();

      console.log('[getHotSectors] 股票详情数量:', stockDetailsList.length);

      // 统计行业或概念出现次数
      const countMap = new Map<string, number>();
      stockDetailsList.forEach(stock => {
        const key = type === 'industry' ? stock.industry : stock.hotConcept;
        if (key) {
          countMap.set(key, (countMap.get(key) || 0) + 1);
        }
      });

      console.log('[getHotSectors] 统计结果数量:', countMap.size);

      // 转换为数组并排序，取前10
      const result = Array.from(countMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      console.log('[getHotSectors] 最终结果:', result);

      return result;
    }),

  /**
   * 获取指定行业/概念的股票列表（去重并按评分排序）
   */
  getSectorStocks: publicProcedure
    .input(
      z.object({
        date: z.string(),
        type: z.enum(['industry', 'concept']),
        sectorName: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const { date, type, sectorName } = input;

      console.log('[getSectorStocks] 输入参数:', { date, type, sectorName });

      // 获取所有平台
      const allPlatforms = await db.select().from(platforms);
      const platformCount = allPlatforms.length; // 6个平台

      // 直接使用子查询获取最新采集时间的数据
      const rankings = await db
        .select({
          stockName: stockRankings.stockName,
          platformId: stockRankings.platformId,
          ranking: stockRankings.ranking,
        })
        .from(stockRankings)
        .where(
          and(
            eq(stockRankings.collectedDate, date),
            sql`${stockRankings.collectedAt} = (
              SELECT MAX(collectedAt) 
              FROM stock_rankings 
              WHERE collectedDate = ${date}
            )`
          )
        );

      console.log('[getSectorStocks] 排名数据数量:', rankings.length);

      // 获取所有上榜股票的详情
      const stockNames = Array.from(new Set(rankings.map(r => r.stockName)));
      
      if (stockNames.length === 0) {
        console.log('[getSectorStocks] 没有股票数据');
        return [];
      }

      // 根据行业或概念筛选股票
      const stockDetailsList = await db
        .select()
        .from(stockDetails)
        .where(
          and(
            inArray(stockDetails.name, stockNames),
            type === 'industry' 
              ? eq(stockDetails.industry, sectorName)
              : eq(stockDetails.hotConcept, sectorName)
          )
        )
        .execute();

      console.log('[getSectorStocks] 符合条件的股票数量:', stockDetailsList.length);

      // 按股票名称分组，计算每个股票的得分
      const stockMap = new Map(stockDetailsList.map(s => [s.name, s]));
      const stockScores = new Map<string, number>();

      for (const r of rankings) {
        if (!stockMap.has(r.stockName)) continue;
        
        const score = Math.max(101 - r.ranking, 1); // 第1名100分，第2名99分，最低1分
        const currentScore = stockScores.get(r.stockName) || 0;
        stockScores.set(r.stockName, currentScore + score);
      }

      // 计算平均得分并排序
      const result = Array.from(stockScores.entries())
        .map(([stockName, totalScore]) => {
          const avgScore = totalScore / platformCount; // 总分除以6
          const details = stockMap.get(stockName)!;
          
          return {
            stockName,
            avgScore: Math.round(avgScore * 100) / 100, // 保留2位小数
            industry: details.industry || '',
            hotConcept: details.hotConcept || '',
          };
        })
        .sort((a, b) => b.avgScore - a.avgScore); // 按平均得分降序

      console.log('[getSectorStocks] 去重后股票数量:', result.length);
      console.log('[getSectorStocks] TOP 5:', result.slice(0, 5).map(r => `${r.stockName}(${r.avgScore}分)`));

      return result;
    }),

  /**
   * 获取可用的日期列表
   */
  getAvailableDates: publicProcedure.query(async () => {
    const db = getDb();
    
    const dates = await db
      .selectDistinct({ date: stockRankings.collectedDate })
      .from(stockRankings)
      .orderBy(desc(stockRankings.collectedDate))
      .limit(30); // 最近30天
    
    return dates.map(d => d.date);
  }),
});
