/**
 * 测试交易日期逻辑
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

console.log('\n=== 交易日期逻辑测试 ===\n');

// 测试用例
const testCases = [
  new Date('2026-01-20T23:30:00'), // 晚上11:30
  new Date('2026-01-21T00:30:00'), // 凌晨0:30
  new Date('2026-01-21T03:00:00'), // 凌晨3:00
  new Date('2026-01-21T05:59:00'), // 早上5:59
  new Date('2026-01-21T06:00:00'), // 早上6:00
  new Date('2026-01-21T09:30:00'), // 早上9:30（开盘）
  new Date('2026-01-21T15:00:00'), // 下午3:00（收盘）
  new Date('2026-01-21T20:00:00'), // 晚上8:00
];

testCases.forEach(testTime => {
  const tradingDate = getTradingDate(testTime);
  const timeStr = testTime.toISOString().replace('T', ' ').substring(0, 19);
  console.log(`${timeStr} → 交易日: ${tradingDate}`);
});

console.log('\n说明：');
console.log('- 凌晨0点到早上6点的数据，归入前一天');
console.log('- 早上6点到晚上12点的数据，归入当天');
console.log('- 这样可以确保一个完整交易日的数据都在同一天\n');
