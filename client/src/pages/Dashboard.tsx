import React from "react";
import { Layout } from "@/components/Layout";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  BrainCircuit,
  Zap,
  Bot
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

// Simulated Chart Data
const chartData = [
  { time: "00:00", spread: 0.2 },
  { time: "04:00", spread: 0.4 },
  { time: "08:00", spread: 1.2 },
  { time: "12:00", spread: 0.8 },
  { time: "16:00", spread: 1.5 },
  { time: "20:00", spread: 0.9 },
  { time: "24:00", spread: 1.1 },
];

// Simulated Opportunities
const opportunities = [
  { id: 1, pair: "BTC/USDT", buy: "Binance", sell: "Kraken", spread: 1.2, status: "available" },
  { id: 2, pair: "ETH/USDT", buy: "KuCoin", sell: "Binance", spread: 0.85, status: "analyzing" },
  { id: 3, pair: "SOL/USDT", buy: "Bybit", sell: "OKX", spread: 2.1, status: "risk_high" },
];

export default function Dashboard() {
  const { toast } = useToast();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: opportunities, isLoading: oppsLoading } = useQuery<any[]>({
    queryKey: ["/api/opportunities"],
    refetchInterval: 5000, // Refresh every 5 seconds for live feel
  });

  const executeTradeMutation = useMutation({
    mutationFn: async (tradeData: any) => {
      const res = await apiRequest("POST", "/api/trades/execute", tradeData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      toast({
        title: "تم التنفيذ",
        description: "تم تنفيذ الصفقة وحفظها في السجلات بنجاح.",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل تنفيذ الصفقة. يرجى المحاولة لاحقاً.",
        variant: "destructive",
      });
    }
  });

  const isLoading = statsLoading || oppsLoading;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground font-display">لوحة التحكم</h2>
          <p className="text-muted-foreground mt-1">مراقبة حية للأسواق والفرص الاستثمارية</p>
        </div>
        <div className="flex items-center gap-3">
           <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-sm font-medium border border-green-500/20 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
             السوق نشط
           </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="إجمالي الأرباح" 
          value={formatCurrency(stats?.totalProfit || 0)} 
          icon={Wallet} 
          trend="+12.5%" 
          trendUp={true} 
          color="text-emerald-500"
        />
        <StatsCard 
          title="الصفقات اليوم" 
          value={stats?.tradesToday || 0} 
          icon={Activity} 
          trend="+5" 
          trendUp={true}
          color="text-blue-500"
        />
        <StatsCard 
          title="درجة المخاطرة" 
          value={(stats?.riskScore || 0) + "%"} 
          icon={AlertTriangle} 
          trend="-2%" 
          trendUp={false} 
          goodTrendIsDown={true}
          color="text-amber-500"
        />
        <StatsCard 
          title="البوتات النشطة" 
          value={stats?.activeBots || 0} 
          icon={Bot} 
          trend="مستقر" 
          color="text-purple-500"
        />
      </div>

      {/* Charts & AI Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              تحليل الفروقات السعرية (Arbitrage Spread)
            </h3>
            <select className="bg-secondary/50 border border-border rounded-lg text-sm px-3 py-1 outline-none focus:ring-2 focus:ring-primary/20">
              <option>آخر 24 ساعة</option>
              <option>آخر أسبوع</option>
            </select>
          </div>
          <div className="h-[300px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSpread" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="spread" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorSpread)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-panel rounded-2xl p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <BrainCircuit className="w-32 h-32 text-primary" />
          </div>
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4 relative z-10">
            <BrainCircuit className="w-5 h-5 text-purple-500" />
            تحليل الذكاء الاصطناعي
          </h3>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 relative z-10 custom-scrollbar">
            {opportunities && opportunities.length > 0 ? (
              <>
                <AILogMessage 
                  time={new Date().toLocaleTimeString('ar-SA')} 
                  text={`تحليل الفرص النشطة: تم رصد ${opportunities.length} فرصة ربح بين المنصات المربوطة.`} 
                  sentiment="positive" 
                />
                {opportunities.map((opp: any, i: number) => (
                  <AILogMessage 
                    key={i}
                    time={new Date().toLocaleTimeString('ar-SA')} 
                    text={`فحص سيولة ${opp.pair} بين ${opp.buy} و ${opp.sell}. الفرق السعري ${opp.spread}%.`} 
                    sentiment={parseFloat(opp.spread) > 1.5 ? "positive" : "neutral"} 
                  />
                ))}
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                يرجى ربط منصتين على الأقل عبر API Keys لبدء التحليل.
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Live Opportunities Table */}
      <motion.div variants={item} className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            الفرص المتاحة حالياً
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/30 text-muted-foreground">
                <th className="px-6 py-4 text-right font-medium">الزوج</th>
                <th className="px-6 py-4 text-right font-medium">الشراء/البيع</th>
                <th className="px-6 py-4 text-right font-medium">الفرق الإجمالي</th>
                <th className="px-6 py-4 text-right font-medium">الرسوم المتوقعة</th>
                <th className="px-6 py-4 text-right font-medium">صافي الربح</th>
                <th className="px-6 py-4 text-right font-medium">المبلغ المطلوب</th>
                <th className="px-6 py-4 text-right font-medium">الحالة</th>
                <th className="px-6 py-4 text-right font-medium">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {opportunities?.map((opp) => (
                <tr key={opp.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4 font-bold ltr font-mono">{opp.pair}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-1 rounded">شراء:</span>
                        <span className="font-medium text-xs">{opp.buy}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] bg-rose-500/10 text-rose-600 px-1 rounded">بيع:</span>
                        <span className="font-medium text-xs">{opp.sell}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs" dir="ltr">{opp.spread}%</td>
                  <td className="px-6 py-4 font-mono text-xs text-rose-500" dir="ltr">-{opp.fees}%</td>
                  <td className="px-6 py-4 font-bold text-emerald-500 font-mono" dir="ltr">
                    {opp.netProfit}%
                    <div className="text-[10px] text-muted-foreground font-normal">≈ ${opp.expectedProfitUsdt}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-primary font-mono text-xs" dir="ltr">${opp.minAmountRequired}</td>
                  <td className="px-6 py-4">
                    {opp.status === 'available' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-500">مربحة (محمية)</span>}
                    {opp.status === 'analyzing' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-500/10 text-slate-500">غير مربحة</span>}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      disabled={opp.status !== 'available' || executeTradeMutation.isPending}
                      onClick={() => executeTradeMutation.mutate({
                        pair: opp.pair,
                        buyPlatform: opp.buy,
                        sellPlatform: opp.sell,
                        amount: opp.minAmountRequired,
                        buyPrice: opp.buyPrice,
                        sellPrice: opp.sellPrice,
                        profitUsdt: opp.expectedProfitUsdt,
                        profitPercentage: opp.netProfit
                      })}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                      {executeTradeMutation.isPending ? "جاري..." : "تنفيذ"}
                    </button>
                  </td>
                </tr>
              ))}
              {opportunities?.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد فرص متاحة حالياً. جاري البحث...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatsCard({ title, value, icon: Icon, trend, trendUp, goodTrendIsDown, color }: any) {
  const isPositive = goodTrendIsDown ? !trendUp : trendUp;
  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-primary/50 transition-colors duration-300">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className={`w-24 h-24 ${color}`} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-xl bg-secondary/50 ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-3xl font-bold font-mono tracking-tighter">{value}</span>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span dir="ltr">{trend}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AILogMessage({ time, text, sentiment }: any) {
  const colors = {
    positive: "border-emerald-500/30 bg-emerald-500/5",
    negative: "border-rose-500/30 bg-rose-500/5",
    neutral: "border-blue-500/30 bg-blue-500/5"
  };
  return (
    <div className={`p-3 rounded-lg border-r-2 ${colors[sentiment as keyof typeof colors]} text-sm`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-mono text-muted-foreground/70" dir="ltr">{time}</span>
      </div>
      <p className="text-foreground/90 leading-relaxed">{text}</p>
    </div>
  );
}
