import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, RefreshCw, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { formatLocalTime } from "@/lib/dateUtils";
import { cn } from '@/lib/utils';
import { Link } from 'wouter';

interface ScoreRankingData {
  stockName: string;
  avgScore: number;
  platformCount: number;
  platforms: { name: string; rank: number; score: number }[];
  industry: string;
  concept: string;
}

export default function ScoreRanking() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [hoveredStock, setHoveredStock] = useState<string | null>(null);
  
  // 获取评分排名数据
  const { data: scoreData, refetch, isLoading } = trpc.stock.getScoreRankings.useQuery(
    { date: format(selectedDate, 'yyyy-MM-dd') },
    {
      refetchInterval: autoRefresh ? 60 * 1000 : false,
    }
  );
  
  // 处理日期选择
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };
  
  // 处理手动刷新
  const handleRefresh = () => {
    refetch();
  };
  
  // 获取最后更新时间
  const lastUpdate = new Date();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        
        {/* 标题和控制区域 */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 dark:from-purple-400 dark:via-pink-400 dark:to-orange-400 bg-clip-text text-transparent">
              股票综合评分排名
            </h1>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {/* 日期选择器 */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex-1 sm:flex-none text-xs sm:text-sm hover:bg-purple-50 dark:hover:bg-slate-800 hover:border-purple-400"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, 'yyyy年MM月dd日', { locale: zhCN })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    locale={zhCN}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              {/* 自动刷新开关 */}
              <Button
                variant={autoRefresh ? "default" : "outline"}
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={cn(
                  "flex-1 sm:flex-none text-xs sm:text-sm transition-all duration-200",
                  autoRefresh && "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md"
                )}
              >
                自动刷新：{autoRefresh ? '开' : '关'}
              </Button>
              
              {/* 手动刷新按钮 */}
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex-1 sm:flex-none text-xs sm:text-sm hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-400"
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
                手动刷新
              </Button>
            </div>
          </div>
          
          {/* 视图切换 */}
          <div className="flex flex-wrap gap-2">
            <Link href="/">
              <Button variant="outline" size="sm" className="hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-400">
                实时排名
              </Button>
            </Link>
            <Link href="/compare">
              <Button variant="outline" size="sm" className="hover:bg-indigo-50 dark:hover:bg-slate-800 hover:border-indigo-400">
                日期对比
              </Button>
            </Link>
            <Button 
              variant="default" 
              size="sm" 
              disabled
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md font-semibold"
            >
              综合评分
            </Button>
          </div>
          
          {/* 最后更新时间 */}
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-3 py-1.5 rounded-lg inline-block">
            最后更新: {formatLocalTime(lastUpdate)}
          </div>
        </div>
        
        {/* 说明卡片 */}
        <Card className="shadow-lg border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent font-bold">
                评分规则说明
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">1</div>
              <p><span className="font-semibold text-slate-900 dark:text-slate-100">单平台评分：</span>第1名100分，第2名99分，第3名98分，依次递减</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">2</div>
              <p><span className="font-semibold text-slate-900 dark:text-slate-100">综合得分：</span>所有平台得分之和 ÷ 6（平台总数）</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">3</div>
              <p><span className="font-semibold text-slate-900 dark:text-slate-100">排名规则：</span>按综合得分从高到低排序，得分相同时按出现平台数排序</p>
            </div>
          </CardContent>
        </Card>
        
        {/* 评分排名表格 */}
        <Card className="shadow-xl border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              综合评分排名
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12 text-slate-500">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3" />
                <p className="text-sm sm:text-base">加载中...</p>
              </div>
            ) : !scoreData || scoreData.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm sm:text-base">暂无数据</div>
            ) : (
              <div className="overflow-x-auto rounded-lg">
                <table className="w-full text-[8px] sm:text-xs">
                  <thead className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 sticky top-0 z-10">
                    <tr>
                      <th className="p-1 sm:p-2 text-center font-bold border-b-2 border-slate-300 dark:border-slate-600 w-8 sm:w-12">排名</th>
                      <th className="p-1 sm:p-2 text-left font-bold border-b-2 border-slate-300 dark:border-slate-600">股票名称</th>
                      <th className="p-1 sm:p-2 text-center font-bold border-b-2 border-slate-300 dark:border-slate-600 w-16 sm:w-20">综合得分</th>
                      <th className="p-1 sm:p-2 text-center font-bold border-b-2 border-slate-300 dark:border-slate-600 w-12 sm:w-16">平台数</th>
                      <th className="p-1 sm:p-2 text-left font-bold border-b-2 border-slate-300 dark:border-slate-600 hidden sm:table-cell">行业</th>
                      <th className="p-1 sm:p-2 text-left font-bold border-b-2 border-slate-300 dark:border-slate-600 hidden sm:table-cell">概念</th>
                      <th className="p-1 sm:p-2 text-left font-bold border-b-2 border-slate-300 dark:border-slate-600 hidden md:table-cell">平台详情</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoreData.map((stock, index) => (
                      <tr
                        key={stock.stockName}
                        className={cn(
                          "border-b border-slate-200 dark:border-slate-700 transition-all duration-200 cursor-pointer",
                          hoveredStock === stock.stockName 
                            ? "bg-gradient-to-r from-red-500 to-red-600 text-white scale-[1.02] shadow-lg z-20 relative" 
                            : "hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 dark:hover:from-red-900/10 dark:hover:to-orange-900/10"
                        )}
                        onMouseEnter={() => setHoveredStock(stock.stockName)}
                        onMouseLeave={() => setHoveredStock(null)}
                        onTouchStart={() => setHoveredStock(stock.stockName)}
                        onTouchEnd={() => setTimeout(() => setHoveredStock(null), 300)}
                      >
                        <td className="p-1 sm:p-2 text-center font-bold">
                          <span className={cn(
                            "inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[8px] sm:text-xs font-bold",
                            index === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg" :
                            index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md" :
                            index === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md" :
                            index < 10 ? "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md" :
                            hoveredStock === stock.stockName ? "bg-white text-red-600" :
                            "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                          )}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="p-1 sm:p-2">
                          <div className="font-semibold text-[9px] sm:text-sm">{stock.stockName}</div>
                          <div className={cn(
                            "text-[7px] sm:text-[9px] sm:hidden mt-0.5",
                            hoveredStock === stock.stockName ? "text-white/90" : "opacity-70"
                          )}>
                            <div className="truncate">{stock.industry}</div>
                            <div className="truncate">{stock.concept}</div>
                          </div>
                        </td>
                        <td className={cn(
                          "p-1 sm:p-2 text-center font-bold text-[9px] sm:text-sm",
                          hoveredStock === stock.stockName ? "text-white" : "text-purple-600 dark:text-purple-400"
                        )}>
                          {stock.avgScore.toFixed(2)}
                        </td>
                        <td className={cn(
                          "p-1 sm:p-2 text-center text-[9px] sm:text-xs font-medium",
                          hoveredStock === stock.stockName ? "text-white" : ""
                        )}>
                          <span className={cn(
                            "inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[8px] sm:text-xs font-bold",
                            hoveredStock === stock.stockName 
                              ? "bg-white text-red-600" 
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          )}>
                            {stock.platformCount}
                          </span>
                        </td>
                        <td className={cn(
                          "p-1 sm:p-2 hidden sm:table-cell text-xs",
                          hoveredStock === stock.stockName ? "text-white" : ""
                        )}>
                          {stock.industry}
                        </td>
                        <td className={cn(
                          "p-1 sm:p-2 hidden sm:table-cell text-xs",
                          hoveredStock === stock.stockName ? "text-white" : ""
                        )}>
                          {stock.concept}
                        </td>
                        <td className={cn(
                          "p-1 sm:p-2 hidden md:table-cell",
                          hoveredStock === stock.stockName ? "text-white" : ""
                        )}>
                          <div className="space-y-1">
                            {stock.platforms.map((p, i) => (
                              <div key={i} className="text-[10px] flex items-center gap-1">
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded text-[9px] font-medium",
                                  hoveredStock === stock.stockName 
                                    ? "bg-white/20 text-white" 
                                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                )}>
                                  {p.name}
                                </span>
                                <span>第{p.rank}名</span>
                                <span className={cn(
                                  "font-semibold",
                                  hoveredStock === stock.stockName ? "text-white" : "text-purple-600 dark:text-purple-400"
                                )}>
                                  ({p.score}分)
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
