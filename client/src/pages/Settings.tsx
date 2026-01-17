import React, { useState } from "react";
import { useBotSettings, useUpdateBotSettings, useApiKeys, useCreateApiKey, useDeleteApiKey } from "@/hooks/use-settings";
import { usePlatforms } from "@/hooks/use-platforms";
import { Trash2, Plus, Key, Save, Server, Shield } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";

export default function Settings() {
  const { data: settings, isLoading: settingsLoading } = useBotSettings();
  const { mutate: updateSettings, isPending: isUpdating } = useUpdateBotSettings();
  const { data: keys } = useApiKeys();
  const { data: platforms } = usePlatforms();
  const { mutate: deleteKey } = useDeleteApiKey();
  const { mutate: createKey, isPending: isCreatingKey } = useCreateApiKey();

  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({ platformId: "", apiKey: "", apiSecret: "", label: "" });
  const [formData, setFormData] = useState<any>({});

  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    createKey({
      platformId: parseInt(newKeyForm.platformId),
      apiKey: newKeyForm.apiKey,
      apiSecret: newKeyForm.apiSecret,
      label: newKeyForm.label,
      userId: "temp",
    }, {
      onSuccess: () => {
        setIsKeyModalOpen(false);
        setNewKeyForm({ platformId: "", apiKey: "", apiSecret: "", label: "" });
      }
    });
  };

  if (settingsLoading) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-display">الإعدادات</h2>
        <p className="text-muted-foreground mt-1">تهيئة استراتيجية التداول وربط المنصات</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 rounded-2xl"
      >
        <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold">إعدادات البوت والمخاطر</h3>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">حالة البوت</label>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-secondary/20">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={formData.isActive || false}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary rtl:peer-checked:after:-translate-x-full"></div>
                  <span className="mr-3 text-sm font-medium text-foreground">
                    {formData.isActive ? "نشط" : "متوقف"}
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">مستوى المخاطرة (AI Risk Level)</label>
              <select 
                className="w-full p-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.riskLevel || "medium"}
                onChange={(e) => setFormData({...formData, riskLevel: e.target.value})}
              >
                <option value="low">منخفض (Conservative)</option>
                <option value="medium">متوسط (Balanced)</option>
                <option value="high">عالي (Aggressive)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الحد الأدنى للربح (%)</label>
              <input 
                type="number" 
                step="0.1"
                className="w-full p-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none font-mono"
                value={formData.minProfitPercentage || ""}
                onChange={(e) => setFormData({...formData, minProfitPercentage: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">مبلغ التداول لكل صفقة (USDT)</label>
              <input 
                type="number" 
                className="w-full p-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none font-mono"
                value={formData.tradeAmountUsdt || ""}
                onChange={(e) => setFormData({...formData, tradeAmountUsdt: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={isUpdating}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isUpdating ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          </div>
        </form>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-6 rounded-2xl"
      >
        <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold">مفاتيح API للمنصات</h3>
          </div>
          <button 
            onClick={() => setIsKeyModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة مفتاح جديد
          </button>
        </div>

        <div className="space-y-3">
          {keys?.map((key: any) => (
            <div key={key.id} className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Server className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-bold">{key.platformName || "Unknown Platform"}</h4>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {key.label || `ID: \${key.id}`} • Created: {new Date(key.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => deleteKey(key.id)}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {keys?.length === 0 && (
            <p className="text-center text-muted-foreground py-8">لا توجد مفاتيح API مضافة حالياً.</p>
          )}
        </div>
      </motion.div>

      <Dialog.Root open={isKeyModalOpen} onOpenChange={setIsKeyModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-card border border-border p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95" dir="rtl">
            <Dialog.Title className="text-lg font-bold mb-4 font-display">إضافة مفتاح API جديد</Dialog.Title>
            <form onSubmit={handleAddKey} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">المنصة</label>
                <select 
                  required
                  className="w-full p-3 rounded-xl bg-background border border-border outline-none focus:ring-2 focus:ring-primary/20"
                  value={newKeyForm.platformId}
                  onChange={(e) => setNewKeyForm({...newKeyForm, platformId: e.target.value})}
                >
                  <option value="">اختر المنصة...</option>
                  {platforms?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">التسمية (اختياري)</label>
                <input 
                  className="w-full p-3 rounded-xl bg-background border border-border outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="مثال: حساب التداول الرئيسي"
                  value={newKeyForm.label}
                  onChange={(e) => setNewKeyForm({...newKeyForm, label: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <input 
                  required
                  className="w-full p-3 rounded-xl bg-background border border-border outline-none focus:ring-2 focus:ring-primary/20 font-mono text-sm"
                  value={newKeyForm.apiKey}
                  onChange={(e) => setNewKeyForm({...newKeyForm, apiKey: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">API Secret</label>
                <input 
                  required
                  type="password"
                  className="w-full p-3 rounded-xl bg-background border border-border outline-none focus:ring-2 focus:ring-primary/20 font-mono text-sm"
                  value={newKeyForm.apiSecret}
                  onChange={(e) => setNewKeyForm({...newKeyForm, apiSecret: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsKeyModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-secondary/50 rounded-lg transition-colors">إلغاء</button>
                <button type="submit" disabled={isCreatingKey} className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">{isCreatingKey ? "جاري الإضافة..." : "حفظ المفتاح"}</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
