# Sistem Penjadwalan Perawat Otomatis (Nurse Scheduling System)

Aplikasi web untuk membuat jadwal dinas perawat secara otomatis menggunakan algoritma **Constraint Programming (Google OR-Tools)**. Dibuat khusus untuk menyesuaikan pola rolling shift (Pagi-Siang-Malam-Libur) serta aturan shift Kepala Ruang & Ketua Tim.

**Fitur Utama:**

* **Generate Otomatis:** Menyeimbangkan jumlah personil tiap shift (Pagi/Siang/Malam).
* **Target Shift Fleksibel:** Bisa atur target (misal: Pagi 4, Siang 3, Malam 4).
* **Role Management:** Mendukung Karu/Katim (Non-shift) dan Pelaksana (Rolling).
* **Unduh Jadwal:** Export hasil jadwal ke gambar (PNG) siap cetak.

---

## 🛠️ Prasyarat (Requirements)

Sebelum memulai, pastikan tools berikut sudah terinstall di Fedora Anda:

1. **Node.js & NPM** (Untuk Frontend)
2. **Python 3.12** (Wajib, karena library `ortools` belum support Python 3.14 default Fedora)

---

## 🚀 Cara Menjalankan (Step-by-Step)

Buka **Dua Terminal** berbeda. Satu untuk Backend, satu untuk Frontend.

### BAGIAN 1: BACKEND (Python API)

Gunakan terminal pertama.

1. **Masuk ke folder backend:**
```bash
cd backend

```


2. **Install Python 3.12 (Khusus Fedora):**
Jika belum punya, install dulu agar kompatibel dengan library matematika.
```bash
sudo dnf install python3.12

```


3. **Buat Virtual Environment (Venv):**
Kita paksa venv menggunakan Python 3.12.
```bash
# Hapus venv lama jika ada
rm -rf venv

# Buat baru
python3.12 -m venv venv

```


4. **Aktifkan Environment:**
```bash
source venv/bin/activate

```


*(Pastikan muncul tulisan `(venv)` di kiri terminal)*.
5. **Install Library:**
```bash
pip install fastapi uvicorn ortools

```


6. **Jalankan Server:**
```bash
uvicorn main:app --reload

```


*Server akan berjalan di: `http://127.0.0.1:8000*`

---

### BAGIAN 2: FRONTEND (React + Vite)

Gunakan terminal kedua.

1. **Masuk ke folder frontend:**
```bash
cd frontend

```


2. **Install Dependencies:**
Ini akan menginstall React, Tailwind, dan html2canvas.
```bash
npm install

```


3. **Jalankan Web:**
```bash
npm run dev

```


4. **Buka di Browser:**
Klik link yang muncul (biasanya **http://localhost:5173**).

---

## 📖 Cara Penggunaan

1. **Atur Target:** Isi target staff per shift di panel atas (Misal: Pagi 4, Siang 3, Malam 4).
2. **Input Request (Opsional):** Jika ada perawat yang minta cuti atau libur di tanggal tertentu, masukkan di panel "Input Request".
3. **Generate:** Klik tombol **GENERATE**. Tunggu sesaat.
4. **Tambah Personil:** Jika ingin menambah perawat baru, gunakan panel di kanan bawah.
5. **Unduh:** Jika jadwal sudah sesuai, klik tombol hijau **📥 Unduh** di header untuk menyimpan gambar jadwal.

---

## ⚠️ Troubleshooting

* **Error `ModuleNotFoundError: No module named 'ortools'`:**
* Pasti Anda menggunakan Python 3.13 atau 3.14. Ulangi langkah pembuatan venv menggunakan `python3.12 -m venv venv`.


* **Tombol Unduh tidak muncul:**
* Pastikan sudah klik "Generate" dulu sampai tabel muncul.
* Pastikan library terinstall: `npm install html2canvas` di folder frontend.


* **Backend error saat Generate:**
* Cek terminal backend. Jika ada error logika, biasanya target shift terlalu tinggi untuk jumlah perawat yang ada. Coba turunkan targetnya.
