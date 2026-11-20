# Harness E2E — Community Connectivity Analyzer

Harness ini menguji aplikasi melalui browser sungguhan tanpa menambah
dependensi automation. Ia memakai:

- Flask test server yang dijalankan dari virtual environment proyek;
- Google Chrome/Chromium dalam mode headless;
- Chrome DevTools Protocol (CDP) melalui `WebSocket` global bawaan Node.js.

Tidak ada paket npm yang perlu dipasang.

## Prasyarat

- Node.js 22 atau lebih baru (dibutuhkan global `WebSocket`; diverifikasi dengan Node 26).
- Python virtual environment proyek di `.venv/` dengan Flask terpasang.
- Chrome atau Chromium terpasang. Secara default harness memakai
  `/usr/bin/google-chrome`. Lokasi lain dapat diberikan lewat variabel
  lingkungan `CHROME_PATH`.

Contoh pemeriksaan prasyarat:

```bash
node --version
.venv/bin/python -c "import flask; print(flask.__version__)"
google-chrome --version
```

## Cara menjalankan

Dari direktori root proyek:

```bash
node tests/e2e/run_e2e.js
```

Harness akan:

1. memilih port lokal yang kosong;
2. menjalankan Flask dengan modul `app`;
3. menjalankan Chrome headless dengan profil sementara;
4. menjalankan seluruh skenario;
5. menghentikan Flask/Chrome dan menghapus profil sementara.

Keluaran berupa daftar pemeriksaan `✔`/`✖` dan ringkasan
`E2E: n/m pemeriksaan lulus`. Exit code `0` berarti semua lulus.

## Skenario yang dicakup

- kondisi awal aplikasi;
- muat data contoh dan visualisasi M7 (node, edge, legenda);
- analisis: jumlah anggota, hubungan, komponen, anggota terisolasi, degree;
- shortest path A–E dari dataset PRD dan sorotan jalur;
- reset data;
- CRUD anggota dan relasi;
- validasi nama kosong, nama duplikat, pilihan kosong, self-loop, dan relasi duplikat;
- penghapusan anggota yang menghapus relasi terkait;
- pembaruan visualisasi saat data berubah;
- persistensi localStorage setelah halaman dimuat ulang;
- fallback ketika `cytoscape.min.js` gagal dimuat, dengan analisis tetap berjalan;
- tidak ada exception JavaScript yang tidak tertangani.

## Pemeriksaan QA (responsivitas dan aksesibilitas)

```bash
node tests/e2e/run_qa.js
```

Skrip ini memeriksa tampilan pada 1280x900, 820x900, 390x844, 320x700, dan
844x390 (landscape), lalu memeriksa aksesibilitas dasar: atribut `lang`, meta
viewport, label kontrol, nama tombol, `aria-live`, label graf, skip link,
fokus keyboard, dan kontras warna.

Temuan **tidak diperbaiki otomatis**. Skrip mencatatnya sebagai pemeriksaan
gagal agar dapat diputuskan terlebih dahulu. Exit code `1` berarti ada temuan
yang perlu ditinjau, bukan berarti aplikasi rusak.

## Unit test JavaScript

Unit test untuk `storage.js` dan `api.js` berada di `tests/js/` dan memakai
`node:test`:

```bash
node --test tests/js
```

Keduanya memakai stub `localStorage` dan `fetch`/`Response`, sehingga tidak
membutuhkan browser maupun server.

## Catatan

- Harness hanya membaca dan menguji aplikasi. Ia tidak mengubah file produksi.
- Untuk fallback, harness memblokir permintaan `cytoscape.min.js` lewat CDP
  `Fetch.failRequest`; ini tidak mengubah file vendor di repository.
- Profil browser sementara dibuat di direktori sistem sementara dan dihapus
  setelah pengujian.
