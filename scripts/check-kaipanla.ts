import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { stockRankings, platforms } from '../drizzle/schema';

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  // 查询开盘啦平台ID
  const platformList = await db.select().from(platforms).where(eq(platforms.name, '开盘啦'));
  console.log('开盘啦平台:', platformList[0]);

  if (!platformList[0]) {
    console.log('未找到开盘啦平台');
    return;
  }

  // 查询该平台的数据
  const rankings = await db.select().from(stockRankings)
    .where(eq(stockRankings.platformId, platformList[0].id))
    .limit(10);
    
  console.log('\n前10条数据:');
  rankings.forEach(r => {
    console.log(`日期: ${r.collectedDate}, 排名: ${r.ranking}, 股票: ${r.stockName}, 采集时间: ${r.collectedAt}`);
  });

  // 统计各日期的数据量
  const dateCount = await db.select().from(stockRankings)
    .where(eq(stockRankings.platformId, platformList[0].id));
  
  const dateCounts: { [date: string]: number } = {};
  dateCount.forEach(r => {
    dateCounts[r.collectedDate] = (dateCounts[r.collectedDate] || 0) + 1;
  });

  console.log('\n各日期数据量:');
  Object.entries(dateCounts).forEach(([date, count]) => {
    console.log(`${date}: ${count}条`);
  });
}

main().catch(console.error);
