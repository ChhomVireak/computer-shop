# Angkor Tech — ហាងលក់កុំព្យូទ័រ (Angular SSR)

## របៀប Run

ត្រូវការ **Node.js 20.19+ ឬ 22.12+**។

```bash
npm install

# Development (មាន SSR + hot reload) → http://localhost:4200
npm run dev

# Production Build & Run
npm run build
npm start                 # ដំណើរការ SSR server → http://0.0.0.0:4000
```
### Deploy លើ domain ពិត (ឧ. EC2 / VPS / PM2 / Docker)

1. **តាមរយៈ PM2:**
```bash
npm run build
pm2 start ecosystem.config.cjs
```

2. **តាមរយៈ Docker:**
```bash
docker build -t computer-shop .
docker run -p 4000:4000 -e NG_ALLOWED_HOSTS=computer-shop.duckdns.org computer-shop
```

3. **Domain & Host Security:**
Angular 21 ទទួលតែ host ដែលបានអនុញ្ញាតប៉ុណ្ណោះ (ការពារ SSRF)។ កំណត់ domain របស់អ្នកតាមរយៈ `NG_ALLOWED_HOSTS`:
```bash
NG_ALLOWED_HOSTS=myshop.com,www.myshop.com PORT=4000 npm start
```
ឬបន្ថែមក្នុង [angular.json](file:///Users/chhomvireak/Desktop/computer-shop/angular.json) → `architect.build.options.security.allowedHosts`។

## អាចពង្រីកបន្ត

- ប្តូរ `products.data.ts` និង `order-store.ts` ទៅ MySQL / PostgreSQL / MongoDB
- ភ្ជាប់ ABA PayWay / Bakong KHQR ពិតប្រាកដ សម្រាប់ payment
- បន្ថែម Admin page គ្រប់គ្រងផលិតផល និង order
- ដាក់រូបភាពផលិតផលពិត ជំនួស `device-art` (SVG)
