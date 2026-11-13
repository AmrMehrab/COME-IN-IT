import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, ShieldAlert, CheckCircle2, AlertTriangle, Clock, CheckCheck, Trash2, Filter } from "lucide-react";
import { toast } from "sonner";

interface SystemNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  severity: "CRITICAL" | "WARNING" | "INFO" | "SUCCESS";
  category: "KYC_KYB" | "SECURITY" | "CONTRACT" | "GOV_SYNC";
  read: boolean;
}

const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: "notif-1",
    title: "تنبيه قرب انتهاء صلاحية شهادة KYB",
    description: "الكيان التجاري (مصانع الهندسية الثقيلة - biz_99182) يتطلب تجديد التحقق الضريبي خلال 14 يوماً لتجنب تعليق صلاحيات B2B.",
    timestamp: "منذ 15 دقيقة",
    severity: "WARNING",
    category: "KYC_KYB",
    read: false,
  },
  {
    id: "notif-2",
    title: "اكتشاف محاولة دخول غير مصرح بها (Rate Limit Block)",
    description: "تم حظر محاولة استعلام مشبوهة من عنوان IP خارجي على بوابة السيادة الهجينة بسبب تجاوز حد الصلاحيات المؤقتة.",
    timestamp: "منذ ساعة واحدة",
    severity: "CRITICAL",
    category: "SECURITY",
    read: false,
  },
  {
    id: "notif-3",
    title: "اكتمال وتوثيق عقد توريد حكومي جديد (B2G)",
    description: "تم توقيع وتشفير العقد رقم CII-CNT-2026-991 بنجاح وتخزينه في سجل التدقيق المنيع (WORM Vault).",
    timestamp: "منذ 3 ساعات",
    severity: "SUCCESS",
    category: "CONTRACT",
    read: true,
  },
  {
    id: "notif-4",
    title: "تحديث مزامنة البوابة الحكومية (NTRA)",
    description: "تمت بنجاح مطابقة بيانات التراخيص والمنتجات مع السجلات المركزية للجهاز القومي لتنظيم الاتصالات والهيئة العامة للرقابة.",
    timestamp: "منذ 5 ساعات",
    severity: "INFO",
    category: "GOV_SYNC",
    read: true,
  },
];

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<SystemNotification[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<string>("ALL");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    toast.success("تم تحديد التنبيه كمقروء.");
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("تم تحديث كافة التنبيهات كمقروءة.");
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.info("تم حذف التنبيه.");
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "UNREAD") return !n.read;
    if (filter === "CRITICAL") return n.severity === "CRITICAL" || n.severity === "WARNING";
    if (filter === "CONTRACT") return n.category === "CONTRACT";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-card/60 p-6 rounded-2xl border border-border/65 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Bell className="w-6 h-6 text-primary" />
            مركز التنبيهات والحالات الأمنية (Live Notification Center)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            متابعة فورية للحالات الأمنية، انتهاء صلاحيات التحقق (KYC/KYB)، وتحديثات العقود وسجلات التدقيق المنيع.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-3 py-1 bg-primary/10 text-primary border-primary/20">
            {unreadCount} تنبيه غير مقروء
          </Badge>
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="gap-1.5 text-xs">
            <CheckCheck className="w-4 h-4 text-emerald-500" />
            قراءة الكل
          </Button>
        </div>
      </div>

      {/* أزرار التصفية */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={filter === "ALL" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("ALL")}
          className="text-xs"
        >
          الكل ({notifications.length})
        </Button>
        <Button
          variant={filter === "UNREAD" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("UNREAD")}
          className="text-xs"
        >
          غير المقروءة ({unreadCount})
        </Button>
        <Button
          variant={filter === "CRITICAL" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("CRITICAL")}
          className="text-xs"
        >
          المخاطر والتنبيهات الهامة
        </Button>
        <Button
          variant={filter === "CONTRACT" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("CONTRACT")}
          className="text-xs"
        >
          العقود والصفقات
        </Button>
      </div>

      {/* قائمة التنبيهات */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card className="p-8 text-center border border-border/60">
            <p className="text-sm text-muted-foreground">لا توجد تنبيهات تطابق التصفية الحالية.</p>
          </Card>
        ) : (
          filteredNotifications.map((notif) => (
            <Card
              key={notif.id}
              className={`border transition-all ${
                notif.read ? "border-border/60 bg-card/40" : "border-primary/40 bg-card shadow-sm"
              }`}
            >
              <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {notif.severity === "CRITICAL" && <ShieldAlert className="w-5 h-5 text-rose-500" />}
                    {notif.severity === "WARNING" && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                    {notif.severity === "SUCCESS" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    {notif.severity === "INFO" && <Bell className="w-5 h-5 text-blue-500" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-foreground">{notif.title}</h4>
                      {!notif.read && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5">جديد</Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {notif.category}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground font-mono">{notif.timestamp}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{notif.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {!notif.read && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleMarkAsRead(notif.id)}
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                      تعليم كمقروء
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500"
                    onClick={() => handleDelete(notif.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
