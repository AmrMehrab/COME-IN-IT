# COME-IN-IT

البنية الرقمية للتسويق الصناعي والتكامل التجاري، لربط المصنّعين مباشرةً بالمتاجر وتقليل الاعتماد على الوسطاء.

## الحالة

المستودع يحتوي على واجهة React، خادم Express/tRPC، مخطط Drizzle/MySQL، مهاجرات، واختبارات وحدة وتكامل. نطاق Healthcare والمحاكاة يظل تجريبيًا ومشروطًا كما هو موثق في سجلات الفجوات؛ لا يُفهم وجود الاختبارات أو الواجهة على أنه اعتماد تنظيمي أو جاهزية إنتاجية نهائية.

## المتطلبات

- Node.js 22 أو أحدث.
- pnpm 10.4.1، وفق `packageManager`.
- MySQL 8 عند تشغيل اختبارات التكامل أو أوامر Drizzle.

## التشغيل المحلي

```bash
pnpm install --frozen-lockfile
cp .env.example .env
# عدّل DATABASE_URL وJWT_SECRET عند الحاجة
docker compose -f docker-compose.test.yml up -d
pnpm db:push
pnpm dev
```

تعمل الواجهة في وضع التطوير من خلال Vite، ويشغّل الخادم من `server/_core/index.ts`.

## بوابات الجودة

```bash
pnpm check       # TypeScript
pnpm test        # اختبارات الوحدة والتكامل
pnpm test:unit   # اختبارات لا تحتاج قاعدة بيانات
pnpm test:integration # اختبارات التكامل مع MySQL
pnpm build       # حزمة الإنتاج
```

اختبارات التكامل تحتاج قاعدة MySQL متاحة عبر `DATABASE_URL`. إذا لم توجد قاعدة بيانات، ستفشل اختبارات التكامل عمدًا بدل إعطاء نتيجة نجاح مضللة.

## قاعدة البيانات

المخطط في `drizzle/schema.ts` والمهاجرات في `drizzle/migrations/`. الأمر التالي يولّد/يطبّق مخطط قاعدة البيانات على قاعدة التطوير المحددة في `DATABASE_URL`:

```bash
pnpm db:push
```

لا تضع كلمات المرور أو مفاتيح الإنتاج في Git. استخدم `.env` محليًا أو Secrets في CI/النشر؛ ملف `.env.example` يحتوي قيمًا محلية غير سرية فقط.

بعد الانتهاء من الاختبارات المحلية، أوقف قاعدة البيانات المؤقتة بالأمر:

```bash
docker compose -f docker-compose.test.yml down -v
```

## GitHub Actions

يعمل Workflow في `.github/workflows/ci.yml` على كل Pull Request وعلى كل دفع إلى `main`، ويقوم بـ:

1. تثبيت Node وpnpm والاعتماديات بقفل `pnpm-lock.yaml`.
2. تشغيل MySQL 8 كخدمة مؤقتة.
3. تطبيق مخطط Drizzle.
4. تشغيل TypeScript check والاختبارات والبناء.

## التوثيق

ملفات المواصفات والـERD وسجلات الفجوات موجودة في جذر المستودع. المرجع التنفيذي الأساسي هو `COME_IN_IT_Master_Specification_2026.md`، مع الرجوع إلى `09_COME_IN_IT_V1_0_GAP_REGISTER.md` و`COME_IN_IT_HEALTH_GAP_REGISTER.md` للقيود المفتوحة.
