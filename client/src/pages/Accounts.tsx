import React from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { 
  Wallet, 
  PieChart as PieChartIcon, 
  BarChart3, 
  ArrowUpRight, 
  TrendingUp,
  Landmark,
  FileText
} from "lucide-react";
import { motion } from "framer-motion";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";

const COLORS = ['#0064d1', '#008d3d', '#f39c12', '#e74c3c', '#9b59b6', '#34495e'];

export default function Accounts() {
  const { data: balances, isLoading: balancesLoading } = useQuery<any[]>({
    queryKey: ["/api/balances"],
  });

  const { data: platforms } = useQuery<any[]>({
    queryKey: ["/api/platforms"],
  });

  if (balancesLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Aggregate data for reports
  const totalBalanceUsdt = balances?.reduce((sum, b) => sum + Number(b.valueUsdt || 0), 0) || 0;
  
  const platformData = balances?.reduce((acc: any[], b) => {
    const platform = platforms?.find(p => p.id === b.platformId);
    const platformName = platform?.name || "Unknown";
    const existing = acc.find(item => item.name === platformName);
    if (existing) {
      existing.value += Number(b.valueUsdt || 0);
    } else {
      acc.push({ name: platformName, value: Number(b.valueUsdt || 0) });
    }
    return acc;
  }, []) || [];

  const assetData = balances?.reduce((acc: any[], b) => {
    const existing = acc.find(item => item.name === b.asset);
    if (existing) {
      existing.value += Number(b.valueUsdt || 0);
    } else {
      acc.push({ name: b.asset, value: Number(b.valueUsdt || 0) });
    }
    return acc;
  }, []) || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display">الحسابات والتقارير</h2>
          <p className="text-muted-foreground mt-1">عرض شامل للأرصدة وتحليل المحفظة الاستثمارية</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
            <FileText className="w-4 h-4 text-primary" />
            تصدير تقرير PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border-r-4 border-r-primary">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-blue-50 text-primary">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الرصيد الموحد</p>
              <h3 className="text-2xl font-bold font-mono" dir="ltr">{formatCurrency(totalBalanceUsdt)}</h3>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-500 font-bold">
            <ArrowUpRight className="w-3 h-3" />
            <span>+2.4% منذ أمس</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-r-4 border-r-emerald-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المنصات النشطة</p>
              <h3 className="text-2xl font-bold">{platformData.length} منصات</h3>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">توزيع السيولة عبر جميع الحسابات</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-r-4 border-r-amber-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">أداء المحفظة الشهري</p>
              <h3 className="text-2xl font-bold">+18.5%</h3>
            </div>
          </div>
          <div className="h-1 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: '75%' }} />
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Asset Distribution */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-8">
            <PieChartIcon className="w-5 h-5 text-primary" />
            توزيع الأصول الرقمية
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {assetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Distribution */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-8">
            <BarChart3 className="w-5 h-5 text-primary" />
            توزيع السيولة حسب المنصة
          </h3>
          <div className="h-[300px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" fill="#0064d1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Balance Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border bg-slate-50/50">
          <h3 className="font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-400" />
            تفاصيل الأرصدة والعملات
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/30 text-muted-foreground">
                <th className="px-6 py-4 text-right font-medium">المنصة</th>
                <th className="px-6 py-4 text-right font-medium">العملة</th>
                <th className="px-6 py-4 text-right font-medium">الرصيد المتوفر</th>
                <th className="px-6 py-4 text-right font-medium">القيمة التقريبية (USDT)</th>
                <th className="px-6 py-4 text-right font-medium">تاريخ التحديث</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {balances?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">لا توجد بيانات أرصدة متاحة حالياً.</td>
                </tr>
              ) : (
                balances?.map((balance: any) => {
                  const platform = platforms?.find(p => p.id === balance.platformId);
                  return (
                    <tr key={balance.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold">{platform?.name || "Unknown"}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded bg-slate-100 font-bold text-[10px]">{balance.asset}</span>
                      </td>
                      <td className="px-6 py-4 font-mono">{balance.balance}</td>
                      <td className="px-6 py-4 font-bold text-primary font-mono" dir="ltr">{formatCurrency(balance.valueUsdt)}</td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {new Date(balance.updatedAt).toLocaleString('ar-SA')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
