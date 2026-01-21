/**
 * 将UTC时间戳转换为北京时间（CST, UTC+8）并格式化
 * 数据库存储的是UTC时间，需要手动转换为北京时间
 * @param timestamp UTC时间戳（Date对象或字符串）
 * @returns 格式化后的北京时间字符串，如 "01月21日 13:25:30"
 */
export function formatLocalTime(timestamp: Date | string): string {
  // 将字符串转换为Date对象
  // 数据库返回的是UTC时间（如 2026-01-21T05:31:42.000Z）
  const utcDate = new Date(timestamp);
  
  // 北京时间是UTC+8，需要添加8小时的偏移量
  const BEIJING_OFFSET_HOURS = 8;
  const beijingDate = new Date(utcDate.getTime() + BEIJING_OFFSET_HOURS * 60 * 60 * 1000);
  
  const month = String(beijingDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(beijingDate.getUTCDate()).padStart(2, '0');
  const hours = String(beijingDate.getUTCHours()).padStart(2, '0');
  const minutes = String(beijingDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(beijingDate.getUTCSeconds()).padStart(2, '0');
  
  return `${month}月${day}日 ${hours}:${minutes}:${seconds}`;
}
