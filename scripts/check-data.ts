import { getDb } from '../server/db';
import { platforms, stockRankings } from '../drizzle/schema';
import { sql, eq } from 'drizzle-orm';

async function checkData() {
  const db = await getDb();
  if (!db) {
    console.log('数据库连接失败');
    process.exit(1);
  }

  // 获取所有平台
  const allPlatforms = await db.select().from(platforms);
  console.log('\n=== 平台列表 ===');
  allPlatforms.forEach(p => {
    console.log(`ID: ${p.id}, 名称: ${p.name}, 代码: ${p.code}`);
  });

  // 检查每个平台的总数据量
  console.log('\n=== 各平台总数据量 ===');
  for (const platform of allPlatforms) {
    const count = await db.select({ count: sql<number>`count(*)` })
      .from(stockRankings)
      .where(eq(stockRankings.platformId, platform.id));
    
    console.log(`${platform.name}: ${count[0].count} 条记录`);
  }

  // 检查最新的数据时间
  console.log('\n=== 最新数据时间 ===');
  for (const platform of allPlatforms) {
    const latest = await db.select()
      .from(stockRankings)
      .where(eq(stockRankings.platformId, platform.id))
      .orderBy(sql`${stockRankings.collectedAt} DESC`)
      .limit(1);
    
    if (latest.length > 0) {
      console.log(`${platform.name}: ${latest[0].collectedAt}`);
    } else {
      console.log(`${platform.name}: 无数据`);
    }
  }

  process.exit(0);
}

checkData();
