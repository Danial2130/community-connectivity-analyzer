# AGENTS.md
# AI Coding Agent Instructions

## 1. Project Context

Project: Community Connectivity Analyzer

Community Connectivity Analyzer adalah aplikasi web untuk menganalisis keterhubungan antaranggota komunitas menggunakan konsep matematika diskrit, khususnya teori graf.

Aplikasi dikembangkan untuk memenuhi kebutuhan UAS Matematika Diskrit.

Baca dokumen berikut sebelum melakukan pekerjaan:

1. `PRD.md` — kebutuhan dan ruang lingkup produk.
2. `TECHNICAL_DESIGN.md` — arsitektur dan rancangan teknis.
3. `TASKS.md` — urutan implementasi dan acceptance criteria.

Ketiga dokumen tersebut merupakan sumber acuan utama proyek.

---

## 2. Technology Constraints

Gunakan teknologi berikut:

| Component | Technology |
|---|---|
| Backend | Python |
| Backend Framework | Flask |
| Frontend | HTML, CSS, JavaScript |
| Graph Visualization | Cytoscape.js |
| Data Exchange | JSON |
| Browser Storage | localStorage |
| Testing | pytest |
| Version Control | Git |
| Production Server | Gunicorn |

Jangan mengganti teknologi tersebut tanpa alasan teknis yang kuat dan persetujuan pengguna.

### Restrictions

- Jangan menggunakan React, Vue, atau framework frontend besar lainnya.
- Jangan menggunakan database pada versi pertama.
- Jangan menambahkan sistem autentikasi.
- Jangan menggunakan NetworkX atau library graf lain untuk implementasi algoritma utama.
- Jangan menggunakan Cytoscape.js untuk menghitung hasil analisis graf.
- Jangan menambahkan dependensi yang tidak diperlukan.

---

## 3. Development Principles

Ikuti prinsip berikut selama pengembangan:

### 3.1 Work Incrementally

- Kerjakan satu milestone pada satu waktu.
- Jangan langsung mengimplementasikan seluruh aplikasi.
- Jangan melanjutkan ke milestone berikutnya sebelum milestone saat ini selesai dan diuji.
- Pecah pekerjaan besar menjadi tugas kecil yang dapat diverifikasi.

### 3.2 Follow Project Documentation

- Ikuti kebutuhan dalam `PRD.md`.
- Ikuti rancangan dalam `TECHNICAL_DESIGN.md`.
- Ikuti urutan dan acceptance criteria dalam `TASKS.md`.
- Jangan menambahkan fitur yang tidak termasuk ruang lingkup tanpa persetujuan pengguna.
- Jika terdapat konflik antar dokumen, jelaskan konflik dan minta keputusan sebelum mengubah implementasi.

### 3.3 Keep It Simple

- Gunakan kode yang mudah dibaca dan dipahami mahasiswa pemula.
- Hindari abstraksi yang tidak diperlukan.
- Hindari overengineering.
- Gunakan penamaan variabel dan fungsi yang deskriptif.
- Utamakan implementasi sederhana, modular, dan mudah diuji.

### 3.4 Educational Approach

Pengguna sedang mempelajari pemrograman dan matematika diskrit.

Oleh karena itu:

- Jelaskan fungsi kode yang dibuat.
- Jelaskan alasan penggunaan algoritma.
- Jelaskan bagian penting dari implementasi.
- Jangan menyembunyikan kompleksitas algoritma di balik library.
- Berikan penjelasan yang dapat membantu pengguna memahami dan mempresentasikan proyek.

---

## 4. Graph Algorithm Rules

Seluruh algoritma utama wajib diimplementasikan sendiri menggunakan Python.

Algoritma yang harus tersedia:

1. Degree Calculation.
2. Depth-First Search (DFS).
3. Connected Components.
4. Breadth-First Search (BFS).
5. Shortest Path Reconstruction.

### 4.1 Graph Model

Gunakan model:

`G = (V, E)`

Ketentuan:

- Undirected graph.
- Unweighted graph.
- No self-loop.
- No duplicate edges.
- Setiap vertex memiliki ID unik.
- Setiap edge menghubungkan dua vertex yang valid.

### 4.2 Data Representation

Gunakan adjacency list sebagai struktur data utama algoritma.

Contoh:

```python
adjacency_list = {
    "A": ["B", "C"],
    "B": ["A", "C"],
    "C": ["A", "B", "D"],
    "D": ["C"],
    "E": [],
}
```

### 4.3 Algorithm Requirements

**Degree**
- Menghitung jumlah tetangga setiap vertex.
- Vertex tanpa tetangga memiliki degree 0.

**DFS**
- Mengunjungi vertex yang dapat dijangkau dari vertex awal.
- Menggunakan visited set untuk mencegah kunjungan berulang.

**Connected Components**
- Menggunakan DFS.
- Setiap vertex harus termasuk tepat satu komponen.
- Vertex terisolasi dihitung sebagai komponen tersendiri.

**BFS**
- Menggunakan queue.
- Menggunakan visited set.
- Menyimpan parent untuk rekonstruksi jalur.
- Menghasilkan shortest path berdasarkan jumlah edge.

### 4.4 Complexity

Target kompleksitas:

| Algorithm | Complexity |
|---|---|
| Degree Calculation | O(V + E) |
| DFS | O(V + E) |
| Connected Components | O(V + E) |
| BFS | O(V + E) |

---

## 5. Backend Rules

Gunakan Flask untuk menangani HTTP request dan REST API.

Ketentuan:

- Pisahkan route API dari implementasi algoritma.
- Simpan algoritma dalam modul `graph/algorithms.py`.
- Gunakan JSON untuk request dan response.
- Validasi semua data yang diterima backend.
- Jangan hanya mengandalkan validasi frontend.
- Gunakan HTTP status code yang sesuai.
- Tangani error dengan response yang konsisten.
- Jangan mengirim traceback atau informasi internal server kepada pengguna.

Backend bersifat stateless.

Artinya:
- Backend tidak menyimpan data graf secara permanen.
- Setiap request analisis membawa data graf yang dibutuhkan.
- Hasil analisis dikembalikan dalam JSON.

---

## 6. Frontend Rules

Gunakan HTML, CSS, dan JavaScript biasa.

Ketentuan:

- Pisahkan struktur HTML, styling, dan logika JavaScript.
- Gunakan file JavaScript modular sesuai tanggung jawabnya.
- Gunakan `api.js` untuk komunikasi dengan backend.
- Gunakan `graph.js` untuk visualisasi Cytoscape.js.
- Gunakan `storage.js` untuk pengelolaan localStorage.
- Gunakan `app.js` untuk mengatur interaksi utama.
- Pastikan tampilan responsif.
- Tampilkan pesan error yang mudah dipahami.
- Hindari manipulasi DOM yang tidak diperlukan.

### Cytoscape.js

Cytoscape.js hanya bertanggung jawab untuk:

- Menampilkan nodes.
- Menampilkan edges.
- Menampilkan label anggota.
- Mengatur layout graf.
- Memberikan penanda visual pada anggota terisolasi.
- Menyorot jalur terpendek.

Jangan menggunakan Cytoscape.js untuk menggantikan algoritma Python.

---

## 7. Data Validation

Pastikan validasi berikut diterapkan:

### Vertex Validation

- ID tidak boleh kosong.
- ID harus unik.
- Nama tidak boleh kosong.
- Nama harus berupa string.

### Edge Validation

- Source harus terdaftar.
- Target harus terdaftar.
- Source dan target tidak boleh sama.
- Edge tidak boleh duplikat.
- Edge diperlakukan sebagai hubungan dua arah.

### Shortest Path Validation

- Vertex awal harus tersedia.
- Vertex tujuan harus tersedia.
- Jika tidak ditemukan jalur, kembalikan hasil `found: false`.
- Jika vertex awal dan tujuan sama, hasilnya adalah jalur satu vertex dengan jarak 0.

---

## 8. Testing Rules

Gunakan pytest untuk pengujian backend dan algoritma.

Ketentuan:

- Setiap algoritma harus memiliki unit test.
- Uji kondisi normal dan edge cases.
- Uji dataset referensi dari `PRD.md`.
- Jangan menghapus test hanya untuk membuat seluruh pengujian lulus.
- Perbaiki implementasi apabila hasil tidak sesuai ekspektasi.
- Jalankan pengujian setelah perubahan yang memengaruhi perilaku aplikasi.

Dataset referensi harus menghasilkan:

| Parameter | Expected Result |
|---|---|
| Vertices | 6 |
| Edges | 5 |
| Degree A | 2 |
| Degree B | 2 |
| Degree C | 3 |
| Degree D | 2 |
| Degree E | 1 |
| Degree F | 0 |
| Components | 2 |
| Isolated Member | Fajar |
| Shortest Path A-E | A-C-D-E |
| Distance A-E | 3 |

Jika terdapat beberapa shortest path dengan panjang sama, semua jalur tersebut valid.

---

## 9. Git and File Management

- Jangan menghapus file yang sudah ada tanpa alasan.
- Jangan menimpa perubahan pengguna tanpa persetujuan.
- Jangan memasukkan `.venv/` ke repository.
- Jangan memasukkan file cache Python.
- Jangan memasukkan file konfigurasi rahasia.
- Gunakan `.gitignore` dengan benar.
- Buat perubahan secara bertahap dan mudah ditinjau.
- Jangan melakukan commit otomatis tanpa diminta pengguna.

---

## 10. Milestone Execution Protocol

Sebelum mengerjakan milestone:

1. Baca deskripsi milestone pada `TASKS.md`.
2. Periksa file yang sudah tersedia.
3. Identifikasi pekerjaan dan dependensinya.
4. Jelaskan rencana implementasi.
5. Tunggu persetujuan pengguna jika pekerjaan memerlukan perubahan ruang lingkup atau arsitektur.

Setelah mengerjakan milestone:

1. Ringkas perubahan yang dilakukan.
2. Sebutkan file yang dibuat atau diubah.
3. Jalankan pengujian yang relevan.
4. Laporkan hasil pengujian secara jujur.
5. Periksa acceptance criteria.
6. Tandai task selesai hanya jika benar-benar sudah terpenuhi.
7. Jangan melanjutkan milestone berikutnya secara otomatis.

---

## 11. Communication Rules

Gunakan bahasa Indonesia ketika berkomunikasi dengan pengguna.

Ketika memberikan penjelasan:

- Gunakan bahasa teknis yang jelas.
- Hindari penjelasan terlalu abstrak.
- Jelaskan istilah pemrograman yang penting.
- Berikan perintah terminal yang dapat dijalankan.
- Jangan mengklaim pengujian berhasil jika belum dijalankan.
- Jika terdapat beberapa pendekatan, jelaskan perbedaan dan rekomendasinya.

Pengguna ingin memahami implementasi, bukan sekadar menerima kode jadi.

---

## 12. Final Objective

Hasil akhir harus berupa aplikasi web Community Connectivity Analyzer yang:

- Menerapkan konsep matematika diskrit secara benar.
- Mengimplementasikan algoritma graf menggunakan Python.
- Menampilkan jaringan komunitas menggunakan Cytoscape.js.
- Memiliki antarmuka yang mudah digunakan.
- Tidak membutuhkan database server.
- Dapat dijalankan secara lokal.
- Dapat di-deploy pada hosting yang mendukung Python WSGI.
- Memiliki pengujian dan dokumentasi yang memadai.

**End of Instructions**