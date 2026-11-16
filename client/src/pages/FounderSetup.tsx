import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

type FounderForm = {
  legalName: string;
  nationalId: string;
  phone: string;
  email: string;
  address: string;
};

const initialForm: FounderForm = {
  legalName: "",
  nationalId: "",
  phone: "",
  email: "",
  address: "",
};

export default function FounderSetup() {
  const { user, isAuthenticated, loading } = useAuth();
  const [form, setForm] = useState(initialForm);
  const status = trpc.founder.status.useQuery();
  const utils = trpc.useUtils();
  const completeBootstrap = trpc.founder.completeBootstrap.useMutation({
    onSuccess: async () => {
      setForm(initialForm);
      await utils.founder.status.invalidate();
      toast.success("اكتمل تأسيس حساب المؤسس. حالة KYC لم تتغير إلى موثّق.");
    },
    onError: error => {
      setForm(current => ({ ...current, nationalId: "" }));
      toast.error(
        error.message || "تعذر إكمال التأسيس. لم تُفتح التسجيلات العامة."
      );
    },
  });

  const update = (field: keyof FounderForm, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    completeBootstrap.mutate({
      legalName: form.legalName,
      nationalId: form.nationalId,
      phone: form.phone || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-sm font-semibold text-blue-800 hover:underline"
        >
          العودة إلى COME IN IT
        </Link>
        <Card className="mt-5 border-slate-200 shadow-sm">
          <CardHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-cyan-300">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">تأسيس حساب المؤسس</CardTitle>
            <CardDescription className="leading-7">
              هذه الخطوة مخصصة لحساب المالك المضبوط على الخادم، وتُنشئ سجل
              المؤسس والشخص المرتبط به قبل فتح التسجيل العام.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status.isLoading || loading ? (
              <p className="text-sm text-slate-600">
                جارٍ التحقق من حالة التأسيس…
              </p>
            ) : status.isError ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
                تعذر التحقق من قاعدة الاختبار أو من ترحيلها. لا يمكن تأكيد حالة
                التأسيس، وتبقى التسجيلات العامة مغلقة حتى يتأكد الخادم من السجل.
              </div>
            ) : status.data?.setupComplete ? (
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm leading-7 text-emerald-950">
                اكتمل التأسيس والتسجيل العام مفتوح. إعفاء KYC الممنوح للمؤسس
                يقتصر على الإعداد الأولي، ولا يغيّر حالة KYC إلى موثّق ولا يسمح
                بالمعاملات التي تتطلب KYC موثقًا.
              </div>
            ) : !isAuthenticated ? (
              <div className="space-y-4">
                <p className="text-sm leading-7 text-slate-700">
                  سجّل الدخول أولًا بحساب المالك المضبوط مسبقًا. لن يُنشأ حساب
                  مؤسس من حساب مستخدم عادي.
                </p>
                <Button onClick={startLogin}>تسجيل الدخول عبر OAuth</Button>
              </div>
            ) : !status.data?.canBootstrap || user?.role !== "owner" ? (
              <div className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm leading-7 text-rose-950">
                هذا الحساب غير مخوّل لبدء تأسيس المؤسس. لا يمكن ترقية حساب عادي
                من هذه الصفحة.
              </div>
            ) : (
              <>
                <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm leading-7 text-blue-950">
                  تُشفّر بيانات التواصل قبل حفظها، ولا يُحفظ الرقم القومي بصيغته
                  الأصلية. الحقول الاختيارية غير المدخلة تبقى فارغة. تسجيل
                  الدخول الحالي عبر OAuth؛ لا تُنشئ المنصة كلمة مرور محلية.
                </div>
                <form className="space-y-4" onSubmit={submit}>
                  <label className="block space-y-1.5 text-sm font-medium">
                    <span>الاسم الرسمي</span>
                    <Input
                      required
                      autoComplete="name"
                      maxLength={255}
                      value={form.legalName}
                      onChange={event =>
                        update("legalName", event.target.value)
                      }
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm font-medium">
                    <span>الرقم القومي</span>
                    <Input
                      required
                      type="password"
                      inputMode="numeric"
                      autoComplete="off"
                      minLength={6}
                      maxLength={32}
                      value={form.nationalId}
                      onChange={event =>
                        update(
                          "nationalId",
                          event.target.value
                            .replace(/[٠-٩۰-۹]/g, digit => {
                              const codePoint = digit.charCodeAt(0);
                              return String(
                                codePoint >= 0x06f0
                                  ? codePoint - 0x06f0
                                  : codePoint - 0x0660
                              );
                            })
                            .replace(/\D/g, "")
                        )
                      }
                    />
                    <span className="block text-xs font-normal text-slate-500">
                      يُستخدم لمطابقة الحسابات فقط، ويُحوّل إلى HMAC ولا يُخزن
                      كنص.
                    </span>
                  </label>
                  <label className="block space-y-1.5 text-sm font-medium">
                    <span>
                      رقم الهاتف{" "}
                      <span className="font-normal text-slate-500">
                        (اختياري)
                      </span>
                    </span>
                    <Input
                      type="tel"
                      autoComplete="tel"
                      maxLength={32}
                      value={form.phone}
                      onChange={event => update("phone", event.target.value)}
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm font-medium">
                    <span>
                      البريد الإلكتروني{" "}
                      <span className="font-normal text-slate-500">
                        (اختياري)
                      </span>
                    </span>
                    <Input
                      type="email"
                      autoComplete="email"
                      maxLength={320}
                      value={form.email}
                      onChange={event => update("email", event.target.value)}
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm font-medium">
                    <span>
                      العنوان{" "}
                      <span className="font-normal text-slate-500">
                        (اختياري)
                      </span>
                    </span>
                    <Textarea
                      maxLength={500}
                      value={form.address}
                      onChange={event => update("address", event.target.value)}
                    />
                  </label>
                  <p className="text-xs leading-6 text-slate-600">
                    إتمام هذه الخطوة لا يعني اجتياز KYC. تبقى حالة التحقق غير
                    موثّقة، وتظل القيود القانونية والتجارية كما هي.
                  </p>
                  <Button
                    type="submit"
                    disabled={completeBootstrap.isPending}
                    className="w-full"
                  >
                    {completeBootstrap.isPending
                      ? "جارٍ حفظ التأسيس بأمان…"
                      : "إكمال تأسيس حساب المؤسس"}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
