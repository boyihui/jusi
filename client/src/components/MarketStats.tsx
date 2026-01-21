import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketStatsProps {
  date: string;
}

export function MarketStats({ date }: MarketStatsProps) {
  const { data: stats } = trpc.marketStats.getMarketStats.useQuery({ date });
  const { data: lianbanStats } = trpc.marketStats.getLianbanStats.useQuery({ date });
  const { data: yesterdayZt } = trpc.marketStats.getYesterdayZtPerformance.useQuery({ date });

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 涨停跌停统计 */}
      <Card className="shadow-lg border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:shadow-xl transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
            <span className="text-slate-700 dark:text-slate-300">涨跌停</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">涨停</span>
              <span className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.ztCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">跌停</span>
              <span className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.dtCount}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 上涨下跌统计 */}
      <Card className="shadow-lg border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:shadow-xl transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-slate-700 dark:text-slate-300">涨跌分布</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">上涨</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-xl font-bold text-red-600 dark:text-red-400">
                  {stats.upCount}
                </span>
                <span className="text-xs text-slate-500">({stats.upRatio}%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">下跌</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-xl font-bold text-green-600 dark:text-green-400">
                  {stats.downCount}
                </span>
                <span className="text-xs text-slate-500">({stats.downRatio}%)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 连板梯队 */}
      <Card className="shadow-lg border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:shadow-xl transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-4 bg-red-600 rounded-sm"></div>
              <div className="w-2 h-4 bg-orange-600 rounded-sm"></div>
              <div className="w-2 h-4 bg-yellow-600 rounded-sm"></div>
            </div>
            <span className="text-slate-700 dark:text-slate-300">连板梯队</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lianbanStats && lianbanStats.lianbanData.length > 0 ? (
            <div className="space-y-1.5">
              {lianbanStats.lianbanData.slice(0, 3).map((item) => (
                <div key={item.lianbanCount} className="flex items-center justify-between">
                  <span className={cn(
                    "text-xs sm:text-sm font-medium px-2 py-0.5 rounded",
                    item.lianbanCount >= 5 ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                    item.lianbanCount >= 3 ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400" :
                    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                  )}>
                    {item.lianbanCount}连板
                  </span>
                  <span className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                    {item.stocks}只
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-500 text-center py-2">暂无连板数据</p>
          )}
        </CardContent>
      </Card>

      {/* 昨日涨停表现 */}
      <Card className="shadow-lg border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:shadow-xl transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
            <span className="text-slate-700 dark:text-slate-300">昨涨停表现</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {yesterdayZt && yesterdayZt.totalCount > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">继续涨停</span>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-xl font-bold text-red-600 dark:text-red-400">
                    {yesterdayZt.continueZtCount}
                  </span>
                  <span className="text-xs text-slate-500">({yesterdayZt.continueZtRatio}%)</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">今日上涨</span>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-xl font-bold text-orange-600 dark:text-orange-400">
                    {yesterdayZt.upCount}
                  </span>
                  <span className="text-xs text-slate-500">({yesterdayZt.upRatio}%)</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-500 text-center py-2">暂无数据</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
