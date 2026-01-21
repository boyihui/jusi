/**
 * 多日期对比视图 - 升级版
 * 横向：日期
 * 纵向：排名
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, RefreshCw, GitCompare } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MultiDateView() {
  // 状态管理
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedPlatformId, setSelectedPlatformId] = useState<number | null>(null);
  const [hoveredStock, setHoveredStock] = useState<string | null>(null);

  // 获取平台列表
  const { data: platforms } = trpc.stock.getPlatforms.useQuery();

  // 默认选择第一个平台
  useEffect(() => {
    if (platforms && platforms.length > 0 && !selectedPlatformId) {
      setSelectedPlatformId(platforms[0].id);
    }
  }, [platforms, selectedPlatformId]);

  // 默认选择最近5天
  useEffect(() => {
    const dates: Date[] = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date);
    }
    setSelectedDates(dates);
  }, []);

  // 格式化日期为 YYYY-MM-DD
  const formatDateString = (date: Date): string => {
    return format(date, "yyyy-MM-dd");
  };

  // 获取多日期排名数据
  const dateStrings = selectedDates.map(formatDateString);
  const { data: rankingsData, isLoading, refetch } = trpc.stock.getMultiDateRankings.useQuery(
    {
      dates: dateStrings,
      platformId: selectedPlatformId || 1,
      limit: 100,
    },
    {
      enabled: selectedDates.length > 0 && selectedPlatformId !== null,
      refetchInterval: 5 * 60 * 1000,
    }
  );

  // 处理日期选择
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateString = formatDateString(date);
    const exists = selectedDates.some(d => formatDateString(d) === dateString);
    
    if (exists) {
      // 移除日期
      setSelectedDates(selectedDates.filter(d => formatDateString(d) !== dateString));
    } else {
      // 添加日期（最多10个）
      if (selectedDates.length < 10) {
        setSelectedDates([...selectedDates, date].sort((a, b) => b.getTime() - a.getTime()));
      }
    }
  };

  // 检查某个股票是否应该高亮
  const isHighlighted = (stockName: string): boolean => {
    return hoveredStock === stockName;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600 dark:text-blue-400" />
          <p className="text-slate-600 dark:text-slate-400 text-lg">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        
        {/* 标题 */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 dark:from-indigo-400 dark:via-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
          股票排名监控系统
        </h1>

        {/* 视图切换 */}
        <div className="flex flex-wrap gap-2">
          <Link href="/">
            <Button variant="outline" size="sm" className="hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-400">
              实时排名
            </Button>
          </Link>
          <Button 
            variant="default" 
            size="sm" 
            disabled
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md"
          >
            日期对比
          </Button>
          <Link href="/score">
            <Button variant="outline" size="sm" className="font-semibold hover:bg-purple-50 dark:hover:bg-slate-800 hover:border-purple-400">
              综合评分
            </Button>
          </Link>
        </div>

        {/* 控制栏 */}
        <Card className="shadow-lg border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <GitCompare className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400" />
              对比设置
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              {/* 平台选择 */}
              <div className="flex items-center gap-2 flex-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">平台：</label>
                <Select
                  value={selectedPlatformId?.toString()}
                  onValueChange={(value) => setSelectedPlatformId(parseInt(value))}
                >
                  <SelectTrigger className="w-full sm:w-40 hover:border-indigo-400">
                    <SelectValue placeholder="选择平台" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms?.map((platform) => (
                      <SelectItem key={platform.id} value={platform.id.toString()}>
                        {platform.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 日期选择 */}
              <div className="flex items-center gap-2 flex-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">日期：</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full hover:bg-indigo-50 dark:hover:bg-slate-800 hover:border-indigo-400">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="truncate">选择日期 ({selectedDates.length})</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="multiple"
                      selected={selectedDates}
                      onSelect={(dates) => dates && setSelectedDates(dates.sort((a, b) => b.getTime() - a.getTime()))}
                      locale={zhCN}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* 手动刷新按钮 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-400"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                手动刷新
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 表格 */}
        <Card className="shadow-xl border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              {platforms?.find(p => p.id === selectedPlatformId)?.name} - 多日期对比
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full border-collapse text-[8px] sm:text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                    <th className="border border-slate-300 dark:border-slate-600 p-1 sm:p-2 font-bold sticky left-0 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 z-10 w-8 sm:w-12">
                      排名
                    </th>
                    {rankingsData?.dates.map((date) => (
                      <th key={date} className="border border-slate-300 dark:border-slate-600 p-1 sm:p-2 font-bold whitespace-nowrap text-[8px] sm:text-sm">
                        {format(new Date(date), "M月d日", { locale: zhCN })}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rankingsData?.rankings.map((row) => (
                    <tr key={row.rank} className="hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="border border-slate-300 dark:border-slate-600 p-1 sm:p-2 text-center font-bold sticky left-0 bg-white dark:bg-slate-900 z-10">
                        <span className={cn(
                          "inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[8px] sm:text-xs font-bold",
                          row.rank <= 3 ? "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md" :
                          row.rank <= 10 ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md" :
                          "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        )}>
                          {row.rank}
                        </span>
                      </td>
                      {rankingsData.dates.map((date) => {
                        const stockName = row.stocks[date];
                        const isEmpty = !stockName;
                        const highlighted = isHighlighted(stockName);

                        return (
                          <td
                            key={date}
                            className={cn(
                              "border border-slate-300 dark:border-slate-600 p-1 sm:p-2 text-center transition-all duration-200 cursor-pointer text-[8px] sm:text-sm",
                              isEmpty
                                ? "text-slate-400 dark:text-slate-600"
                                : highlighted
                                ? "bg-gradient-to-br from-red-500 to-red-600 text-white font-bold scale-105 shadow-lg z-20 relative"
                                : "hover:bg-red-50 dark:hover:bg-red-900/20 font-medium"
                            )}
                            onMouseEnter={() => !isEmpty && setHoveredStock(stockName)}
                            onMouseLeave={() => setHoveredStock(null)}
                            onTouchStart={() => !isEmpty && setHoveredStock(stockName)}
                            onTouchEnd={() => setTimeout(() => setHoveredStock(null), 300)}
                          >
                            {stockName || "-"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 说明 */}
        <Card className="shadow-lg border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
          <CardContent className="p-4">
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-2">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">💡</div>
                <p><span className="font-semibold">鼠标悬停</span>在股票名称上，该股票在所有日期列中都会高亮显示</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">⏱</div>
                <p>数据每<span className="font-semibold">5分钟</span>自动刷新一次</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">📅</div>
                <p>可以选择最多<span className="font-semibold">10个日期</span>进行对比</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
