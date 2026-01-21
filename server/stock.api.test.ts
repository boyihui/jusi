/**
 * 股票排名API单元测试
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';
import { platforms, stockRankings } from '../drizzle/schema';
import { collectAndStore } from './services/collector';

describe('Stock Ranking API Tests', () => {
  let db: ReturnType<typeof drizzle>;

  beforeAll(() => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    db = drizzle(process.env.DATABASE_URL);
  });

  it('should have platforms configured in database', async () => {
    const platformList = await db.select().from(platforms);
    
    expect(platformList.length).toBeGreaterThan(0);
    expect(platformList.length).toBe(6); // 6个平台（去掉华泰证券）
    
    const platformNames = platformList.map(p => p.name);
    expect(platformNames).toContain('开盘啦');
    expect(platformNames).toContain('同花顺');
    expect(platformNames).toContain('东方财富');
    expect(platformNames).toContain('大智慧');
    expect(platformNames).toContain('通达信');
    expect(platformNames).toContain('财联社');
    expect(platformNames).not.toContain('华泰证券');
  });

  it('should collect and store stock rankings', async () => {
    const result = await collectAndStore();
    
    expect(result.success).toBe(true);
    expect(result.totalRecords).toBeGreaterThan(0);
    expect(result.errorMessage).toBeUndefined();
  }, 60000); // 60秒超时

  it('should have stock rankings in database', async () => {
    const today = new Date().toISOString().split('T')[0];
    const rankings = await db
      .select()
      .from(stockRankings)
      .where(sql`${stockRankings.collectedDate} = ${today}`)
      .limit(10);
    
    expect(rankings.length).toBeGreaterThan(0);
    
    // 验证数据结构
    const firstRanking = rankings[0];
    expect(firstRanking).toHaveProperty('id');
    expect(firstRanking).toHaveProperty('platformId');
    expect(firstRanking).toHaveProperty('stockName');
    expect(firstRanking).toHaveProperty('ranking');
    expect(firstRanking).toHaveProperty('collectedAt');
    expect(firstRanking).toHaveProperty('collectedDate');
    
    // 验证数据类型
    expect(typeof firstRanking.platformId).toBe('number');
    expect(typeof firstRanking.stockName).toBe('string');
    expect(typeof firstRanking.ranking).toBe('number');
    expect(firstRanking.collectedDate).toBe(today);
  });
});
