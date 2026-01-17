import React, { useState } from "react";
import { useTradeLogs } from "@/hooks/use-logs";
import { formatCurrency, cn } from "@/lib/utils";
import { Activity, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function Logs() {
  const { data: logs, isLoading } = useTradeLogs();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold font-display">سجل العمليات</h2>
        <p className="text-muted-foreground mt-1">تاريخ الصفقات وقرارات الذكاء الاصطناعي</p>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/30 text-muted-foreground border-b border-border">
              <th className="px-6 py-4 text-right font-medium">التاريخ</th>
              <th className="px-6 py-4 text-right font-medium">الزوج</th>
              <th className="px-6 py-4 text-right font-medium">الربح</th>
              <th className="px-6 py-4 text-right font-medium">المبلغ</th>
              <th className="px-6 py-4 text-right font-medium">الحالة</th>
              <th className="px-6 py-4 text-right font-medium">درجة المخاطرة</th>
              <th className="px-6 py-4 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs?.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground">لا توجد سجلات بعد.</td>
              </tr>
            ) : (
              logs?.map((log: any) => (
                <React.Fragment key={log.id}>
                  <tr 
                    onClick={() => toggleExpand(log.id)}
                    className={cn(
                      "cursor-pointer hover:bg-secondary/10 transition-colors",
                      expandedId === log.id ? "bg-secondary/20" : ""
                    )}
                  >
                    <td className="px-6 py-4 font-mono text-xs">
                      {format(new Date(log.executedAt), "yyyy-MM-dd HH:mm:ss")}
                    </td>
                    <td className="px-6 py-4 font-bold ltr font-mono">{log.pair}</td>
                    <td className={cn(
                      "px-6 py-4 font-bold font-mono",
                      Number(log.profitUsdt) > 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {Number(log.profitUsdt) > 0 ? "+" : ""}{formatCurrency(log.profitUsdt)}
                    </td>
                    <td className="px-6 py-4 font-mono">{formatCurrency(log.amount)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                         <div className="h-1.5 w-16 bg-secondary rounded-full overflow-hidden">
                           <div 
                             className={cn(
                               "h-full rounded-full",
                               log.aiRiskScore > 70 ? "bg-rose-500" : 
                               log.aiRiskScore > 30 ? "bg-amber-500" : "bg-emerald-500"
                             )}
                             style={{ width: `${log.aiRiskScore}%` }}
                           />
                         </div>
                         <span className="text-xs font-mono text-muted-foreground">{log.aiRiskScore}%</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-left">
                      {expandedId === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </td>
                  </tr>
                  <AnimatePresence>
                    {expandedId === log.id && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-secondary/5"
                      >
                        <td colSpan={7} className="px-6 py-4">
                          <div className="p-4 rounded-xl border border-border bg-background/50">
                            <h4 className="font-bold flex items-center gap-2 mb-3 text-primary">
                              <Activity className="w-4 h-4" />
                              تفاصيل تحليل الذكاء الاصطناعي
                            </h4>
                            <p className="text-sm leading-relaxed text-foreground/90">
                              {log.aiAnalysisSummary || "لا يوجد ملخص متاح لهذا السجل."}
                            </p>
                            
                            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                              <div className="p-3 rounded-lg bg-secondary/30">
                                <span className="text-muted-foreground block mb-1">سعر الشراء</span>
                                <span className="font-mono text-lg">{formatCurrency(log.buyPrice)}</span>
                              </div>
                              <div className="p-3 rounded-lg bg-secondary/30">
                                <span className="text-muted-foreground block mb-1">سعر البيع</span>
                                <span className="font-mono text-lg">{formatCurrency(log.sellPrice)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'executed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3" />
        منفذة
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">
        <XCircle className="w-3 h-3" />
        فشلت
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
      <AlertCircle className="w-3 h-3" />
      محاكاة
    </span>
  );
}
