# Angkor Tech — ហាងលក់កុំព្យូទ័រ (Angular SSR)

គម្រោងគំរូហាងលក់កុំព្យូទ័រ ដែលប្រើ **Angular 21 + Server-Side Rendering (SSR)** និង **Express.js** ជា backend API។

## មុខងារ (FrontEnd)

| # | ទំព័រ | URL | ពិពណ៌នា |
|---|------|-----|---------|
| 1 | Catalog / Home | `/` | បង្ហាញផលិតផលទាំង ១០, filter តាមប្រភេទ, ស្វែងរក, តម្រៀបតាមតម្លៃ (`/?category=laptop&q=asus&sort=price-asc`) |
| 2 | Detail | `/product/:slug` | ព័ត៌មានលម្អិត, specs, ជ្រើសចំនួន, ផលិតផលពាក់ព័ន្ធ |
| 3 | Add to cart | ប៊ូតុង "Add to cart" / "Buy now" | បន្ថែមចូលកន្ត្រក, badge លើ header, toast notification |
| 4 | Cart list | `/cart` | កែចំនួន, លុប, Subtotal + VAT 10% + Shipping |
| 5 | Checkout | `/checkout` | Form អតិថិជន (មាន validation) + វិធីបង់ប្រាក់ (COD / ABA KHQR / Bank transfer) |
| 6 | Invoice | `/invoice/:id` | វិក្កយបត្រ + Print + **Download .html** (`/api/orders/:id/invoice.html`) |

## SSR ដំណើរការយ៉ាងដូចម្តេចក្នុងគម្រោងនេះ

- **គ្រប់ទំព័រ render នៅលើ server** (`src/app/app.routes.server.ts` → `RenderMode.Server`)។ សាកល្បង៖ `curl http://localhost:4000/product/asus-rog-strix-g16` នឹងឃើញ HTML ពេញលេញ មានឈ្មោះ តម្លៃ specs រួចជាស្រេច។
- **កន្ត្រក (cart) រក្សាទុកក្នុង cookie** មិនមែន localStorage ទេ ព្រោះ server អាចអាន cookie បាន ដូច្នេះទំព័រ `/cart` និង badge ត្រូវតាំងពី HTML ដំបូង (`src/app/core/cart.service.ts` ប្រើ `REQUEST` token)។
- **HTTP Transfer Cache**: API ដែល server ហៅពេល render ត្រូវបានផ្ញើទៅ browser ក្នុង `<script id="ng-state">` ដូច្នេះ browser មិនហៅ API ម្តងទៀតទេ។
- **Hydration + Event Replay**: browser ប្រើ HTML ពី server ឡើងវិញ (មិន render ពីសូន្យ) ហើយការចុចមុន JS load រួចក៏នៅតែដំណើរការ។
- **SEO**: `<title>` និង `<meta description>` ផ្លាស់ប្តូរតាមផលិតផលនីមួយៗ, ទំព័រមិនមាន → HTTP status **404** ពិតប្រាកដ (`RESPONSE_INIT`)។
- **សុវត្ថិភាព**: server គណនាតម្លៃ និងពិនិត្យស្តុកឡើងវិញពេលបង្កើត order (មិនជឿតម្លៃពី browser)។

## រចនាសម្ព័ន្ធ

```
src/
├── server.ts                  # Express server (SSR + /api)
├── server/
│   ├── api.ts                 # REST API: products, orders, invoice.html
│   ├── order-store.ts         # រក្សាទុក order ក្នុង data/orders.json
│   └── invoice-html.ts        # បង្កើតឯកសារ invoice .html
└── app/
    ├── shared/
    │   ├── products.data.ts   # ទិន្នន័យគំរូ ១០ ផលិតផល
    │   ├── models.ts          # Types (Product, Order, ...)
    │   └── pricing.ts         # VAT, shipping (ប្រើទាំង browser និង server)
    ├── core/                  # Services: product, cart (cookie), order, toast
    ├── components/            # product-card, device-art (រូប SVG)
    └── pages/                 # catalog, product-detail, cart, checkout, invoice, not-found
```

## API

| Method | URL | ពិពណ៌នា |
|--------|-----|---------|
| GET | `/api/products?category=&q=&sort=&ids=` | បញ្ជីផលិតផល |
| GET | `/api/products/:slug` | ផលិតផលមួយ |
| POST | `/api/orders` | បង្កើត order → `INV-YYYYMMDD-0001` |
| GET | `/api/orders/:id` | ទាញ order |
| GET | `/api/orders/:id/invoice.html` | Invoice ជា .html (`?download=1` ដើម្បីទាញយក) |

## របៀប Run

ត្រូវការ **Node.js 20.19+ ឬ 22.12+**។

```bash
npm install

# Development (មាន SSR + hot reload) → http://localhost:4200
npm start

# Production
npm run build
npm run serve:ssr        # → http://localhost:4000
```

### Deploy លើ domain ពិត (ឧ. EC2)

Angular 21 ទទួលតែ host ដែលបានអនុញ្ញាតប៉ុណ្ណោះ (ការពារ SSRF)។ បើមិនបានកំណត់ វានឹងធ្លាក់ទៅ CSR វិញ។ កំណត់ domain របស់អ្នក៖

```bash
NG_ALLOWED_HOSTS=myshop.com,www.myshop.com PORT=4000 node dist/computer-shop/server/server.mjs
```

ឬបន្ថែមក្នុង `angular.json` → `architect.build.options.security.allowedHosts`។

## អាចពង្រីកបន្ត

- ប្តូរ `products.data.ts` និង `order-store.ts` ទៅ MySQL / PostgreSQL / MongoDB
- ភ្ជាប់ ABA PayWay / Bakong KHQR ពិតប្រាកដ សម្រាប់ payment
- បន្ថែម Admin page គ្រប់គ្រងផលិតផល និង order
- ដាក់រូបភាពផលិតផលពិត ជំនួស `device-art` (SVG)
