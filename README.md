# پورتفولیو — راه‌اندازی اولیه

## ۱. آپلود به گیت‌هاب

همه‌ی این فایل‌ها را (با همین ساختار فولدرها) داخل مخزن (repo) خودتان
push کنید:

```
index.html
projects.json          ← این فایل نمونه است؛ CI هر بار خودش تازه می‌سازدش، لازم نیست نگرانش باشید
projects/
  ...
categories.json
package.json
scripts/build-manifest.mjs
.github/workflows/deploy.yml
```

## ۲. یک‌بار برای همیشه: تنظیم GitHub Pages

1. داخل مخزن‌تان بروید به **Settings → Pages**
2. زیر «Build and deployment» → «Source» را از حالت «Deploy from a
   branch» بزنید روی **GitHub Actions**
3. همین. دیگر لازم نیست دستی چیزی فعال کنید.

## ۳. از این به بعد

هر وقت خواستید پروژه اضافه کنید، فقط طبق راهنمای
[`projects/README.md`](./projects/README.md) یک فولدر جدید بسازید و
push کنید. حدود یکی-دو دقیقه بعد، Action خودش می‌سازد و منتشر می‌کند —
می‌توانید پیشرفتش را در تب **Actions** مخزن ببینید.

آدرس سایت‌تان بعد از اولین اجرای موفق Action، همان‌جا (تب Pages در
Settings، یا خروجی Action) نمایش داده می‌شود — معمولاً چیزی شبیه:
`https://USERNAME.github.io/REPO-NAME/`

## نکات فنی

- `index.html` دیگر پروژه‌ها را هاردکد ندارد؛ موقع باز شدن، فایل
  `projects.json` را می‌خواند (که خروجی خودکار اسکریپت
  `scripts/build-manifest.mjs` است).
- برای پیش‌نمایش محلی قبل از push، می‌توانید این را اجرا کنید:
  ```bash
  npm install
  node scripts/build-manifest.mjs
  npx serve .
  ```
  (باز کردن مستقیم `index.html` با دابل‌کلیک کار نمی‌کند، چون مرورگرها
  fetch را روی فایل‌های local:// محدود می‌کنند — باید از یک سرور محلی
  ساده مثل `npx serve` استفاده کنید.)
