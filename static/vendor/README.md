# Cytoscape.js (Vendored)

Library visualisasi graf untuk Community Connectivity Analyzer. File disimpan
lokal agar aplikasi tidak bergantung pada CDN saat dijalankan atau
didemonstrasikan.

| Keterangan | Nilai |
|---|---|
| Nama | Cytoscape.js |
| Versi | 3.35.0 |
| File | `static/vendor/cytoscape.min.js` |
| Format | UMD (`dist/cytoscape.min.js`), global `cytoscape` |
| Sumber | `https://cdn.jsdelivr.net/npm/cytoscape@3.35.0/dist/cytoscape.min.js` (paket npm resmi `cytoscape`) |
| Tanggal unduh | 18 November 2026 |
| Ukuran | 442.752 byte |
| SHA-256 | `71fa9ebec21a7ca2c40cff6aacc30d1f6464e363662ad4b2c197e1adc770cd94` |
| Lisensi | MIT |

## Lisensi

Banner lisensi asli dipertahankan di bagian atas file:

```text
Copyright (c) 2016-2026, The Cytoscape Consortium.

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## Cara Memverifikasi

```bash
sha256sum static/vendor/cytoscape.min.js
```

Hasil yang diharapkan sama dengan nilai SHA-256 pada tabel di atas.

## Catatan Penggunaan

- Dimuat melalui `<script>` lokal sebelum `static/js/graph.js`.
- Hanya dipakai untuk visualisasi (node, edge, label, layout, penanda visual,
  sorotan jalur).
- Tidak dipakai untuk menghitung degree, connected components, BFS, atau
  shortest path. Seluruh perhitungan tersebut dilakukan backend Python pada
  `graph/algorithms.py`.
