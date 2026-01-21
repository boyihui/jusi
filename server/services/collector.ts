/**
 * 数据采集和存储服务
 * 负责定期采集数据并存储到数据库
 */

import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { platforms, stockRankings, collectionLogs } from '../../drizzle/schema';
import { scrapeStockRankings, type ScrapedRanking } from './scraper';

/**
 * 获取数据库实例
 */
function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL 环境变量未设置');
  }
  return drizzle(process.env.DATABASE_URL);
}

/**
 * 获取平台ID映射
 */
async function getPlatformIdMap(): Promise<Record<string, number>> {
  const db = getDb();
  const platformList = await db.select().from(platforms).where(eq(platforms.isActive, 1));
  
  const map: Record<string, number> = {};
  platformList.forEach(p => {
    map[p.name] = p.id;
  });
  
  return map;
}

/**
 * 执行数据采集并存储
 */
/**
 * 获取交易日期（凌晨0点前算当天，0点后算前一天）
 * 例如：2026-01-21 00:30 → 2026-01-20
 *       2026-01-20 23:30 → 2026-01-20
 */
function getTradingDate(now: Date = new Date()): string {
  const hour = now.getHours();
  
  // 如果是凌晨0点到早上6点，算作前一天的数据
  if (hour >= 0 && hour < 6) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }
  
  // 其他时间算作当天
  return now.toISOString().split('T')[0];
}

export async function collectAndStore(): Promise<{
  success: boolean;
  totalRecords: number;
  errorMessage?: string;
}> {
  const collectedAt = new Date();
  const collectedDate = getTradingDate(collectedAt); // 使用交易日逻辑
  
  try {
    console.log(`[${collectedAt.toISOString()}] 开始采集数据...`);
    
    // 1. 采集数据
    const rankings = await scrapeStockRankings();
    console.log(`采集到 ${rankings.length} 条数据`);
    
    if (rankings.length === 0) {
      throw new Error('采集到的数据为空');
    }
    
    // 2. 获取平台ID映射
    const platformIdMap = await getPlatformIdMap();
    
    // 3. 准备批量插入数据
    const db = getDb();
    const recordsToInsert = [];
    
    for (const ranking of rankings) {
      const platformId = platformIdMap[ranking.platformName];
      if (!platformId) {
        console.warn(`平台 ${ranking.platformName} 未找到对应ID，跳过`);
        continue;
      }
      
      recordsToInsert.push({
        platformId,
        stockName: ranking.stockName,
        ranking: ranking.ranking,
        collectedAt,
        collectedDate,
      });
    }
    
    // 4. 批量插入数据
    if (recordsToInsert.length > 0) {
      await db.insert(stockRankings).values(recordsToInsert);
      console.log(`成功存储 ${recordsToInsert.length} 条数据`);
    }
    
    const storedCount = recordsToInsert.length;
    
    // 5. 记录采集日志
    await db.insert(collectionLogs).values({
      collectedAt,
      status: 'success',
      totalRecords: storedCount,
    });
    
    return {
      success: true,
      totalRecords: storedCount,
    };
    
  } catch (error) {
    console.error('采集数据失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // 记录失败日志
    try {
      const db = getDb();
      await db.insert(collectionLogs).values({
        collectedAt,
        status: 'failed',
        totalRecords: 0,
        errorMessage,
      });
    } catch (logError) {
      console.error('记录采集日志失败:', logError);
    }
    
    return {
      success: false,
      totalRecords: 0,
      errorMessage,
    };
  }
}

/**
 * 启动定时采集任务
 * @param intervalMinutes 采集间隔（分钟）
 */
export function startScheduledCollection(intervalMinutes: number = 5): NodeJS.Timeout {
  console.log(`启动定时采集任务，间隔 ${intervalMinutes} 分钟`);
  
  // 立即执行一次
  collectAndStore().catch(error => {
    console.error('首次采集失败:', error);
  });
  
  // 设置定时任务
  const interval = setInterval(() => {
    collectAndStore().catch(error => {
      console.error('定时采集失败:', error);
    });
  }, intervalMinutes * 60 * 1000);
  
  return interval;
}

/**
 * 停止定时采集任务
 */
export function stopScheduledCollection(interval: NodeJS.Timeout): void {
  clearInterval(interval);
  console.log('定时采集任务已停止');
}
