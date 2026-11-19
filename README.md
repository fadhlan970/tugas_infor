# Smart Library

Sistem manajemen perpustakaan sekolah berbahasa Indonesia. Aplikasi ini mencatat setiap eksemplar secara internal agar stok, peminjaman, dan pengembalian tetap sinkron.

## Teknologi

- Next.js App Router dan TypeScript
- Tailwind CSS 4 dengan primitive komponen shadcn/ui yang dapat dikembangkan di `components/ui/`
- PostgreSQL dan Prisma ORM
- Auth.js dengan autentikasi email dan kata sandi
- Recharts untuk grafik dashboard
- ExcelJS dan jsPDF untuk impor/ekspor Excel serta PDF

## Kebutuhan

- Node.js 22.18 atau lebih baru, atau Node.js 24.11 atau lebih baru (disarankan)
- PostgreSQL 14 atau lebih baru
- npm

XAMPP dapat dipakai untuk lingkungan lokal PHP yang sudah ada, tetapi PostgreSQL perlu dipasang dan dijalankan terpisah. `compose.yaml` menyediakan database PostgreSQL lokal untuk pengembangan.

## Instalasi lokal di Windows

1. Pasang PostgreSQL dan buat database kosong bernama `smart_library`, atau jalankan `docker compose up -d postgres` untuk memakai database di `compose.yaml`.
2. Salin `.env.example` menjadi `.env`, lalu isi koneksi PostgreSQL dan rahasia Auth.js.

   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/smart_library?schema=public"
   AUTH_SECRET="gunakan-rahasia-acak-yang-panjang"
   AUTH_URL="http://localhost:3000"
   NEXTAUTH_URL="http://localhost:3000"
   ```

   Buat rahasia acak dengan `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.

3. Pasang dependensi dan jalankan migrasi serta seed:

   ```powershell
   npm.cmd install
   npx.cmd prisma generate
   npx.cmd prisma migrate deploy
   npm.cmd run db:seed
   npm.cmd run dev
   ```

4. Buka `http://localhost:3000`.

Setelah mengimpor siswa yang perlu masuk ke katalog pribadi, buka **Pengaturan → Tambah akun**, pilih peran **Siswa**, lalu tautkan akun ke data anggota.

`prisma/migrations/` berisi migrasi skema. Untuk membuat migrasi berikutnya setelah mengubah `prisma/schema.prisma`, jalankan `npx.cmd prisma migrate dev --name nama_perubahan`.

## Akun demo

| Peran | Email | Kata sandi |
| --- | --- | --- |
| Admin | `admin@smartlibrary.local` | `admin123` |
| Petugas | `petugas@smartlibrary.local` | `petugas123` |
| Siswa | `andi@smartlibrary.local` | `siswa123` |

Ganti kata sandi demo dan rahasia Auth.js sebelum aplikasi dipakai dengan data nyata. Seed dapat dijalankan ulang; akun dan katalog demo diperbarui tanpa menghapus transaksi.

## Fitur

- Dashboard statistik, grafik aktivitas, buku populer, keterlambatan, dan aktivitas terakhir.
- CRUD serta arsip buku. Jumlah stok dihitung dari catatan eksemplar fisik unik.
- CRUD anggota dengan NIS unik, status aktif, impor Excel, dan ekspor Excel.
- Peminjaman beberapa judul sekaligus dalam satu transaksi dengan pemeriksaan anggota, batas pinjaman, dan stok.
- Pengembalian sebagian atau penuh, pencatatan kondisi, perhitungan keterlambatan, denda opsional, pembayaran, dan pembebasan.
- Katalog siswa, transaksi pribadi, dan tanggal tenggat.
- Laporan peminjaman per hari, 7 hari terakhir, bulan berjalan, dan seluruh periode; ekspor PDF atau Excel.
- Laporan keterlambatan, koleksi populer, rekap stok, dan aktivitas anggota.
- Role admin, petugas, dan siswa; audit log untuk tindakan penting; mode terang dan gelap.

## Impor Excel

Impor buku membaca berkas `.xlsx` dengan baris judul berikut (nama kolom dapat ditulis dalam bahasa Indonesia atau Inggris): `Kode Buku`, `Judul`, `ISBN`, `Penulis`, `Penerbit`, `Tahun Terbit`, `Kategori`, `Lokasi Rak`, `Stok`.

Impor anggota membaca berkas `.xlsx` dengan kolom: `NIS`, `Nama`, `Kelas`, `Jurusan`, `Email`, `Telepon`. Ukuran berkas maksimum 5 MB dan maksimal 2.000 baris diproses per berkas. Baris invalid atau duplikat ditampilkan sebagai laporan kesalahan; baris lain tetap diimpor.

## Pengujian

Tes aturan tanggal berjalan tanpa database:

```powershell
npm.cmd test
```

Tes alur peminjaman/pengembalian membutuhkan database khusus untuk pengujian. Arahkan `DATABASE_URL` ke database tersebut, lalu aktifkan tes integrasi:

```powershell
$env:RUN_DB_INTEGRATION = "1"
npm.cmd test
```

Tes integrasi membuat lalu menghapus akun, anggota, buku, eksemplar, dan transaksi berawalan `test-`. Jangan arahkan ke database produksi.

## Build dan deployment

Sediakan PostgreSQL yang dapat dijangkau aplikasi. Atur `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`/`NEXTAUTH_URL`, lalu jalankan perintah berikut pada lingkungan deployment:

```sh
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start
```

Jalankan seed demo hanya pada lingkungan pengembangan atau staging. Pastikan host aplikasi menggunakan HTTPS dan atur URL Auth.js ke domain produksi.

## Keamanan data

Password disimpan sebagai hash bcrypt. API memvalidasi input di server dan membatasi operasi sesuai peran. Peminjaman/pengembalian memakai transaksi database. Eksemplar dipilih hanya dari stok tersedia; migrasi menambahkan indeks unik parsial untuk mencegah satu eksemplar memiliki lebih dari satu pinjaman aktif. Kode inventaris internal adalah teks unik biasa yang dipakai oleh petugas dalam catatan transaksi.
