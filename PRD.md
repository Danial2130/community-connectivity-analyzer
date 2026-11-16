# Product Requirements Document (PRD)
# Community Connectivity Analyzer

**Versi:** 1.0  
**Status:** Draft  
**Jenis Proyek:** Aplikasi Web  
**Tujuan:** Proyek UAS Matematika Diskrit

---

## 1. Project Overview

### 1.1 Deskripsi Produk

Community Connectivity Analyzer adalah aplikasi web untuk menganalisis keterhubungan antaranggota dalam suatu komunitas menggunakan konsep matematika diskrit, khususnya teori graf.

Aplikasi merepresentasikan anggota sebagai simpul (*vertex*) dan hubungan antaranggota sebagai sisi (*edge*). Hasil analisis digunakan untuk mengidentifikasi anggota tanpa koneksi, kelompok yang tidak saling terhubung, serta jalur hubungan terpendek antaranggota.

### 1.2 Latar Belakang

Dalam sebuah komunitas, hubungan antaranggota membentuk jaringan yang dapat memiliki struktur kompleks. Pengelola komunitas dapat mengalami kesulitan dalam mengetahui anggota yang tidak memiliki koneksi atau kelompok yang terpisah.

Aplikasi ini dikembangkan untuk membantu menganalisis struktur keterhubungan tersebut melalui penerapan teori graf dan algoritma penelusuran graf.

### 1.3 Tujuan Produk

1. Merepresentasikan hubungan antaranggota dalam bentuk graf.
2. Menghitung jumlah koneksi setiap anggota.
3. Mengidentifikasi anggota yang terisolasi.
4. Menemukan kelompok anggota yang saling terhubung.
5. Menentukan jalur terpendek antara dua anggota.
6. Memvisualisasikan struktur jaringan komunitas.

---

## 2. Target Pengguna

**Target utama:** Pengelola komunitas atau organisasi.

**Kebutuhan pengguna:**
- Memasukkan data anggota komunitas.
- Menentukan hubungan antaranggota.
- Melihat struktur jaringan komunitas.
- Mengetahui anggota yang tidak memiliki koneksi.
- Mengetahui kelompok yang terpisah.
- Mencari jalur hubungan antara dua anggota.

Aplikasi tidak ditujukan untuk menilai kualitas hubungan sosial, popularitas, atau kepribadian anggota.

---

## 3. Ruang Lingkup Produk

### 3.1 Fitur Utama

| ID | Fitur | Deskripsi |
|---|---|---|
| F01 | Input Anggota | Menambahkan anggota ke dalam jaringan. |
| F02 | Input Relasi | Membuat hubungan antaranggota. |
| F03 | Sample Data | Memuat data contoh untuk demonstrasi. |
| F04 | Degree Analysis | Menghitung jumlah koneksi setiap anggota. |
| F05 | Isolated Member Detection | Mengidentifikasi anggota dengan degree 0. |
| F06 | Connected Components | Mengidentifikasi kelompok yang saling terhubung. |
| F07 | Shortest Path | Menemukan jalur terpendek menggunakan BFS. |
| F08 | Graph Visualization | Menampilkan jaringan dalam bentuk graf. |
| F09 | Reset Graph | Menghapus seluruh data jaringan yang sedang digunakan. |

### 3.2 Fitur di Luar Ruang Lingkup

Fitur berikut tidak dikembangkan dalam versi pertama:

- Registrasi dan login pengguna.
- Integrasi media sosial.
- Pengambilan data otomatis dari platform eksternal.
- Fitur chat atau komunikasi anggota.
- Analisis sentimen.
- Rekomendasi hubungan menggunakan AI.
- Penyimpanan data menggunakan database server.
- Sistem manajemen banyak komunitas.

---

## 4. Functional Requirements

### FR-01: Manajemen Anggota

Pengguna dapat:
- Menambahkan anggota dengan nama.
- Melihat daftar anggota.
- Menghapus anggota.
- Mencegah nama anggota kosong.
- Mencegah identitas anggota duplikat.

Setiap anggota memiliki ID unik.

### FR-02: Manajemen Relasi

Pengguna dapat:
- Membuat hubungan antara dua anggota.
- Menghapus hubungan yang sudah ada.
- Melihat daftar hubungan.

Validasi:
- Kedua anggota harus terdaftar.
- Anggota tidak dapat dihubungkan dengan dirinya sendiri.
- Hubungan duplikat tidak diperbolehkan.
- Hubungan bersifat dua arah (undirected).

### FR-03: Degree Analysis

Sistem menghitung jumlah sisi yang terhubung pada setiap simpul.

Rumus:

`deg(v) = jumlah sisi yang terhubung dengan simpul v`

Sistem menampilkan:
- Nama anggota.
- Jumlah koneksi.
- Anggota dengan koneksi terbanyak.
- Anggota dengan koneksi paling sedikit.

### FR-04: Isolated Member Detection

Sistem mengidentifikasi anggota yang tidak memiliki hubungan dengan anggota lain.

Kondisi:

`deg(v) = 0`

Hasil ditampilkan sebagai daftar anggota terisolasi.

### FR-05: Connected Components

Sistem mengidentifikasi seluruh kelompok simpul yang saling terhubung menggunakan DFS atau BFS.

Hasil menampilkan:
- Jumlah kelompok.
- Anggota dalam setiap kelompok.
- Anggota yang berada dalam kelompok terpisah.

### FR-06: Shortest Path

Pengguna memilih dua anggota untuk mencari jalur hubungan terpendek.

Sistem menggunakan algoritma Breadth-First Search (BFS).

Hasil menampilkan:
- Jalur yang ditemukan.
- Urutan anggota dalam jalur.
- Jumlah sisi yang dilalui.

Jika tidak terdapat jalur, sistem menampilkan informasi bahwa kedua anggota tidak terhubung.

### FR-07: Graph Visualization

Sistem menampilkan:
- Simpul sebagai anggota.
- Sisi sebagai hubungan.
- Label nama anggota.
- Anggota terisolasi dengan penanda visual berbeda.
- Jalur terpendek dengan penanda visual khusus.

---

## 5. Mathematical Concepts

Aplikasi menerapkan konsep matematika diskrit berikut:

| Konsep | Penerapan |
|---|---|
| Himpunan | Menyimpan kumpulan anggota sebagai V. |
| Relasi | Merepresentasikan hubungan antaranggota sebagai E. |
| Fungsi | Memetakan setiap simpul ke nilai degree. |
| Logika | Validasi data dan kondisi anggota terisolasi. |
| Teori Graf | Merepresentasikan jaringan komunitas. |
| DFS | Menelusuri simpul dan menemukan komponen terhubung. |
| BFS | Menentukan jalur terpendek pada graf tak berbobot. |

Model graf:

`G = (V, E)`

Keterangan:
- V: himpunan simpul atau anggota.
- E: himpunan sisi atau hubungan antaranggota.

### Batasan Model Matematika

- Graf tidak berarah (*undirected graph*).
- Graf tidak berbobot (*unweighted graph*).
- Tidak terdapat self-loop.
- Tidak terdapat sisi duplikat.
- Setiap hubungan dianggap simetris.
- Jalur terpendek dihitung berdasarkan jumlah sisi, bukan kekuatan hubungan.

---

## 6. Sample Dataset

Aplikasi menyediakan data contoh untuk membantu pengguna mencoba fitur tanpa memasukkan data secara manual.

### Anggota

| ID | Nama |
|---|---|
| A | Andi |
| B | Budi |
| C | Citra |
| D | Deni |
| E | Eka |
| F | Fajar |

### Relasi

- A — B
- A — C
- B — C
- C — D
- D — E

### Hasil Analisis yang Diharapkan

| Analisis | Hasil |
|---|---|
| Total anggota | 6 |
| Total relasi | 5 |
| Degree Andi | 2 |
| Degree Budi | 2 |
| Degree Citra | 3 |
| Degree Deni | 2 |
| Degree Eka | 1 |
| Degree Fajar | 0 |
| Connected Components | 2 |
| Anggota terisolasi | Fajar |
| Jalur A ke E | A → C → D → E |
| Jarak A ke E | 3 sisi |
| Jalur A ke F | Tidak ditemukan |

Data ini digunakan sebagai acuan pengujian algoritma.

---

## 7. Non-Functional Requirements

### 7.1 Usability
- Antarmuka mudah dipahami pengguna.
- Navigasi dan fitur utama mudah ditemukan.
- Hasil analisis ditampilkan secara jelas.

### 7.2 Performance
- Analisis dapat dilakukan secara responsif untuk jaringan komunitas berukuran kecil hingga menengah.
- Algoritma graf menggunakan representasi adjacency list.
- Kompleksitas penelusuran graf DFS/BFS ditargetkan O(V + E).

### 7.3 Compatibility
- Aplikasi dapat digunakan melalui browser modern.
- Tampilan responsif pada desktop dan perangkat mobile.

### 7.4 Privacy
- Tidak memerlukan akun pengguna.
- Tidak mengumpulkan data dari platform eksternal.
- Data yang dimasukkan tidak dikirim ke database server.
- Pengguna bertanggung jawab memastikan data komunitas yang dimasukkan telah diperoleh dengan izin yang sesuai.

---

## 8. Data Management

Versi pertama aplikasi tidak menggunakan database.

Strategi pengelolaan data:
- Data graf dikirim dari frontend ke backend dalam format JSON ketika analisis diminta.
- Backend memproses data tanpa menyimpan salinan permanen.
- Data aktif dapat disimpan sementara di browser menggunakan localStorage.
- Pengguna dapat menghapus data melalui fitur Reset Graph.
- Data contoh dapat dimuat kembali kapan saja.

**Catatan:** localStorage hanya menyimpan data pada browser dan perangkat pengguna. Data tidak otomatis tersinkronisasi antarperangkat.

---

## 9. Technology Stack

| Komponen | Teknologi |
|---|---|
| Backend | Python |
| Web Framework | Flask |
| Frontend | HTML5 |
| Styling | CSS3 |
| Client-side Logic | JavaScript |
| Graph Visualization | Cytoscape.js |
| Data Exchange | JSON |
| Version Control | Git |
| Deployment | Hosting yang mendukung Python/Flask |

Algoritma graf utama harus diimplementasikan menggunakan Python, bukan diserahkan kepada Cytoscape.js.

Cytoscape.js hanya digunakan untuk visualisasi dan interaksi tampilan graf.

---

## 10. User Flow

1. Pengguna membuka aplikasi.
2. Sistem menampilkan halaman utama.
3. Pengguna memilih memuat sample data atau memasukkan anggota sendiri.
4. Pengguna menambahkan hubungan antaranggota.
5. Sistem menampilkan visualisasi graf.
6. Pengguna menjalankan analisis.
7. Sistem menghitung degree dan anggota terisolasi.
8. Sistem mengidentifikasi connected components.
9. Pengguna memilih dua anggota untuk mencari shortest path.
10. Sistem menampilkan hasil analisis dan visualisasi jalur.

---

## 11. Acceptance Criteria

Produk dinyatakan memenuhi kebutuhan versi pertama apabila:

- [ ] Aplikasi dapat dijalankan melalui browser.
- [ ] Pengguna dapat menambahkan dan menghapus anggota.
- [ ] Pengguna dapat menambahkan dan menghapus relasi.
- [ ] Sistem menolak relasi yang tidak valid.
- [ ] Sample data dapat dimuat.
- [ ] Degree setiap anggota dihitung dengan benar.
- [ ] Anggota dengan degree 0 dapat diidentifikasi.
- [ ] Connected Components dihitung dengan benar.
- [ ] BFS dapat menemukan jalur terpendek.
- [ ] Sistem dapat mendeteksi jika tidak terdapat jalur.
- [ ] Graf dapat divisualisasikan menggunakan Cytoscape.js.
- [ ] Data sementara dapat dipertahankan melalui localStorage.
- [ ] Aplikasi dapat dijalankan pada lingkungan hosting yang mendukung Flask.

---

## 12. Project Constraints

- Proyek dikembangkan untuk kebutuhan UAS Matematika Diskrit.
- Implementasi harus tetap berfokus pada teori graf.
- Algoritma utama ditulis sendiri menggunakan Python.
- Tidak menggunakan database pada versi pertama.
- Tidak menambahkan fitur di luar ruang lingkup tanpa persetujuan.
- Implementasi dilakukan secara bertahap dan setiap fitur harus diuji.

---

## 13. Project Success Metrics

Keberhasilan proyek diukur berdasarkan:

1. Ketepatan hasil perhitungan algoritma terhadap data pengujian.
2. Keberhasilan identifikasi anggota terisolasi dan kelompok terhubung.
3. Ketepatan pencarian jalur terpendek.
4. Kejelasan visualisasi jaringan.
5. Kemudahan pengguna dalam memasukkan data dan menjalankan analisis.
6. Keberhasilan aplikasi dijalankan secara lokal maupun melalui hosting.

---

**End of Document**