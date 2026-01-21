/**
 * 诊断平台数据脚本
 */

import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { platforms, stockRankings } from '../drizzle/schema';

async function diagnose() {
  const db = drizzle(process.env.DATABASE_URL!);

  // 查看所有平台
  const allPlatforms = await db.select().from(platforms);
  console.log('所有平台：');
  allPlatforms.forEach(p => console.log(`  ID: ${p.id}, 名称: ${p.name}, Code: ${p.code}`));

  // 查看今天的数据统计
  const today = new Date().toISOString().split('T')[0];
  console.log(`\n今天(${today})各平台数据量：`);
  for (const platform of allPlatforms) {
    const rows = await db.select().from(stockRankings)
      .where(eq(stockRankings.platformId, platform.id));
    const todayRows = rows.filter(r => r.collectedDate === today);
    console.log(`  ${platform.name}: ${todayRows.length} 条`);
  }
  
  // 查看最近一次采集的原始数据中的平台名称
  console.log('\n检查数据采集中的平台名称映射...');
  const { scrapeStockRankings } = await import('../server/services/scraper');
  const scrapedData = await scrapeStockRankings();
  
  const platformCounts: Record<string, number> = {};
  scrapedData.forEach(item => {
    platformCounts[item.platformName] = (platformCounts[item.platformName] || 0) + 1;
  });
  
  console.log('\nAPI返回的平台名称及数据量：');
  Object.entries(platformCounts).forEach(([name, count]) => {
    console.log(`  ${name}: ${count} 条`);
  });
}

diagnose().catch(console.error);
