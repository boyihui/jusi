import { getDb } from '../server/db';
import { stockRankings } from '../drizzle/schema';
import { sql } from 'drizzle-orm';

async function checkHistory() {
  const db = await getDb();
  if (!db) {
    console.log('数据库连接失败');
    process.exit(1);
  }

  // 查询按日期分组的数据量
  const result = await db.execute(sql`
    SELECT DATE(collectedAt) as date, COUNT(*) as count 
    FROM stock_rankings 
    GROUP BY DATE(collectedAt) 
    ORDER BY DATE(collectedAt) DESC
  `);

  console.log('\n=== 各日期数据量 ===');
  const rows = result[0] as any[];
  rows.forEach((row: any) => {
    console.log(`${row.date}: ${row.count} 条记录`);
  });

  // 查看最早和最晚的数据时间
  const timeRange = await db.execute(sql`
    SELECT MIN(collectedAt) as earliest, MAX(collectedAt) as latest 
    FROM stock_rankings
  `);

  console.log('\n=== 数据时间范围 ===');
  const timeData = timeRange[0] as any[];
  console.log(`最早: ${timeData[0]?.earliest}`);
  console.log(`最晚: ${timeData[0]?.latest}`);

  process.exit(0);
}

checkHistory();
