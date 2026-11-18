# Development Task Plan
# Community Connectivity Analyzer

**Versi:** 1.0  
**Status:** Planned  
**Referensi:** PRD.md, TECHNICAL_DESIGN.md

---

## Development Rules

1. Ikuti PRD.md dan TECHNICAL_DESIGN.md sebagai acuan utama.
2. Kerjakan milestone secara berurutan.
3. Jangan mengerjakan milestone berikutnya sebelum milestone sebelumnya selesai dan diuji.
4. Jangan mengubah arsitektur atau teknologi tanpa alasan teknis dan persetujuan.
5. Implementasikan algoritma graf sendiri menggunakan Python.
6. Jangan menggunakan database pada versi pertama.
7. Jangan menggunakan library graf seperti NetworkX untuk implementasi algoritma utama.
8. Cytoscape.js hanya digunakan untuk visualisasi graf.
9. Setiap fitur harus diuji sebelum dinyatakan selesai.
10. Berikan ringkasan perubahan, file yang dibuat, dan hasil pengujian setelah setiap milestone.

---

# Milestone 1 — Project Initialization

**Tujuan:** Menyiapkan fondasi aplikasi dan lingkungan pengembangan.

### Tasks

- [x] Membuat struktur direktori proyek.
- [x] Membuat virtual environment Python.
- [x] Membuat requirements.txt.
- [x] Menginstal Flask.
- [x] Membuat entry point app.py.
- [x] Membuat halaman HTML utama.
- [x] Menghubungkan Flask dengan template HTML.
- [x] Membuat file .gitignore.
- [x] Memastikan aplikasi berjalan secara lokal.

### Acceptance Criteria

- [x] Aplikasi dapat dijalankan menggunakan Flask.
- [x] Halaman utama dapat dibuka melalui browser.
- [x] Tidak terdapat error pada terminal.
- [x] Struktur proyek sesuai TECHNICAL_DESIGN.md.

---

# Milestone 2 — Frontend Foundation

**Tujuan:** Membuat antarmuka dasar aplikasi.

### Tasks

- [ ] Membuat layout halaman utama.
- [ ] Membuat header aplikasi.
- [ ] Membuat area visualisasi graf.
- [ ] Membuat bagian manajemen anggota.
- [ ] Membuat bagian manajemen relasi.
- [ ] Membuat area hasil analisis.
- [ ] Membuat bagian pencarian shortest path.
- [ ] Membuat layout responsif untuk desktop dan mobile.

### Acceptance Criteria

- Seluruh bagian utama tersedia.
- Navigasi dan tata letak dapat dipahami.
- Tampilan responsif.
- Tidak terdapat elemen antarmuka yang tidak memiliki fungsi atau tujuan.

---

# Milestone 3 — Graph Data Management

**Tujuan:** Membuat mekanisme pengelolaan data graf.

### Tasks

- [ ] Membuat struktur data vertices dan edges.
- [ ] Membuat fitur tambah anggota.
- [ ] Membuat fitur hapus anggota.
- [ ] Membuat fitur tambah relasi.
- [ ] Membuat fitur hapus relasi.
- [ ] Membuat validasi anggota duplikat.
- [ ] Membuat validasi relasi duplikat.
- [ ] Mencegah self-loop.
- [ ] Memastikan penghapusan anggota turut menghapus relasi terkait.
- [ ] Membuat fitur reset graph.
- [ ] Membuat fitur load sample data.
- [ ] Menyimpan dan memuat data menggunakan localStorage.

### Acceptance Criteria

- [x] Anggota dapat ditambahkan dan dihapus.
- [x] Relasi dapat ditambahkan dan dihapus.
- [x] Data graf selalu konsisten.
- [x] Validasi mencegah data tidak valid.
- [x] Sample data dapat dimuat.
- [x] Data dapat dipertahankan setelah halaman dimuat ulang pada browser yang sama.

---

# Milestone 4 — Graph Algorithm Implementation

**Tujuan:** Mengimplementasikan algoritma matematika diskrit menggunakan Python.

### Tasks

- [ ] Membuat modul graph/algorithms.py.
- [ ] Membuat fungsi konversi edges menjadi adjacency list.
- [ ] Mengimplementasikan perhitungan Degree.
- [ ] Mengimplementasikan DFS.
- [ ] Mengimplementasikan Connected Components menggunakan DFS.
- [ ] Mengimplementasikan BFS.
- [ ] Mengimplementasikan rekonstruksi shortest path.
- [ ] Menangani graf kosong.
- [ ] Menangani simpul terisolasi.
- [ ] Menangani simpul awal dan tujuan yang sama.
- [ ] Menangani dua simpul yang tidak terhubung.

### Acceptance Criteria

- [x] Degree seluruh anggota dihitung dengan benar.
- [x] Anggota dengan degree 0 dapat diidentifikasi.
- [x] Connected Components memberikan kelompok yang benar.
- [x] BFS memberikan jalur terpendek berdasarkan jumlah sisi.
- [x] Algoritma bekerja tanpa menggunakan library graf siap pakai.
- [x] Kompleksitas DFS dan BFS adalah O(V + E).

---

# Milestone 5 — Backend API Development

**Tujuan:** Menghubungkan algoritma Python dengan frontend.

### Tasks

- [ ] Membuat routes/graph_routes.py.
- [ ] Membuat endpoint POST /api/analyze.
- [ ] Membuat endpoint POST /api/shortest-path.
- [ ] Membuat validasi struktur JSON.
- [ ] Membuat validasi ID anggota.
- [ ] Membuat validasi relasi.
- [ ] Membuat format response JSON yang konsisten.
- [ ] Membuat error handling.
- [ ] Menghubungkan endpoint dengan modul graph/algorithms.py.

### Acceptance Criteria

- API dapat menerima data graf melalui JSON.
- API dapat mengembalikan hasil analisis.
- API dapat mencari shortest path.
- Data tidak valid menghasilkan HTTP 400.
- Kesalahan internal tidak membocorkan traceback kepada pengguna.
- Backend tidak menyimpan data graf secara permanen.

---

# Milestone 6 — Frontend and Backend Integration

**Tujuan:** Menghubungkan antarmuka dengan API Flask.

### Tasks

- [ ] Membuat static/js/api.js.
- [ ] Membuat fungsi request ke endpoint analisis.
- [ ] Mengirim data graf ke backend.
- [ ] Menampilkan hasil Degree.
- [ ] Menampilkan daftar anggota terisolasi.
- [ ] Menampilkan Connected Components.
- [ ] Membuat pemilihan anggota untuk shortest path.
- [ ] Menampilkan jalur yang ditemukan.
- [ ] Menampilkan pesan ketika jalur tidak tersedia.
- [ ] Menampilkan loading dan error state.

### Acceptance Criteria

- Frontend berhasil berkomunikasi dengan backend.
- Hasil analisis sesuai dengan data yang dimasukkan.
- Pesan kesalahan ditampilkan dengan jelas.
- Tidak diperlukan input ulang untuk menjalankan analisis.

---

# Milestone 7 — Graph Visualization

**Tujuan:** Menampilkan jaringan komunitas menggunakan Cytoscape.js.

### Tasks

- [ ] Mengintegrasikan Cytoscape.js.
- [ ] Membuat representasi vertices menjadi nodes.
- [ ] Membuat representasi edges menjadi connections.
- [ ] Menampilkan label nama anggota.
- [ ] Mengatur layout graf secara otomatis.
- [ ] Memberikan penanda visual pada anggota terisolasi.
- [ ] Memberikan penanda visual pada kelompok berbeda.
- [ ] Menyorot shortest path.
- [ ] Memperbarui visualisasi ketika data berubah.

### Acceptance Criteria

- Semua anggota muncul sebagai nodes.
- Semua relasi muncul sebagai edges.
- Graf diperbarui ketika data berubah.
- Anggota terisolasi mudah dikenali.
- Jalur terpendek dapat dibedakan secara visual.
- Visualisasi tidak menjalankan algoritma analisis utama.

---

# Milestone 8 — Testing and Validation

**Tujuan:** Memastikan seluruh fitur bekerja dengan benar.

### Tasks

- [ ] Menginstal pytest.
- [ ] Membuat tests/test_algorithms.py.
- [ ] Menguji Degree.
- [ ] Menguji DFS.
- [ ] Menguji Connected Components.
- [ ] Menguji BFS.
- [ ] Menguji shortest path.
- [ ] Menguji graf kosong.
- [ ] Menguji graf dengan satu simpul.
- [ ] Menguji beberapa komponen terpisah.
- [ ] Menguji relasi tidak valid.
- [ ] Menguji API.
- [ ] Menguji integrasi frontend dan backend.
- [ ] Memperbaiki bug yang ditemukan.

### Acceptance Criteria

- Seluruh pengujian algoritma lulus.
- Hasil sesuai dataset pada PRD.md.
- Tidak terdapat bug kritis pada fitur utama.
- Data tidak valid ditangani dengan benar.

---

# Milestone 9 — Deployment Preparation

**Tujuan:** Menyiapkan aplikasi agar dapat di-hosting dan didemonstrasikan.

### Tasks

- [ ] Membuat konfigurasi production.
- [ ] Memastikan requirements.txt lengkap.
- [ ] Menyiapkan Gunicorn.
- [ ] Memisahkan konfigurasi development dan production.
- [ ] Memastikan Flask debug mode tidak aktif di production.
- [ ] Menggunakan environment variable untuk konfigurasi port jika diperlukan.
- [ ] Menguji aplikasi menggunakan production server secara lokal.
- [ ] Membuat README.md berisi panduan instalasi dan penggunaan.
- [ ] Mendokumentasikan keterbatasan aplikasi.

### Acceptance Criteria

- Aplikasi dapat berjalan tanpa Flask debug server.
- Aplikasi tidak membutuhkan database.
- Semua dependensi tercantum.
- Panduan instalasi dapat diikuti.
- Aplikasi siap dipasang pada hosting yang mendukung Python WSGI.

---

## Testing Reference Dataset

Gunakan dataset berikut sebagai acuan utama pengujian.

### Vertices

```json
[
  {"id": "A", "name": "Andi"},
  {"id": "B", "name": "Budi"},
  {"id": "C", "name": "Citra"},
  {"id": "D", "name": "Deni"},
  {"id": "E", "name": "Eka"},
  {"id": "F", "name": "Fajar"}
]
```

### Edges

```json
[
  {"source": "A", "target": "B"},
  {"source": "A", "target": "C"},
  {"source": "B", "target": "C"},
  {"source": "C", "target": "D"},
  {"source": "D", "target": "E"}
]
```

### Expected Results

| Parameter | Expected Result |
|---|---|
| Vertex Count | 6 |
| Edge Count | 5 |
| Degree A | 2 |
| Degree B | 2 |
| Degree C | 3 |
| Degree D | 2 |
| Degree E | 1 |
| Degree F | 0 |
| Component Count | 2 |
| Isolated Member | Fajar |
| Shortest Path A-E | A → C → D → E |
| Distance A-E | 3 |

Catatan: BFS dapat menghasilkan jalur berbeda jika terdapat beberapa jalur terpendek dengan panjang sama. Pengujian harus memeriksa panjang jalur dan validitas setiap sisinya, bukan mengharuskan satu urutan tertentu.

---

## Development Completion

Proyek dianggap selesai apabila:

- [ ] Seluruh milestone selesai.
- [ ] Seluruh acceptance criteria terpenuhi.
- [ ] Algoritma telah diuji.
- [ ] Frontend dan backend terintegrasi.
- [ ] Visualisasi berjalan.
- [ ] Aplikasi dapat dijalankan secara lokal.
- [ ] Aplikasi siap di-hosting.
- [ ] README.md tersedia.

---

**End of Document**