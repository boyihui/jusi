import { drizzle } from 'drizzle-orm/mysql2';
import { platforms } from '../drizzle/schema';

// 平台配置数据（去掉华泰证券）
const platformsData = [
  { name: '开盘啦', code: 'kaipanla', displayOrder: 1, isActive: 1 },
  { name: '同花顺', code: 'tonghuashun', displayOrder: 2, isActive: 1 },
  { name: '东方财富', code: 'dongfangcaifu', displayOrder: 3, isActive: 1 },
  { name: '大智慧', code: 'dazhihui', displayOrder: 4, isActive: 1 },
  { name: '通达信', code: 'tongdaxin', displayOrder: 5, isActive: 1 },
  { name: '财联社', code: 'cailianshe', displayOrder: 6, isActive: 1 },
];

async function seedPlatforms() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL 环境变量未设置');
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  try {
    console.log('开始插入平台配置数据...');
    
    // 检查是否已有数据
    const existingPlatforms = await db.select().from(platforms);
    
    if (existingPlatforms.length > 0) {
      console.log('平台配置数据已存在，跳过插入。');
      return;
    }
    
    // 插入平台数据
    for (const platform of platformsData) {
      await db.insert(platforms).values(platform);
      console.log(`已插入平台: ${platform.name}`);
    }
    
    console.log('平台配置数据插入完成！');
  } catch (error) {
    console.error('插入平台数据失败:', error);
    process.exit(1);
  }
}

seedPlatforms();
