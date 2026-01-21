/**
 * 定时任务调度器
 * 负责启动和管理后台定时任务
 */

import { startScheduledCollection } from './services/collector';

let collectionInterval: NodeJS.Timeout | null = null;

/**
 * 启动所有定时任务
 */
export function startScheduler() {
  console.log('[Scheduler] 启动定时任务调度器...');
  
  // 启动数据采集定时任务（每1分钟）
  collectionInterval = startScheduledCollection(1);
  
  console.log('[Scheduler] 定时任务已启动');
}

/**
 * 停止所有定时任务
 */
export function stopScheduler() {
  console.log('[Scheduler] 停止定时任务调度器...');
  
  if (collectionInterval) {
    clearInterval(collectionInterval);
    collectionInterval = null;
  }
  
  console.log('[Scheduler] 定时任务已停止');
}

// 进程退出时清理
process.on('SIGINT', () => {
  stopScheduler();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopScheduler();
  process.exit(0);
});
