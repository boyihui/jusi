import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, RefreshCw, TrendingUp, Clock, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { formatLocalTime } from "@/lib/dateUtils";
import { cn } from '@/lib/utils';
import { Link } from 'wouter';
import { SectorStocksDialog } from '@/components/SectorStocksDialog';

interface RankingData {
  id: number;
  platformId: number;
  platformName: string;
  stockName: string;
  ranking: number;
  industry?: string | null;
  secondaryIndustry?: string | null;
  hotConcept?: string | null;
}

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [hoveredStock, setHoveredStock] = useState<string | null>(null);
  const [hotSectorType, setHotSectorType] = useState<'industry' | 'concept'>('industry');
  const [selectedSector, setSelectedSector] = useState<{
    name: string;
    type: 'industry' | 'concept';
    count: number;
  } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // 更新时钟
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // 判断市场状态
  const getMarketStatus = () => {
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    const day = currentTime.getDay();
    
    // 周末休市
    if (day === 0 || day === 6) {
      return { status: '休市中', color: 'text-slate-500' };
    }
    
    // 上午 9:30-11:30
    if ((hour === 9 && minute >= 30) || (hour === 10) || (hour === 11 && minute < 30)) {
      return { status: '开盘中', color: 'text-green-600 animate-pulse' };
    }
    
    // 下午 13:00-15:00
    if ((hour === 13) || (hour === 14) || (hour === 15 && minute === 0)) {
      return { status: '开盘中', color: 'text-green-600 animate-pulse' };
    }
    
    return { status: '休市中', color: 'text-slate-500' };
  };
  
  const marketStatus = getMarketStatus();
  
  // 获取平台列表
  const { data: platforms } = trpc.stock.getPlatforms.useQuery();
  
  // 获取热门板块数据
  const { data: hotSectors } = trpc.stock.getHotSectors.useQuery({
    date: format(selectedDate, 'yyyy-MM-dd'),
    type: hotSectorType,
  });

  // 获取当日排名数据
  const { data: todayData, refetch, isLoading } = trpc.stock.getTodayRankings.useQuery(
    undefined,
    {
      refetchInterval: autoRefresh ? 5 * 60 * 1000 : false,
    }
  );
  
  // 获取指定日期的排名数据
  const { data: dateData } = trpc.stock.getRankingsByDate.useQuery(
    { date: format(selectedDate, 'yyyy-MM-dd') },
    { enabled: format(selectedDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd') }
  );
  
  // 根据选择的日期决定使用哪个数据源
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const currentData = isToday ? todayData : dateData;
  
  // 组织数据：按排名分组，存储完整的item对象
  const organizedData: Record<number, Record<string, RankingData>> = {};
  if (currentData?.rankings) {
    currentData.rankings.forEach((item: RankingData) => {
      if (!organizedData[item.ranking]) {
        organizedData[item.ranking] = {};
      }
      organizedData[item.ranking][item.platformName] = item;
    });
  }
  
  // 获取所有排名号（排序），只保留前100名
  const rankings = Object.keys(organizedData).map(Number).sort((a, b) => a - b).slice(0, 100);
  
  // 计算重复出现的股票（出现在多个平台）
  const stockCounts: Record<number, Record<string, number>> = {};
  rankings.forEach(ranking => {
    const stocks: Record<string, number> = {};
    Object.values(organizedData[ranking]).forEach(item => {
      stocks[item.stockName] = (stocks[item.stockName] || 0) + 1;
    });
    stockCounts[ranking] = stocks;
  });
  
  // 判断某个单元格是否应该标红
  const shouldHighlight = (ranking: number, stockName: string): boolean => {
    return (stockCounts[ranking]?.[stockName] || 0) >= 2;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        
        {/* 顶部状态栏 - 新增 */}
        <div className="flex items-center justify-between bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl px-4 py-3 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <span className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100">
                {format(currentTime, 'HH:mm:ss')}
              </span>
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {format(currentTime, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity className={cn("h-4 w-4", marketStatus.color)} />
            <span className={cn("text-sm sm:text-base font-semibold", marketStatus.color)}>
              {marketStatus.status}
            </span>
          </div>
        </div>

        {/* 人气热点板块 */}
        <Card className="shadow-lg border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
                <span className="bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent font-bold">
                  人气热点板块
                </span>
              </CardTitle>
              <div className="flex gap-2">
                <button
                  onClick={() => setHotSectorType('industry')}
                  className={cn(
                    "px-3 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-all duration-200",
                    hotSectorType === 'industry'
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md scale-105"
                      : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
                  )}
                >
                  行业
                </button>
                <button
                  onClick={() => setHotSectorType('concept')}
                  className={cn(
                    "px-3 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-all duration-200",
                    hotSectorType === 'concept'
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md scale-105"
                      : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
                  )}
                >
                  概念
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {hotSectors && hotSectors.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                {hotSectors.map((sector, index) => (
                  <div
                    key={sector.name}
                    onClick={() => setSelectedSector({
                      name: sector.name,
                      type: hotSectorType,
                      count: sector.count,
                    })}
                    className="group flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-500"
                  >
                    <div className={cn(
                      "flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-white shadow-md",
                      index === 0 ? "bg-gradient-to-br from-red-500 to-red-600" :
                      index === 1 ? "bg-gradient-to-br from-orange-500 to-orange-600" :
                      index === 2 ? "bg-gradient-to-br from-yellow-500 to-yellow-600" :
                      "bg-gradient-to-br from-blue-500 to-blue-600"
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-semibold truncate text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {sector.name}
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {sector.count}只
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-8 text-sm sm:text-base">暂无数据</div>
            )}
          </CardContent>
        </Card>

        {/* 标题和控制栏 */}
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            股票排名监控系统
          </h1>
          
          {/* 视图切换 */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="default" 
              size="sm" 
              disabled
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
            >
              实时排名
            </Button>
            <Link href="/compare">
              <Button variant="outline" size="sm" className="hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-400">
                日期对比
              </Button>
            </Link>
            <Link href="/score">
              <Button variant="outline" size="sm" className="font-semibold hover:bg-purple-50 dark:hover:bg-slate-800 hover:border-purple-400">
                综合评分
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
            {/* 日期选择器 */}
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[240px] justify-start text-left font-normal hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-400",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP', { locale: zhCN }) : "选择日期"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    locale={zhCN}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* 控制按钮 */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={cn(
                  "flex-1 sm:flex-none transition-all duration-200",
                  autoRefresh 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-400 text-green-700 dark:text-green-400 hover:bg-green-100' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                {autoRefresh ? '自动刷新：开' : '自动刷新：关'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                className="flex-1 sm:flex-none hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-400"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                手动刷新
              </Button>
            </div>
          </div>
          
          {/* 更新时间 */}
          {currentData?.collectedAt && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-3 py-1.5 rounded-lg inline-block">
              最后更新: {formatLocalTime(currentData.collectedAt)}
            </p>
          )}
        </div>
        
        {/* 数据表格 */}
        <Card className="shadow-xl border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              {isToday ? '今日实时排名' : `${format(selectedDate, 'yyyy年MM月dd日', { locale: zhCN })} 排名`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full border-collapse text-[8px] sm:text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                    <th className="border border-slate-300 dark:border-slate-600 px-1 sm:px-3 py-2 sm:py-3 text-center font-bold sticky left-0 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 z-10 w-8 sm:w-auto text-[8px] sm:text-sm">
                      排名
                    </th>
                    {platforms?.map(platform => (
                      <th
                        key={platform.id}
                        className="border border-slate-300 dark:border-slate-600 px-1 sm:px-3 py-2 sm:py-3 text-center font-bold text-[8px] sm:text-sm whitespace-nowrap"
                      >
                        {platform.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rankings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={(platforms?.length || 0) + 1}
                        className="border border-slate-300 dark:border-slate-600 px-3 py-12 text-center text-slate-500 text-sm sm:text-base"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="h-5 w-5 animate-spin" />
                            <span>加载中...</span>
                          </div>
                        ) : '暂无数据'}
                      </td>
                    </tr>
                  ) : (
                    rankings.map(ranking => (
                      <tr key={ranking} className="hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="border border-slate-300 dark:border-slate-600 px-1 sm:px-3 py-1.5 sm:py-2 text-center font-bold sticky left-0 bg-white dark:bg-slate-900 z-10 w-8 sm:w-auto text-[8px] sm:text-sm">
                          <span className={cn(
                            "inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[8px] sm:text-xs font-bold",
                            ranking <= 3 ? "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md" :
                            ranking <= 10 ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md" :
                            "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                          )}>
                            {ranking}
                          </span>
                        </td>
                        {platforms?.map(platform => {
                          const item = organizedData[ranking]?.[platform.name];
                          const stockName = item?.stockName || '';
                          const isHighlighted = shouldHighlight(ranking, stockName);
                          const isHovered = stockName && hoveredStock === stockName;
                          
                          return (
                            <td
                              key={platform.id}
                              className={cn(
                                "border border-slate-300 dark:border-slate-600 px-1 sm:px-3 py-1 sm:py-2 text-center transition-all duration-200 cursor-pointer",
                                isHighlighted && !isHovered && "bg-red-50 dark:bg-red-900/20 font-semibold shadow-inner border-red-200 dark:border-red-800",
                                isHovered && "bg-gradient-to-br from-red-500 to-red-600 text-white font-bold scale-105 shadow-lg z-20 relative"
                              )}
                              onMouseEnter={() => stockName && setHoveredStock(stockName)}
                              onMouseLeave={() => setHoveredStock(null)}
                              onTouchStart={() => stockName && setHoveredStock(stockName)}
                              onTouchEnd={() => setTimeout(() => setHoveredStock(null), 1000)}
                            >
                              {stockName && (
                                <div className="flex flex-col items-center gap-0.5 py-0.5">
                                  <div className="font-semibold leading-tight text-[8px] sm:text-sm truncate w-full px-0.5 text-center">
                                    {stockName}
                                  </div>
                                  {item.industry && (
                                    <div className={cn(
                                      "text-[6px] sm:text-xs leading-tight truncate w-full px-0.5 text-center",
                                      isHovered ? "text-white/90" : "text-slate-500 dark:text-slate-400"
                                    )}>
                                      {item.industry}
                                    </div>
                                  )}
                                  {item.secondaryIndustry && (
                                    <div className={cn(
                                      "text-[6px] sm:text-xs leading-tight truncate w-full px-0.5 text-center",
                                      isHovered ? "text-white/80" : "text-slate-600 dark:text-slate-300"
                                    )}>
                                      {item.secondaryIndustry}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* 说明文字 */}
            <div className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="inline-block w-4 h-4 bg-red-100 dark:bg-red-900/30 border-2 border-red-400 rounded"></span>
                <span className="font-medium">红色背景表示该股票同时出现在多个平台的排名中</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 股票列表弹窗 */}
      {selectedSector && (
        <SectorStocksDialog
          open={!!selectedSector}
          onOpenChange={(open) => !open && setSelectedSector(null)}
          sectorName={selectedSector.name}
          sectorType={selectedSector.type}
          date={format(selectedDate, 'yyyy-MM-dd')}
          stockCount={selectedSector.count}
        />
      )}
    </div>
  );
}
