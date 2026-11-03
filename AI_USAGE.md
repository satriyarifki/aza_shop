# Penggunaan AI

## Tools yang dipakai

| Tool | Model | Dipakai untuk |
|---|---|---|
| Claude Code (Claude desktop app, tab Code) | Claude Opus 5.5 | Membangun backend dan frontend langkah demi langkah, menjalankan pengecekan (termasuk di browser), dan menyusun draf dokumentasi |

## Dipakai untuk bagian apa

Backend dikerjakan bertahap mengikuti dokumen arahan `backend/be-writing-block.md`, yang berisi stack, arsitektur, aturan bisnis, dan urutan implementasi. Setiap langkah dikerjakan AI, diperiksa, lalu saya commit sendiri sebelum lanjut ke langkah berikutnya:

1. Inisialisasi project, TypeScript strict, validasi env, koneksi Drizzle.
2. Schema database, relasi, migrasi, dan seeder.
3. Format response standar dan error handler terpusat.
4. Autentikasi JWT dan middleware.
5. Modul products dan customers (validasi, pagination, pencarian).
6. Diskon Variant A dan nomor invoice yang aman terhadap concurrency.
7. Pembuatan order dengan transaksi dan row lock, pay/cancel, list/detail, dan filter tanggal.
8. Test Vitest + Supertest (47 test).
9. Draf README.md, DECISIONS.md, dan AI_USAGE.md.

Frontend mengikuti dokumen arahan terpisah, `frontend/fe-writing-block.md` (Nuxt 3 SPA, Pinia, Tailwind, Zod, struktur folder, halaman yang dibutuhkan). Dokumen ini saya simpan lokal dan tidak dimasukkan ke repo. Urutan pengerjaannya:

1. Setup Nuxt 3 mode SPA dengan Tailwind, Pinia, dan Zod, plus CORS di backend.
2. Util API terpusat, auth store, middleware route, dan halaman login.
3. Layout dashboard (sidebar dan header) dan halaman dashboard.
4. Halaman products, customers, daftar order, buat order, dan detail order (pay/cancel).
5. Test Vitest (27 test) dan script root `setup`/`dev`/`test`.

## Prompt utama (disalin apa adanya)

**1. Memulai backend**, dengan lampiran file `backend/be-writing-block.md` sebagai arahan utama:

```text
coba buat setup backend dengan mengikuti arahan file berikut
shop-be\be-writing-block.md
```

**2. Meminta pengerjaan bertahap supaya bisa di-commit satu per satu:**

```text
bisa buat progressnya secara berkala? jadi saya bisa commit satu2 prosesnya
```

**3. Menyesuaikan struktur repo dengan persyaratan tes:**

```text
maaf ternyata dalam satu folder Hono ini saya isi backend dan frontend, jadi secara git akan jadi satu. karena mengikuti perintah berikut

Repository GitHub publik berisi folder backend/ dan frontend/ . Commit dilakukan bertahap, minimal 8 commit dengan pesan yang jelas. Repository dengan satu atau dua commit besar di akhir tidak mendapat nilai pada aspek Git.  README.md: langkah setup dari git clone sampai aplikasi berjalan (maksimal 6 perintah), akun login seeder, cara menjalankan test, serta penjelasan singkat alur POST /api/orders dari route sampai database. File .env tidak boleh ter-commit, sediakan .env.example .  DECISIONS.md — jawab dengan kata-kata Anda sendiri dan sebutkan file atau fungsi terkait: a Bagaimana Anda mencegah stok minus saat dua order masuk bersamaan? b Mengapa struktur folder dan lapisan kode Anda seperti ini, dan apa yang akan Anda ubah jika aplikasi membesar? c Satu bug atau masalah yang Anda temui saat mengerjakan, dan bagaimana Anda menemukannya. d Bagian yang belum selesai atau masih lemah, serta langkah Anda selanjutnya.  AI_USAGE.md: tools AI yang dipakai, untuk bagian apa, 35 prompt utama (disalin apa adanya), dan bagian kode yang Anda tulis atau ubah sendiri. Jika tidak memakai AI, tuliskan demikian.

lalu untuk arahan frontend akan menyusul nanti, jadi sekarang fokus pada backend dulu
```

**4. Menyelesaikan sisa backend** (sebelumnya setiap langkah dimulai dengan prompt seperti `Lanjut step 15`, setelah langkah sebelumnya dicek dan di-commit):

```text
lanjut step sampai selesai untuk backend
```

**5. Menyelesaikan frontend** (frontend dimulai dengan prompt `Siap frontend`, mengikuti `frontend/fe-writing-block.md`, lalu langkah awalnya dikerjakan satu per satu):

```text
lanjut semua fitur sekaligus
```

## Bagaimana hasil AI diverifikasi

- **Setelah setiap langkah:** menjalankan `npm run typecheck`, dilanjutkan request sungguhan ke aplikasi dan database untuk kasus sukses maupun gagal (validasi, 401/404/409/422, batas pagination, dan sebagainya). Data uji dihapus lagi setelahnya.
- **Concurrency:**
  - 12 order bersamaan untuk stok 5 menghasilkan tepat 5 yang sukses.
  - 20 order bersamaan dengan urutan produk terbalik tidak menimbulkan deadlock.
  - 30 transaksi bersamaan menghasilkan nomor invoice yang unik dan berurutan.
  - 10 cancel bersamaan hanya mengembalikan stok satu kali.
- **Filter tanggal:** dites dengan order tepat di pergantian hari WIB (16:59:59 UTC dan 17:00:00 UTC).
- **Test otomatis:** 47 test di `backend/tests/` dan 27 test di `frontend/tests/`, dijalankan dengan `npm test` dari root repo, semuanya lulus.
- **Frontend di browser:** setiap halaman dicoba langsung di browser terhadap backend sungguhan. Yang dicoba antara lain login, token rusak, logout, tambah dan edit produk, tambah customer, membuat order (termasuk stok kurang), pay dan cancel, filter order, serta tampilan HP.
- **`nuxt typecheck`** setelah setiap langkah frontend.
- **Bug yang ditemukan dari pengecekan ini** dan sudah diperbaiki, dijelaskan di [DECISIONS.md](DECISIONS.md) bagian c.

## Bagian yang saya tulis atau ubah sendiri

<!-- TODO: isi dengan jujur sesuai yang benar-benar Anda kerjakan. Contoh yang sudah terjadi selama pengerjaan: -->

- Menyusun dokumen arahan `backend/be-writing-block.md` (stack, arsitektur, aturan bisnis, urutan kerja). <!-- sesuaikan jika dokumen ini juga dibantu AI -->
- Menyiapkan PostgreSQL lokal, mengisi `DATABASE_URL`, dan memilih nama database sendiri.
- Mengatur struktur repo (`backend/` dan `frontend/`) dan membuat setiap commit secara bertahap.
- Me-review setiap langkah sebelum di-commit dan memutuskan kapan lanjut ke langkah berikutnya.
- Menulis ulang DECISIONS.md dengan kata-kata sendiri. <!-- hapus jika belum -->
- <!-- tambahkan bagian kode yang Anda ubah manual -->
