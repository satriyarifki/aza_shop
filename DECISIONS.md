<!--
  DRAF: disusun bersama AI berdasarkan pekerjaan yang benar-benar dilakukan.
  Tulis ulang dengan kata-kata Anda sendiri sebelum dikumpulkan, lalu hapus komentar ini.
-->

# Keputusan Teknis

## a. Bagaimana mencegah stok minus saat dua order masuk bersamaan?

Semua langkah pembuatan order berjalan di dalam satu transaksi database, di `createOrder()` (`backend/src/modules/orders/order.service.ts`):

1. **Row lock sebelum mengecek stok.** Baris produk yang dipesan dikunci dengan `SELECT ... FOR UPDATE`. Kalau dua transaksi memesan produk yang sama, transaksi kedua harus menunggu sampai transaksi pertama commit atau rollback, lalu membaca stok yang sudah diperbarui. Jadi pengecekan "stok cukup?" selalu memakai angka terbaru.
2. **Urutan penguncian konsisten.** Produk dikunci berurutan dari ID terkecil (`.orderBy(asc(products.id)).for("update")`). Kalau order A berisi produk 1,2 dan order B berisi 2,1, keduanya tetap mengunci produk 1 lebih dulu, jadi tidak terjadi deadlock. Cancel memakai urutan yang sama.
3. **Pengaman kedua di query update.** Stok dikurangi dengan `UPDATE products SET stock = stock - qty WHERE id = ? AND stock >= qty`. Kalau tidak ada baris yang ter-update, transaksi dibatalkan.
4. **Pengaman terakhir di database.** Ada constraint `CHECK (stock >= 0)` pada tabel `products` (`backend/src/db/schema/products.ts`).

Kalau satu item saja gagal, misalnya stoknya kurang, seluruh transaksi di-rollback. Order, item, stok, dan counter invoice kembali seperti semula.

Ini sudah dibuktikan dengan test `never oversells when orders arrive at the same time` di `backend/tests/orders.test.ts`: 6 order bersamaan untuk produk dengan stok 2 menghasilkan tepat 2 sukses dan 4 ditolak (422), dengan stok akhir 0. Saat pengembangan, saya juga mencoba 12 order bersamaan untuk stok 5, dan 20 order bersamaan dengan urutan produk terbalik. Hasilnya tidak pernah oversell dan tidak ada deadlock.

Cancel memakai pola yang sama (`cancelOrder()`). Baris order dikunci dulu, lalu statusnya dicek. Jadi kalau ada beberapa request cancel bersamaan, hanya satu yang berhasil mengembalikan stok, dan sisanya mendapat 409. Ini dicek oleh test `does not restore stock twice when cancelled repeatedly or concurrently`.

## b. Mengapa struktur folder dan lapisannya seperti ini, dan apa yang diubah jika aplikasi membesar?

Strukturnya **modular berlapis**. Setiap domain (`auth`, `products`, `customers`, `orders`) punya folder sendiri di `backend/src/modules/`, berisi:

- `*.route.ts`: urusan HTTP saja, yaitu validasi input dengan Zod, memanggil service, dan memetakan hasilnya ke format response (snake_case, uang sebagai string).
- `*.service.ts`: aturan bisnis dan query Drizzle, termasuk transaksi. Service tidak tahu soal HTTP; kalau ada aturan yang dilanggar, service melempar `AppError`.
- `*.schema.ts`: schema Zod untuk request.

Hal yang dipakai lintas modul ada di `middlewares/` (auth, validasi, error handler terpusat) dan `utils/` (response, pagination, tanggal, nomor invoice).

Alasannya: ukuran aplikasi ini kecil, jadi lapisan tambahan seperti repository, DI container, atau DTO class hanya menambah file tanpa manfaat nyata. Dengan struktur ini, satu fitur bisa dibaca dari route ke service dalam dua file. Logika bisnis juga terpisah dari HTTP, sehingga bisa dites langsung, misalnya `calculateDiscount()`.

Frontend (`frontend/`) memakai prinsip yang sama:

- Semua request lewat satu fungsi, `apiRequest()` (`frontend/utils/api.ts`), yang menambahkan token, membaca `NUXT_PUBLIC_API_BASE`, dan mengubah semua error menjadi `ApiError`. Jika server mengembalikan 401, session dihapus dan pengguna diarahkan ke halaman login.
- Setiap resource punya composable tipis (`useProducts`, `useCustomers`, `useOrders`).
- Schema Zod untuk form ada di `frontend/schemas/`, supaya bisa dites tanpa membuka halaman.
- Pinia hanya dipakai untuk auth (`stores/auth.ts`). Data halaman cukup disimpan dengan `ref()` di halamannya sendiri, karena tidak dibagi ke halaman lain.
- Komponen `Base*` hanya dibuat untuk hal yang dipakai di beberapa halaman: tombol, input, select, modal, tabel, pagination, dan alert.

Jika aplikasi membesar, yang akan saya ubah:

- Menambah lapisan repository atau query module kalau query yang sama mulai dipakai banyak service, atau kalau perlu mengganti sumber data saat test.
- Memecah `order.service.ts` menjadi beberapa use case, misalnya `create-order.ts` dan `cancel-order.ts`, kalau alurnya bertambah (pembayaran parsial, retur, dan sebagainya).
- Menambah role selain ADMIN beserta middleware otorisasi per endpoint.
- Menambah idempotency key untuk `POST /api/orders`, refresh token, rate limiting di login, logging terstruktur, dan Docker Compose.
- Menyimpan snapshot nama produk di `order_items` kalau riwayat order harus benar-benar tidak berubah.

## c. Satu bug yang ditemui dan cara menemukannya

**Field tidak dikenal dilaporkan dengan `"field": ""`.** Body request memakai Zod `.strict()` supaya field tambahan ditolak. Saat saya menguji login dengan field tambahan `role`, request-nya memang ditolak 400, tapi error-nya berbunyi `{"field": "", "message": "Unrecognized key: \"role\""}`. Frontend tidak bisa menempelkan pesan itu ke input mana pun.

Cara menemukan: saya menjalankan sederet request langsung ke aplikasi (sukses, password salah, body kosong, field tambahan, JSON rusak) dan membaca setiap response-nya. Hanya kasus field tambahan yang `field`-nya kosong.

Penyebab: di Zod 4, issue `unrecognized_keys` dilaporkan pada objek induknya (`path: []`), sedangkan nama field-nya ada di `issue.keys`.

Perbaikan: `errorHandler` di `backend/src/middlewares/error.middleware.ts` sekarang memecah `issue.keys` menjadi satu error per field, misalnya `{"field": "role", "message": "Unknown field"}`. Hasilnya bisa dilihat di test `rejects invalid fields` (`backend/tests/products.test.ts`), yang mengharapkan field `color` muncul di daftar error.

Bug lain di frontend: `nuxt typecheck` awalnya selalu bersih, lalu tiba-tiba melaporkan `Parameter 'product' implicitly has an 'any' type` pada callback `ref` dan `watch` di `pages/orders/create.vue`. Ternyata pnpm hanya memasang `vue` sebagai dependency milik `nuxt`, tidak di root `node_modules` project. Akibatnya tipe auto-import Nuxt (`typeof import('vue')`) diam-diam menjadi `any`, dan typecheck sebelumnya tidak benar-benar memeriksa kode Vue. Perbaikannya: menambahkan `vue` dan `vue-router` sebagai dependency langsung di `frontend/package.json`, sama seperti template resmi Nuxt.

Bug lain yang juga muncul: test `/api/auth/me` sempat gagal dengan `Cannot read properties of null (reading 'address')` dari dalam supertest. Setelah membaca `node_modules/supertest/lib/test.js`, ternyata supertest memakai satu server bersama dan menutupnya begitu tidak ada request yang tersisa. Dalam `api.get(...).set(..., await loginAsAdmin())`, request luar sudah dibuat sebelum login selesai, lalu kehilangan servernya. Perbaikannya: ambil token dulu, baru buat request-nya.

## d. Bagian yang belum selesai atau masih lemah, dan langkah selanjutnya

- **Pilihan customer dan produk di form order** hanya memuat 100 data pertama (batas `limit` API). Untuk katalog yang lebih besar, dropdown perlu diganti dengan pencarian yang memanggil API saat pengguna mengetik.
- **Token disimpan di `localStorage`.** Ini sederhana, tapi token bisa dicuri jika ada celah XSS. Untuk produksi, cookie `httpOnly` lebih aman. Frontend tidak memakai `v-html`, untuk menekan risiko itu.
- **Test frontend** baru mencakup logika (validasi, diskon, format uang, auth store). Belum ada test komponen atau end-to-end di browser. Alur lengkapnya sudah dicek manual di browser.
- **CORS** hanya mengizinkan origin di `CORS_ORIGIN`. Kalau frontend di-deploy ke domain lain, variabel ini wajib diubah.
- **Order di hari yang sama mengantre di satu baris `invoice_sequences`.** Untuk volume tes ini tidak masalah, tapi di trafik tinggi baris itu menjadi titik antrean. Alternatifnya adalah sequence per hari, atau nomor yang tidak harus berurutan tanpa celah.
- **`product_name` di detail order** mengikuti nama produk saat ini. Yang di-snapshot hanya harga, sesuai spesifikasi.
- **Belum ada:** rate limiting untuk login, refresh token atau logout (token berlaku sampai kedaluwarsa), endpoint ubah atau hapus customer, idempotency key, dan Docker Compose (di luar cakupan wajib untuk pengalaman di bawah 5 tahun).
- **Test** berjalan berurutan di satu database test, dan tabel dikosongkan sebelum setiap test. Cara ini sederhana dan andal, tapi akan lambat kalau jumlah test bertambah banyak. Selain itu, folder `tests/` belum ikut dicek oleh `npm run typecheck`.

## Keputusan teknis lainnya

- **BIGINT untuk uang.** Semua kolom uang memakai `bigint` di PostgreSQL dengan `mode: "bigint"` di Drizzle, dan dihitung dengan BigInt di TypeScript. Tidak ada float maupun `parseFloat`. Di API, nilai uang dikirim dan diterima sebagai string bilangan bulat Rupiah, supaya nilai besar tidak kehilangan presisi di JSON. Ini dites dengan harga `"9223372036854775807"`.
- **Diskon dan pembulatan.** Variant A: 0% di bawah Rp500.000, 5% mulai Rp500.000, 10% mulai Rp1.000.000, dengan maksimal Rp150.000 (`calculateDiscount()`). Pembagian BigInt membuang pecahan, jadi diskon selalu dibulatkan ke bawah ke Rupiah penuh. Contoh: subtotal 999.999 menghasilkan diskon 49.999 (bukan 49.999,95). Nilai `subtotal`, `discount_amount`, dan `grand_total` disimpan di order, dan konsistensinya dijaga constraint `grand_total = subtotal - discount_amount`.
- **Transaksi.** Membuat order, cancel (mengubah status sekaligus mengembalikan stok), dan pay masing-masing berjalan dalam satu `db.transaction`. Semua query di dalamnya memakai objek `tx`. Error tidak ditangkap di dalam transaksi, jadi Drizzle otomatis melakukan rollback.
- **Nomor invoice.** Formatnya `INV-YYYYMMDD-XXXX`, dengan tanggal menurut Asia/Jakarta (`toBusinessDate()` di `src/utils/date.ts`). Counter per tanggal disimpan di tabel `invoice_sequences` dan dinaikkan dengan satu perintah `INSERT ... ON CONFLICT DO UPDATE SET last_number = last_number + 1 RETURNING`. Perintah ini atomik dan mengunci baris counter sampai transaksi order selesai, jadi tidak ada pola "baca nomor terakhir lalu tambah satu". Kalau order gagal, kenaikan counter ikut di-rollback, sehingga nomornya tidak berlubang. Uji 30 transaksi bersamaan menghasilkan nomor 0001–0030 tanpa duplikat. Kalau dalam sehari ada lebih dari 9.999 order, bagian nomornya otomatis menjadi 5 digit.
- **Snapshot harga.** `order_items.unit_price` diisi dari harga produk saat order dibuat, dan `subtotal` item dijaga constraint `subtotal = unit_price * quantity`. Mengubah harga produk tidak mengubah order lama (test `keeps the price snapshot when the product price changes later`).
- **Transisi status.** Aturannya ada di satu tabel, `allowedStatusTransitions` (`order.types.ts`): PENDING ke PAID atau CANCELLED, PAID ke CANCELLED, dan CANCELLED tidak bisa ke mana pun. Transisi lain mengembalikan 409. Baris order dikunci sebelum status dicek, supaya request yang bersamaan tidak saling menimpa.
- **Zona waktu.** Database menyimpan `TIMESTAMPTZ` dalam UTC. Filter `start_date` dan `end_date` dibaca sebagai hari kalender Asia/Jakarta, lalu diubah menjadi rentang UTC `>= awal start_date` dan `< awal hari setelah end_date`, tanpa memakai batas `23:59:59.999`.
- **Error terpusat.** Semua error ditangani `app.onError()`: `AppError` sesuai status-nya, Zod menjadi 400, pelanggaran unique menjadi 409, pelanggaran CHECK menjadi 422, dan selain itu menjadi 500 dengan pesan umum. Error 500 dicatat di server, sedangkan detail SQL tidak pernah dikirim ke client.
