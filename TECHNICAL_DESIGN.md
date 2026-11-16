# Technical Design Document
# Community Connectivity Analyzer

**Versi:** 1.0  
**Status:** Draft  
**Referensi:** PRD.md

---

## 1. System Architecture

### 1.1 Architecture Overview

Aplikasi menggunakan arsitektur client-server sederhana.

Frontend bertanggung jawab atas interaksi pengguna dan visualisasi graf. Backend bertanggung jawab atas validasi data serta pemrosesan algoritma matematika diskrit.

Alur komunikasi:

1. Pengguna memasukkan data melalui frontend.
2. Frontend membentuk data graf dalam format JSON.
3. Frontend mengirim permintaan ke backend Flask.
4. Backend memvalidasi data.
5. Backend menjalankan algoritma graf.
6. Backend mengirim hasil analisis dalam format JSON.
7. Frontend menampilkan hasil dan memperbarui visualisasi graf.

### 1.2 Architecture Diagram

```text
+-----------------------------+
|          Browser            |
|                             |
|  HTML + CSS + JavaScript    |
|                             |
|  - Input anggota            |
|  - Input relasi             |
|  - Local Storage            |
|  - Graph Visualization      |
+--------------+--------------+
               |
               | HTTP / JSON
               |
+--------------v--------------+
|        Flask Backend        |
|                             |
|  - API Routes               |
|  - Data Validation          |
|  - Graph Processing         |
+--------------+--------------+
               |
               |
+--------------v--------------+
|       Graph Algorithms      |
|                             |
|  - Degree                   |
|  - DFS                      |
|  - Connected Components     |
|  - BFS                      |
+-----------------------------+
```

---

## 2. Technology Stack

| Komponen | Teknologi | Tanggung Jawab |
|---|---|---|
| Backend | Python | Logika aplikasi dan algoritma |
| Framework | Flask | HTTP server dan REST API |
| Frontend | HTML5 | Struktur halaman |
| Styling | CSS3 | Tampilan antarmuka |
| Client Logic | JavaScript | Interaksi dan pengelolaan data |
| Visualization | Cytoscape.js | Visualisasi jaringan graf |
| Data Format | JSON | Pertukaran data |
| Local Storage | Browser localStorage | Penyimpanan sementara |
| Version Control | Git | Pengelolaan kode |

---

## 3. Project Directory Structure

Struktur direktori yang direncanakan:

```text
community-connectivity-analyzer/
│
├── app.py
├── config.py
├── requirements.txt
├── PRD.md
├── TECHNICAL_DESIGN.md
├── TASKS.md
├── AGENTS.md
├── .gitignore
│
├── graph/
│   ├── __init__.py
│   └── algorithms.py
│
├── routes/
│   ├── __init__.py
│   └── graph_routes.py
│
├── templates/
│   └── index.html
│
├── static/
│   ├── css/
│   │   └── style.css
│   │
│   └── js/
│       ├── app.js
│       ├── graph.js
│       ├── api.js
│       └── storage.js
│
└── tests/
    ├── __init__.py
    └── test_algorithms.py
```

### Penjelasan Direktori

**Root directory**
- `app.py`: titik masuk aplikasi Flask.
- `config.py`: konfigurasi aplikasi.
- `requirements.txt`: daftar dependensi Python.
- `PRD.md`: kebutuhan produk.
- `TECHNICAL_DESIGN.md`: rancangan teknis.
- `TASKS.md`: daftar pekerjaan pengembangan.
- `AGENTS.md`: instruksi untuk AI coding agent.

**graph/**
- `algorithms.py`: implementasi seluruh algoritma graf.

**routes/**
- `graph_routes.py`: endpoint API untuk analisis graf.

**templates/**
- `index.html`: halaman utama aplikasi.

**static/css/**
- `style.css`: pengaturan tampilan aplikasi.

**static/js/**
- `app.js`: mengatur alur interaksi utama.
- `graph.js`: mengatur visualisasi Cytoscape.js.
- `api.js`: komunikasi dengan Flask API.
- `storage.js`: pengelolaan localStorage.

**tests/**
- `test_algorithms.py`: pengujian algoritma graf.

---

## 4. Data Model

Aplikasi menggunakan model graf tidak berarah dan tidak berbobot.

### 4.1 Graph Representation

```python
graph = {
    "vertices": [
        {"id": "A", "name": "Andi"},
        {"id": "B", "name": "Budi"},
        {"id": "C", "name": "Citra"}
    ],
    "edges": [
        {"source": "A", "target": "B"},
        {"source": "A", "target": "C"}
    ]
}
```

### 4.2 Data Structure

**Vertex**

Setiap anggota memiliki:
- `id`: identitas unik.
- `name`: nama anggota.

**Edge**

Setiap relasi memiliki:
- `source`: ID anggota pertama.
- `target`: ID anggota kedua.

Relasi dianggap dua arah. Relasi A–B sama dengan B–A.

### 4.3 Adjacency List

Backend mengubah data graf menjadi adjacency list untuk mempermudah proses algoritma.

Contoh:

```python
adjacency_list = {
    "A": ["B", "C"],
    "B": ["A"],
    "C": ["A"]
}
```

Setiap sisi harus muncul pada daftar kedua simpul yang terhubung.

---

## 5. API Design

Backend menyediakan REST API dengan JSON sebagai format pertukaran data.

Base URL:

```text
/api
```

### 5.1 Analyze Graph

**Endpoint:** `POST /api/analyze`

Tujuan: menghitung degree, anggota terisolasi, dan connected components.

Request:

```json
{
  "vertices": [
    {"id": "A", "name": "Andi"},
    {"id": "B", "name": "Budi"},
    {"id": "C", "name": "Citra"}
  ],
  "edges": [
    {"source": "A", "target": "B"},
    {"source": "A", "target": "C"}
  ]
}
```

Response:

```json
{
  "success": true,
  "data": {
    "degrees": {
      "A": 2,
      "B": 1,
      "C": 1
    },
    "isolated_members": [],
    "components": [
      ["A", "B", "C"]
    ],
    "component_count": 1,
    "vertex_count": 3,
    "edge_count": 2
  }
}
```

### 5.2 Find Shortest Path

**Endpoint:** `POST /api/shortest-path`

Tujuan: mencari jalur terpendek antara dua anggota menggunakan BFS.

Request:

```json
{
  "vertices": [
    {"id": "A", "name": "Andi"},
    {"id": "B", "name": "Budi"},
    {"id": "C", "name": "Citra"}
  ],
  "edges": [
    {"source": "A", "target": "B"},
    {"source": "B", "target": "C"}
  ],
  "start": "A",
  "end": "C"
}
```

Response jika ditemukan:

```json
{
  "success": true,
  "data": {
    "found": true,
    "path": ["A", "B", "C"],
    "distance": 2
  }
}
```

Response jika tidak ditemukan:

```json
{
  "success": true,
  "data": {
    "found": false,
    "path": [],
    "distance": null
  }
}
```

### 5.3 Error Response

Jika data tidak valid, backend mengembalikan HTTP 400.

Contoh:

```json
{
  "success": false,
  "error": {
    "message": "Invalid graph data"
  }
}
```

---

## 6. Graph Algorithm Design

Seluruh algoritma utama diimplementasikan menggunakan Python.

### 6.1 Degree

Menghitung jumlah sisi yang terhubung pada setiap simpul.

Input: adjacency list.

Output: dictionary berisi ID anggota dan jumlah koneksi.

Kompleksitas target: O(V + E).

### 6.2 DFS

Menggunakan Depth-First Search untuk menelusuri graf.

Fungsi utama:
- Mengunjungi simpul yang belum dikunjungi.
- Menelusuri tetangga secara mendalam.
- Mendukung pencarian komponen terhubung.

Kompleksitas: O(V + E).

### 6.3 Connected Components

Menggunakan DFS untuk menemukan seluruh komponen terhubung.

Langkah:
1. Tandai seluruh simpul sebagai belum dikunjungi.
2. Pilih simpul yang belum dikunjungi.
3. Jalankan DFS dari simpul tersebut.
4. Kumpulkan semua simpul yang berhasil dikunjungi.
5. Ulangi sampai seluruh simpul dikunjungi.

Kompleksitas: O(V + E).

### 6.4 BFS

Menggunakan Breadth-First Search untuk mencari jalur terpendek pada graf tidak berbobot.

Langkah:
1. Masukkan simpul awal ke queue.
2. Tandai simpul awal sebagai dikunjungi.
3. Periksa tetangga satu per satu.
4. Simpan simpul sebelumnya untuk merekonstruksi jalur.
5. Hentikan pencarian ketika simpul tujuan ditemukan atau seluruh simpul yang dapat dijangkau telah diperiksa.

Kompleksitas: O(V + E).

---

## 7. Frontend Design

### 7.1 Main Interface

Halaman utama dibagi menjadi beberapa bagian:

1. Header: nama dan deskripsi aplikasi.
2. Graph Workspace: visualisasi jaringan.
3. Member Management: pengelolaan anggota.
4. Relationship Management: pengelolaan relasi.
5. Analysis Dashboard: hasil analisis.
6. Shortest Path Tool: pencarian jalur terpendek.

### 7.2 Graph Visualization

Cytoscape.js digunakan untuk:
- Menampilkan simpul dan sisi.
- Menampilkan label nama anggota.
- Membedakan simpul terisolasi.
- Menyorot jalur terpendek.
- Mengatur posisi graf secara otomatis.

### 7.3 User Interaction

Pengguna dapat:
- Menambahkan anggota.
- Menghapus anggota.
- Membuat relasi.
- Menghapus relasi.
- Memuat data contoh.
- Menjalankan analisis.
- Memilih dua anggota untuk pencarian jalur.
- Mereset jaringan.

---

## 8. Data Flow

### 8.1 Input Data

1. Pengguna memasukkan anggota dan relasi.
2. JavaScript memperbarui state graf.
3. Data disimpan di localStorage.
4. Data dikirim ke Flask ketika analisis diminta.

### 8.2 Graph Analysis

1. Flask menerima request JSON.
2. Backend memvalidasi struktur data.
3. Backend membuat adjacency list.
4. Backend menjalankan algoritma.
5. Hasil dikembalikan dalam JSON.

### 8.3 Visualization

1. Frontend menerima hasil analisis.
2. Cytoscape.js menampilkan graf.
3. Anggota terisolasi diberi penanda visual.
4. Jalur terpendek dapat disorot pada graf.

---

## 9. Validation and Error Handling

Backend harus memvalidasi:

- Struktur JSON harus sesuai.
- ID setiap anggota harus unik.
- Nama anggota tidak boleh kosong.
- Source dan target relasi harus terdaftar.
- Relasi tidak boleh menghubungkan simpul dengan dirinya sendiri.
- Relasi duplikat tidak diperbolehkan.
- Simpul awal dan tujuan BFS harus tersedia.

Frontend harus menampilkan pesan kesalahan yang dapat dipahami pengguna.

Backend tidak boleh mempercayai validasi frontend saja.

---

## 10. Testing Strategy

Pengujian dilakukan menggunakan pytest.

### 10.1 Algorithm Testing

Gunakan dataset contoh pada PRD.md.

Hasil yang diharapkan:
- Total anggota: 6.
- Total relasi: 5.
- Degree Citra: 3.
- Degree Fajar: 0.
- Connected Components: 2.
- Isolated Member: Fajar.
- Shortest Path A–E: A–C–D–E.
- Distance A–E: 3.

### 10.2 Edge Case Testing

Uji kondisi berikut:
- Graf kosong.
- Satu simpul tanpa relasi.
- Seluruh simpul saling terhubung.
- Beberapa komponen terpisah.
- Relasi duplikat.
- ID anggota tidak ditemukan.
- Jalur antara dua simpul tidak tersedia.
- Simpul awal dan tujuan sama.

### 10.3 API Testing

Pastikan:
- Endpoint menerima JSON valid.
- Endpoint menolak data tidak valid.
- Response memiliki struktur yang konsisten.
- Status HTTP sesuai kondisi request.

---

## 11. Deployment Design

Aplikasi harus dapat dijalankan di lingkungan lokal dan hosting yang mendukung Python WSGI.

### Local Development

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
flask --app app run --debug
```

### Production Deployment

- Gunakan WSGI server seperti Gunicorn.
- Jangan menjalankan Flask debug server di production.
- Gunakan konfigurasi port dari environment variable `PORT` jika diwajibkan hosting.
- Pastikan static files dan template ikut ter-deploy.
- Tidak memerlukan konfigurasi database.

---

## 12. Technical Constraints

1. Backend menggunakan Python dan Flask.
2. Frontend menggunakan HTML, CSS, dan JavaScript.
3. Visualisasi menggunakan Cytoscape.js.
4. Algoritma graf harus ditulis sendiri dalam Python.
5. Tidak menggunakan database pada versi pertama.
6. Data dikirim melalui JSON.
7. Data sementara disimpan di browser.
8. Tidak menggunakan framework frontend besar seperti React atau Vue.
9. Tidak menambahkan dependensi tanpa alasan teknis yang jelas.
10. Setiap fitur harus memiliki pengujian.

---

**End of Document**