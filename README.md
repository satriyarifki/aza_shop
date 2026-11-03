# Shop Management App

Aplikasi admin untuk mengelola produk, customer, dan order, dengan autentikasi JWT, transaksi stok yang aman terhadap order bersamaan, dan diskon Variant A.

```
.
├── backend/    # REST API: Hono + TypeScript + PostgreSQL (Drizzle ORM)
├── frontend/   # Dashboard admin: Nuxt 3 (SPA) + Vue 3 + Tailwind CSS
├── scripts/    # dev.mjs: menjalankan backend dan frontend bersamaan
└── package.json  # script setup / dev / test untuk seluruh repo
```

## Tech stack

| Bagian | Backend | Frontend |
|---|---|---|
| Bahasa | TypeScript (strict), Node.js 20+ | TypeScript (strict) |
| Framework | Hono (`@hono/node-server`) | Nuxt 3 mode SPA (`ssr: false`), Vue 3 |
| Data / state | PostgreSQL, Drizzle ORM + Drizzle Kit | Pinia (hanya untuk auth) |
| Auth | JWT HS256 (`jose`), `bcrypt` | Bearer token di `localStorage` |
| Validasi | Zod + `@hono/zod-validator` | Zod |
| Styling | — | Tailwind CSS v4, tanpa UI library |
| Test | Vitest + Supertest | Vitest |
| Package manager | npm | pnpm (otomatis lewat `corepack`) |

## Prasyarat

- Node.js 20 atau lebih baru. `corepack` sudah termasuk di Node, jadi pnpm tidak perlu dipasang terpisah.
- PostgreSQL 14+ yang sedang berjalan, dan user yang boleh membuat database (misalnya `postgres`).

## Setup: dari `git clone` sampai aplikasi berjalan

```bash
git clone <url-repo> shop-app && cd shop-app
cp backend/.env.example backend/.env
npm run setup
npm run dev
```

Sebelum `npm run setup`, ubah `DATABASE_URL` di `backend/.env` sesuai user, password, dan port PostgreSQL Anda, lalu isi `JWT_SECRET` dengan string acak minimal 32 karakter.

- `npm run setup` memasang dependency backend, membuat database jika belum ada, menjalankan migrasi dan seeder, lalu memasang dependency frontend. Perintah ini aman dijalankan ulang. Kalau corepack bertanya apakah boleh mengunduh pnpm, jawab `Y`.
- `npm run dev` menjalankan backend dan frontend sekaligus (berhenti dengan Ctrl+C):
  - Frontend: **http://localhost:3001**
  - API: http://localhost:3000 (cek: `GET /health`)

Frontend membaca URL API dari `NUXT_PUBLIC_API_BASE` (default `http://localhost:3000/api`; lihat `frontend/.env.example`). Backend hanya menerima request browser dari origin di `CORS_ORIGIN` (default `http://localhost:3001`).

### Akun login seeder (khusus development)

| Email | Password | Role |
|---|---|---|
| `admin@example.com` | `admin123` | ADMIN |

Seeder juga membuat 15 produk dan 10 customer. Seeder menolak berjalan jika `NODE_ENV=production`.

## Fitur frontend

| Halaman | Isi |
|---|---|
| `/login` | Login dengan validasi form dan pesan error dari server |
| `/` | Ringkasan jumlah produk, customer, order, dan order pending, plus 5 order terbaru |
| `/products` | Tabel produk dengan pencarian (kode atau nama), pagination, tambah dan edit produk, penanda stok rendah atau habis |
| `/customers` | Daftar customer dengan pencarian dan pagination, tambah customer |
| `/orders` | Daftar order dengan filter status dan rentang tanggal (WIB) serta pagination. Filter tersimpan di URL |
| `/orders/create` | Pilih customer dan produk, jumlah, stok tersedia, preview subtotal, diskon, dan total. Error stok tampil di baris produk yang bersangkutan |
| `/orders/:id` | Detail invoice, customer, item dengan harga snapshot, dan total. Tombol Pay atau Cancel (hanya yang valid untuk status saat ini) dengan dialog konfirmasi |

Perhitungan di frontend hanya preview. Harga, stok, diskon, dan total selalu dihitung ulang oleh backend, dan halaman detail menampilkan nilai final dari server.

## Menjalankan test

```bash
cp backend/.env.test.example backend/.env.test
npm test
```

`npm test` menjalankan test backend lalu test frontend.

- **Backend (47 test):** memakai database terpisah yang dibuat, dimigrasi, dan dikosongkan secara otomatis. Nama database test wajib diakhiri `_test`, supaya test tidak mungkin menghapus data development. `backend/.env.test` cukup berisi `DATABASE_URL` untuk database test (dan `BCRYPT_ROUNDS=4` agar cepat). Variabel lain diambil dari `backend/.env`. Cakupannya: login, akses tanpa token, CORS, validasi produk, kode produk duplikat, pencarian, customer, pembuatan order, stok tidak cukup, cancel mengembalikan stok, transisi status tidak valid (409), diskon Variant A, snapshot harga, order bersamaan, cancel berulang, dan filter tanggal.
- **Frontend (27 test):** tanpa database atau server. Cakupannya: preview diskon, format Rupiah (termasuk angka di atas `Number.MAX_SAFE_INTEGER`), validasi form login, produk, customer, dan order, serta perilaku auth store (login, gagal login, restore, logout).

Test bisa juga dijalankan per bagian: `npm test` di `backend/`, atau `corepack pnpm test` di `frontend/`.

## Script npm (`backend/`)

| Script | Fungsi |
|---|---|
| `npm run dev` | Server development dengan auto-reload |
| `npm run build` / `npm start` | Compile ke `dist/` lalu jalankan |
| `npm run typecheck` | Cek tipe TypeScript |
| `npm run db:setup` | Buat database jika belum ada + migrasi + seeder |
| `npm run db:generate` | Generate migrasi baru dari perubahan schema |
| `npm run db:migrate` | Jalankan migrasi dengan Drizzle Kit |
| `npm run db:seed` | Jalankan seeder saja |
| `npm test` | Jalankan semua test |

## Endpoint API

Semua endpoint kecuali login membutuhkan header `Authorization: Bearer <token>`.

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/auth/login` | Login, mengembalikan `access_token` (berlaku 8 jam) |
| GET | `/api/auth/me` | User yang sedang login |
| GET | `/api/products?page=&limit=&search=` | Daftar produk; `search` mencocokkan kode atau nama (ILIKE) |
| POST | `/api/products` | Buat produk |
| PUT | `/api/products/:id` | Ubah produk |
| GET | `/api/customers?page=&limit=&search=` | Daftar customer; `search` mencocokkan nama, email, atau telepon |
| POST | `/api/customers` | Buat customer |
| GET | `/api/orders?page=&limit=&status=&start_date=&end_date=` | Daftar order; tanggal `YYYY-MM-DD` menurut Asia/Jakarta |
| GET | `/api/orders/:id` | Detail order beserta item |
| POST | `/api/orders` | Buat order |
| PATCH | `/api/orders/:id/pay` | PENDING → PAID |
| PATCH | `/api/orders/:id/cancel` | PENDING/PAID → CANCELLED, stok dikembalikan |

Contoh body:

```jsonc
// POST /api/products — harga dikirim sebagai string bilangan bulat (Rupiah)
{ "product_code": "PRD016", "name": "USB Microphone", "price": "650000", "stock": 10 }

// POST /api/orders — client hanya mengirim customer, produk, dan jumlah
{ "customer_id": 1, "items": [{ "product_id": 1, "quantity": 2 }, { "product_id": 3, "quantity": 1 }] }
```

Format response:

```jsonc
{ "success": true, "message": "...", "data": { } }                    // sukses
{ "success": true, "message": "...", "data": [], "pagination": { "page": 1, "limit": 10, "total": 35, "total_pages": 4 } }
{ "success": false, "message": "Validation failed", "errors": [{ "field": "email", "message": "Invalid email address" }] }
```

Nilai uang (`price`, `subtotal`, `discount_amount`, `grand_total`, `unit_price`) selalu berupa string, dan waktu memakai ISO 8601 UTC.

Kode status: 400 input tidak valid, 401 belum login atau token tidak valid, 404 data tidak ada, 409 konflik (kode produk duplikat, transisi status tidak valid), 422 aturan bisnis (stok tidak cukup, produk atau customer tidak ditemukan).

## Alur `POST /api/orders`: dari route sampai database

1. **Route:** `backend/src/modules/orders/order.route.ts`
   - `requireAuth` (`src/middlewares/auth.middleware.ts`) memverifikasi JWT dan menyimpan user ke context.
   - `validate("json", createOrderSchema)` (`order.schema.ts`) hanya menerima `customer_id` dan `items[{ product_id, quantity }]`. Field lain seperti harga atau total ditolak, dan produk duplikat juga ditolak (400).
2. **Service:** `createOrder()` di `order.service.ts` menjalankan semua langkah berikut dalam **satu transaksi** `db.transaction`:
   1. Memastikan customer ada (422 jika tidak).
   2. Mengunci baris produk dengan `SELECT ... FOR UPDATE`, **berurutan dari ID terkecil**, supaya order bersamaan untuk produk yang sama saling menunggu, bukan deadlock.
   3. Mengecek semua produk ada dan stoknya cukup (422 dengan pesan per item jika tidak).
   4. Mengambil harga dari baris produk yang sudah dikunci, lalu menghitung subtotal per item dan subtotal order dengan BigInt.
   5. Menghitung diskon Variant A dengan `calculateDiscount()` (`order.discount.ts`).
   6. Membuat nomor `INV-YYYYMMDD-XXXX` dengan `generateOrderNumber()` (`src/utils/order-number.ts`), yaitu upsert atomik ke tabel `invoice_sequences` per tanggal Asia/Jakarta.
   7. `INSERT` ke `orders`, lalu `INSERT` ke `order_items` beserta snapshot `unit_price`.
   8. `UPDATE products SET stock = stock - qty WHERE id = ? AND stock >= qty` sebagai pengaman kedua.
3. **Selesai:** jika salah satu langkah gagal, error dilempar dan seluruh transaksi di-rollback, termasuk counter invoice. Jika berhasil, transaksi di-commit dan order dibaca ulang dengan `getOrderById()`.
4. **Response:** `toOrderDetailResponse()` mengubah hasilnya ke format snake_case dengan uang sebagai string, lalu `sendSuccess()` mengirim HTTP 201. Error di langkah mana pun ditangani `errorHandler` (`src/middlewares/error.middleware.ts`) dengan format standar.

## Environment variables

| Variabel | Contoh | Keterangan |
|---|---|---|
| `NODE_ENV` | `development` | `development`, `test`, atau `production` |
| `PORT` | `3000` | Port HTTP |
| `DATABASE_URL` | `postgresql://postgres:password@localhost:5432/technical_test` | Koneksi PostgreSQL |
| `JWT_SECRET` | — | Minimal 32 karakter, jangan di-commit |
| `JWT_EXPIRES_IN` | `8h` | Masa berlaku token |
| `BCRYPT_ROUNDS` | `12` | Salt rounds bcrypt |
| `APP_TIMEZONE` | `Asia/Jakarta` | Zona waktu bisnis untuk nomor invoice dan filter tanggal |
| `CORS_ORIGIN` | `http://localhost:3001` | Origin frontend yang boleh memanggil API; bisa lebih dari satu, dipisah koma |
| `NUXT_PUBLIC_API_BASE` (frontend) | `http://localhost:3000/api` | URL API yang dipakai frontend |

Semua variabel divalidasi oleh Zod saat startup (`src/config/env.ts`), dan aplikasi berhenti jika ada yang tidak valid. File `.env` dan `.env.test` tidak di-commit. Yang di-commit hanya `.env.example` dan `.env.test.example`.

Keputusan teknis dijelaskan di [DECISIONS.md](DECISIONS.md), dan penggunaan AI dijelaskan di [AI_USAGE.md](AI_USAGE.md).
