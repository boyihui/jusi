/**
 * 数据采集服务
 * 通过API从目标网站采集股票排名数据
 */

export interface ScrapedRanking {
  platformName: string;
  stockName: string;
  ranking: number;
}

interface ApiDataItem {
  排名: number;
  开盘啦?: string;
  同花顺?: string;
  东财?: string;
  大智慧?: string;
  通达信?: string;
  华泰证券?: string;
  财联社?: string;
  [key: string]: any;
}

/**
 * 生成签名请求参数
 */
function generateSignParams(apiFlag: string, filename?: string) {
  const uuidShort = 'xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
  
  const ts = Date.now().toString();
  const tsShort = ts.substring(ts.length - 4);
  const uniqueNonce = apiFlag + uuidShort + tsShort;
  const timestamp = Date.now();
  
  const params: any = {
    timestamp,
    nonce: uniqueNonce,
    apiFlag,
  };
  
  if (filename) {
    params.filename = filename;
  }
  
  return params;
}

/**
 * 获取签名
 */
async function getSign(params: any): Promise<string> {
  const signUrl = 'https://www.59155188.xyz/api/get_sign';
  
  const response = await fetch(signUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    throw new Error(`获取签名失败: ${response.status}`);
  }
  
  const result = await response.json();
  
  if (result.status !== 'success' || !result.sign) {
    throw new Error(`签名响应错误: ${result.message || '未知错误'}`);
  }
  
  return result.sign;
}

/**
 * 构建查询字符串
 */
function buildQueryString(params: Record<string, any>): string {
  return Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}

/**
 * 采集目标网站的股票排名数据
 */
export async function scrapeStockRankings(): Promise<ScrapedRanking[]> {
  try {
    // 1. 生成签名参数
    const signParams = generateSignParams('csv', 'S88.csv');
    
    // 2. 获取签名
    const sign = await getSign(signParams);
    
    // 3. 构建完整参数
    const fullParams = {
      ...signParams,
      sign,
    };
    
    // 4. 请求数据
    const queryString = buildQueryString(fullParams);
    const dataUrl = `https://www.59155188.xyz/api/get_csv?${queryString}`;
    
    const response = await fetch(dataUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      throw new Error(`获取数据失败: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.status !== 'success' || !result.data) {
      throw new Error(`数据响应错误: ${result.message || '未知错误'}`);
    }
    
    // 5. 解析数据
    const rankings = parseApiData(result.data);
    
    return rankings;
    
  } catch (error) {
    console.error('采集数据失败:', error);
    throw error;
  }
}

/**
 * 解析API返回的数据
 */
function parseApiData(data: ApiDataItem[]): ScrapedRanking[] {
  const rankings: ScrapedRanking[] = [];
  
  // 平台映射：API返回的名称 -> 数据库中的名称
  // 注意：API返回的是"东财"，但数据库中存储的是"东方财富"
  const apiToDatabaseNameMap: Record<string, string> = {
    '开盘啦': '开盘啦',
    '同花顺': '同花顺',
    '东财': '东方财富',  // API返回"东财"，映射为数据库中的"东方财富"
    '大智慧': '大智慧',
    '通达信': '通达信',
    '财联社': '财联社',
  };
  
  data.forEach((item) => {
    const ranking = item['排名'];
    if (!ranking || typeof ranking !== 'number') return;
    
    // 遍历各平台
    Object.entries(apiToDatabaseNameMap).forEach(([apiName, dbName]) => {
      const stockName = item[apiName];
      if (stockName && typeof stockName === 'string' && stockName.trim().length > 0) {
        rankings.push({
          platformName: dbName,  // 使用数据库中的名称
          stockName: stockName.trim(),
          ranking,
        });
      }
    });
  });
  
  return rankings;
}

/**
 * 测试数据采集功能
 */
export async function testScraper() {
  console.log('开始测试数据采集...');
  const rankings = await scrapeStockRankings();
  console.log(`采集到 ${rankings.length} 条数据`);
  
  // 按平台统计
  const platformStats: Record<string, number> = {};
  rankings.forEach(r => {
    platformStats[r.platformName] = (platformStats[r.platformName] || 0) + 1;
  });
  
  console.log('\n各平台数据统计:');
  Object.entries(platformStats).forEach(([platform, count]) => {
    console.log(`  ${platform}: ${count} 条`);
  });
  
  console.log('\n前10条数据示例:');
  rankings.slice(0, 10).forEach(r => {
    console.log(`  排名${r.ranking} - ${r.platformName}: ${r.stockName}`);
  });
  
  return rankings;
}
