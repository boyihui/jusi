import { collectAndStore } from '../server/services/collector';

async function test() {
  console.log('测试数据采集和存储功能...\n');
  
  const result = await collectAndStore();
  
  if (result.success) {
    console.log('\n✅ 采集成功！');
    console.log(`总计存储: ${result.totalRecords} 条数据`);
  } else {
    console.log('\n❌ 采集失败！');
    console.log(`错误信息: ${result.errorMessage}`);
    process.exit(1);
  }
}

test();
