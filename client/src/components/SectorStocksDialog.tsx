import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { Loader2 } from 'lucide-react';

interface SectorStocksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectorName: string;
  sectorType: 'industry' | 'concept';
  date: string;
  stockCount: number;
}

export function SectorStocksDialog({
  open,
  onOpenChange,
  sectorName,
  sectorType,
  date,
  stockCount,
}: SectorStocksDialogProps) {
  const { data: stocks, isLoading } = trpc.stock.getSectorStocks.useQuery(
    {
      date,
      type: sectorType,
      sectorName,
    },
    {
      enabled: open, // 只在弹窗打开时查询
    }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {sectorName} - {sectorType === 'industry' ? '行业' : '概念'}股票列表
            <span className="text-sm text-slate-500 ml-2">({stockCount}股)</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : stocks && stocks.length > 0 ? (
            <div className="space-y-2">
              {/* 桌面端表格视图 */}
              <div className="hidden sm:block">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-left">
                      <th className="p-2 text-sm font-semibold w-16">排名</th>
                      <th className="p-2 text-sm font-semibold w-32">股票名称</th>
                      <th className="p-2 text-sm font-semibold w-24">综合得分</th>
                      <th className="p-2 text-sm font-semibold w-24">行业</th>
                      <th className="p-2 text-sm font-semibold">概念</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.map((stock, index) => (
                      <tr
                        key={`${stock.stockName}-${index}`}
                        className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="p-2 text-sm text-center font-semibold">{index + 1}</td>
                        <td className="p-2 text-sm font-medium">{stock.stockName}</td>
                        <td className="p-2 text-sm">
                          <span className="inline-flex items-center justify-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-bold">
                            {stock.avgScore.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-2 text-xs text-slate-500 dark:text-slate-400">
                          {stock.industry || '-'}
                        </td>
                        <td className="p-2 text-xs text-slate-500 dark:text-slate-400">
                          <div className="max-w-md whitespace-normal break-words leading-relaxed">
                            {stock.hotConcept || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 移动端卡片视图 */}
              <div className="sm:hidden space-y-2">
                {stocks.map((stock, index) => (
                  <div
                    key={`${stock.stockName}-${index}`}
                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">#{index + 1}</div>
                        <div className="font-medium text-sm">{stock.stockName}</div>
                      </div>
                      <span className="inline-flex items-center justify-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-bold">
                        {stock.avgScore.toFixed(2)}分
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                      <div>行业: {stock.industry || '-'}</div>
                      <div>概念: {stock.hotConcept || '-'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 py-12">暂无数据</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
