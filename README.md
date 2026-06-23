# SADAR — Sleep Apnea & Disorder Advanced Reasoning

> **Perhatian:** Aplikasi ini bukan pengganti diagnosis medis. Hasil yang diberikan bersifat indikatif dan perlu dikonsultasikan dengan tenaga kesehatan profesional.

## Daftar Isi

- [Deskripsi Proyek](#deskripsi-proyek)
- [Tampilan Aplikasi](#tampilan-aplikasi)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Struktur Proyek](#struktur-proyek)
- [Fitur Utama](#fitur-utama)
- [Model Machine Learning](#model-machine-learning)
- [API Endpoint](#api-endpoint)
- [Kebutuhan Sistem](#kebutuhan-sistem)
- [Cara Instalasi](#cara-instalasi)
- [Cara Menjalankan](#cara-menjalankan)
- [Penggunaan](#penggunaan)
- [Input & Validasi](#input--validasi)
- [Output & Interpretasi Hasil](#output--interpretasi-hasil)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Catatan Pengembangan](#catatan-pengembangan)
- [Lisensi](#lisensi)

---

## Deskripsi Proyek

**SADAR** adalah aplikasi web berbasis AI untuk mendeteksi indikasi gangguan tidur secara mandiri. Pengguna cukup mengisi formulir kesehatan singkat, lalu sistem akan memproses data tersebut menggunakan model _machine learning_ (XGBoost) untuk memprediksi kondisi tidur dan memberikan rekomendasi personal.

Aplikasi ini dirancang sebagai alat bantu awal (_screening tool_) yang dapat diakses oleh siapa saja tanpa peralatan khusus, dengan antarmuka yang ramah pengguna dalam Bahasa Indonesia.

**Kondisi yang dapat dideteksi:**

- **Insomnia** — gangguan kesulitan memulai atau mempertahankan tidur
- **Sleep Apnea** — gangguan pernapasan berulang saat tidur
- **Pola Tidur Sehat** — tidak terdeteksi indikasi gangguan tidur (_None_)

---

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                      BROWSER (Client)                   │
│                                                         │
│  landingPage.html  →  login.html  →  dashboard.html     │
│                              ↑              ↑           │
│                         style.css     dashboard.js      │
└──────────────────────────────┬──────────────────────────┘
                               │ HTTP POST (JSON)
                               │ http://127.0.0.1:5000
                               ▼
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (Flask / Python)              │
│                                                         │
│   /login  ──►  PostgreSQL (tabel: users)                │
│   /register ─► PostgreSQL (tabel: users)                │
│   /predict ──► XGBoost Model → PostgreSQL               │
│                               (tabel: prediction_history│
└──────────────────────────────┬──────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────┐
│                  MODEL (folder: Model/)                 │
│                                                         │
│   xgboost_sleep_model.pkl                               │
│   le_bmi.pkl  ·  le_gender.pkl  ·  le_target.pkl        │
└─────────────────────────────────────────────────────────┘
```

---

## Struktur Proyek

```
Project-Matkul-AI/
│
├── app.py
│
├── dashboard.html
├── landingPage.html
├── login.html
│
├── css/
│   └── style.css
│
├── js/
│   └── dashboard.js
│
├── Model/
│   ├── xgboost_sleep_model.pkl
│   ├── le_bmi.pkl
│   ├── le_gender.pkl
│   └── le_target.pkl
│
├── venv/
├── .git/
└── README.md
```

### Penjelasan File Utama

**`app.py`**
Backend Flask yang berjalan sebagai API server. Menangani autentikasi pengguna (login/register) dengan hashing password aman menggunakan Werkzeug, memuat model ML dan encoder dari folder `Model/`, menyimpan setiap hasil prediksi ke database PostgreSQL, serta menyediakan endpoint `/predict`, `/login`, dan `/register`.

**`dashboard.html`**
Halaman inti aplikasi setelah login. Menampilkan formulir input data kesehatan, kartu hasil prediksi dengan panel Explainable AI (XAI), visualisasi kontribusi faktor-faktor terhadap prediksi, rekomendasi tindakan yang dipersonalisasi, serta riwayat analisis pengguna.

**`landingPage.html`**
Halaman publik yang menjelaskan fitur dan cara kerja aplikasi, serta informasi tentang jenis gangguan tidur yang dapat terdeteksi.

**`login.html`**
Halaman autentikasi dengan dua mode: _Login_ (masuk) dan _Register_ (buat akun baru). Menyimpan sesi pengguna ke `sessionStorage` browser setelah berhasil masuk.

**`css/style.css`**
Sistem desain global dengan palet warna bertema malam (_dark mode_): `--night`, `--sage`, `--moon`, `--muted`, dsb. Mencakup styling untuk navigasi, tombol, form, kartu, sidebar, tag, dan komponen slider.

**`js/dashboard.js`**
Logika frontend mencakup: pengiriman form ke API backend, mesin komputasi faktor XAI (`computeFactors`), render hasil prediksi dan rekomendasi, manajemen riwayat lokal via `localStorage`, serta inisialisasi profil pengguna dari `sessionStorage`.

---

## Fitur Utama

### Prediksi Gangguan Tidur

Model XGBoost menganalisis 11 parameter kesehatan dan kebiasaan pengguna untuk mengklasifikasikan kondisi tidur ke dalam tiga kategori: Insomnia, Sleep Apnea, atau Pola Sehat.

### Explainable AI (XAI)

Setiap hasil prediksi disertai penjelasan transparan tentang _mengapa_ model menghasilkan kesimpulan tersebut, berupa:

- Peringkat tiga faktor paling berpengaruh dengan visualisasi _progress bar_
- Persentase kontribusi tiap faktor
- Ringkasan narasi keputusan model dalam Bahasa Indonesia

### Rekomendasi Personal

Saran _sleep hygiene_ yang berbeda-beda sesuai hasil prediksi: tips mempertahankan pola sehat, langkah mengatasi insomnia, atau panduan penanganan sleep apnea.

### Riwayat Analisis Lokal

Setiap prediksi tersimpan di `localStorage` browser. Pengguna dapat melihat tren hasil dari waktu ke waktu dan menghapus riwayat kapan saja.

### Riwayat Analisis di Database

Setiap prediksi juga tersimpan secara permanen di tabel `prediction_history` PostgreSQL, terhubung ke akun pengguna yang sedang login.

### Antarmuka Bilingual-Friendly

Seluruh UI disajikan dalam Bahasa Indonesia dengan desain _dark mode_ yang nyaman untuk penggunaan malam hari.

---

## Model Machine Learning

### Algoritma

Model menggunakan **XGBoost (Extreme Gradient Boosting)** yang dilatih untuk klasifikasi multi-kelas gangguan tidur.

### Fitur Input Model

Model menerima 11 fitur setelah preprocessing:

| Nama Fitur di Model       | Sumber Input            | Tipe      |
| ------------------------- | ----------------------- | --------- |
| `Age`                     | Usia                    | Float     |
| `Gender_enc`              | Jenis Kelamin           | Int (0/1) |
| `Sleep Duration`          | Durasi Tidur            | Float     |
| `Quality of Sleep`        | Kualitas Tidur          | Float     |
| `Physical Activity Level` | Aktivitas Fisik         | Float     |
| `Stress Level`            | Tingkat Stres           | Float     |
| `BMI_enc`                 | Kategori BMI            | Float     |
| `Systolic`                | Tekanan Darah Sistolik  | Float     |
| `Diastolic`               | Tekanan Darah Diastolik | Float     |
| `Heart Rate`              | Detak Jantung           | Float     |
| `Daily Steps`             | Langkah Kaki Harian     | Float     |

### Encoder

- **`le_bmi.pkl`** — mengonversi `"Normal"`, `"Overweight"`, `"Obese"` ke nilai numerik
- **`le_gender.pkl`** — referensi encoding gender (diimplementasikan manual: Male=1, Female=0)
- **`le_target.pkl`** — mengonversi indeks prediksi kembali ke label kelas (`None`, `Insomnia`, `Sleep Apnea`)

### Label Output

| Label         | Keterangan                      |
| ------------- | ------------------------------- |
| `None`        | Tidak terdeteksi gangguan tidur |
| `Insomnia`    | Terdeteksi indikasi insomnia    |
| `Sleep Apnea` | Terdeteksi indikasi sleep apnea |

---

## API Endpoint

Base URL (development): `http://127.0.0.1:5000`

### `POST /register`

Mendaftarkan pengguna baru.

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Response sukses (200):**

```json
{
  "status": "success",
  "message": "Registrasi berhasil!",
  "user": { "id": 1, "username": "namapengguna" }
}
```

**Response gagal (400):**

```json
{
  "status": "error",
  "message": "Username sudah digunakan"
}
```

---

### `POST /login`

Autentikasi pengguna yang sudah terdaftar.

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Response sukses (200):**

```json
{
  "status": "success",
  "message": "Login berhasil!",
  "user": { "id": 1, "username": "namapengguna" }
}
```

**Response gagal (401):**

```json
{
  "status": "error",
  "message": "Username atau password salah"
}
```

---

### `POST /predict`

Menjalankan prediksi gangguan tidur dan menyimpan hasilnya ke database.

**Request Body:**

```json
{
  "user_id": 1,
  "age": 30,
  "gender": "Male",
  "sleep_duration": 6.5,
  "quality_of_sleep": 5,
  "physical_activity": 45,
  "stress_level": 7,
  "bmi": "Normal",
  "systolic": 120,
  "diastolic": 80,
  "heart_rate": 72,
  "daily_steps": 6000
}
```

**Response sukses (200):**

```json
{
  "status": "success",
  "prediction": "Insomnia"
}
```

**Response gagal (200 dengan error):**

```json
{
  "status": "error",
  "message": "Pesan error detail"
}
```

---

## Kebutuhan Sistem

### Backend

- Python **3.10** atau lebih baru
- PostgreSQL **13** atau lebih baru

### Paket Python

```
Flask
flask-cors
flask-sqlalchemy
pg8000
werkzeug
joblib
pandas
xgboost
```

### Frontend

- Browser modern (Chrome, Firefox, Edge, Safari versi terbaru)
- JavaScript diaktifkan
- Tidak memerlukan build tools atau bundler

---

## Cara Instalasi

### 1. Clone atau unduh proyek

```bash
git clone <url-repo>
cd Project-Matkul-AI
```

Atau navigasikan ke folder proyek yang sudah ada:

```bash
cd "d:\Kuliah\Semester 4\Artificial Intelligence\Projek\Project-Matkul-AI"
```

### 2. Siapkan Database PostgreSQL

Pastikan PostgreSQL sudah terinstall dan berjalan. Buat database baru:

```sql
CREATE DATABASE sadar;
```

Sesuaikan kredensial database di `app.py` jika diperlukan:

```python
safe_password = urllib.parse.quote_plus("password_anda")
app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql+pg8000://postgres:{safe_password}@localhost:5432/sadar'
```

### 3. Buat Virtual Environment (direkomendasikan)

```bash
python -m venv venv
```

### 4. Aktifkan Virtual Environment

**Windows PowerShell:**

```powershell
venv\Scripts\Activate.ps1
```

**Windows Command Prompt:**

```cmd
venv\Scripts\activate.bat
```

**macOS / Linux:**

```bash
source venv/bin/activate
```

### 5. Install Dependensi

```bash
pip install Flask flask-cors flask-sqlalchemy pg8000 werkzeug joblib pandas xgboost
```

### 6. Pastikan File Model Tersedia

Pastikan folder `Model/` ada dan berisi keempat file berikut:

```
Model/
├── xgboost_sleep_model.pkl
├── le_bmi.pkl
├── le_gender.pkl
└── le_target.pkl
```

---

## Cara Menjalankan

### 1. Jalankan Backend Flask

```bash
python app.py
```

Tabel database (`users` dan `prediction_history`) akan dibuat otomatis pada saat pertama kali dijalankan. Output terminal yang diharapkan:

```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

### 2. Buka Frontend di Browser

Buka file `landingPage.html` langsung di browser, atau gunakan server HTTP lokal agar path relatif bekerja dengan benar:

**Opsi A — buka langsung (paling sederhana):**
Klik dua kali `landingPage.html` atau drag ke jendela browser.

**Opsi B — server HTTP lokal dengan Python:**

```bash
python -m http.server 8080
```

Kemudian buka `http://localhost:8080/landingPage.html` di browser.

**Opsi C — ekstensi Live Server (VS Code):**
Klik kanan pada `landingPage.html` → _Open with Live Server_.

> **Catatan:** Backend Flask (port 5000) dan frontend harus berjalan bersamaan agar prediksi dapat dilakukan.

---

## Penggunaan

1. **Buka `landingPage.html`** — pelajari fitur aplikasi dan jenis gangguan yang dapat dideteksi.

2. **Klik "Mulai Analisis"** untuk menuju halaman login.

3. **Login atau Daftar** di `login.html`:
   - Jika belum punya akun, klik "Belum punya akun? Daftar" untuk mendaftar.
   - Masukkan username dan password, lalu klik tombol masuk.

4. **Isi Formulir di Dashboard** — masukkan data kesehatan berikut:

   | Bagian           | Field                                                                                |
   | ---------------- | ------------------------------------------------------------------------------------ |
   | Data Pribadi     | Usia, Jenis Kelamin                                                                  |
   | Pola Tidur       | Durasi Tidur, Kualitas Tidur, Tingkat Stres, Aktivitas Fisik                         |
   | Indikator Klinis | Kategori BMI, Tekanan Darah Sistolik & Diastolik, Detak Jantung, Langkah Kaki Harian |

5. **Klik "Mulai Analisis AI"** — tunggu respons dari model (biasanya < 2 detik).

6. **Baca Hasil Prediksi:**
   - Label kondisi tidur (Sehat / Insomnia / Sleep Apnea)
   - Panel XAI yang menjelaskan faktor-faktor penentu prediksi
   - Daftar rekomendasi tindakan yang dipersonalisasi

7. **Lihat Riwayat** di bagian bawah dashboard untuk memantau tren analisis dari waktu ke waktu.

---

## Input & Validasi

| Field                   | Tipe    | Rentang/Nilai               | Contoh    |
| ----------------------- | ------- | --------------------------- | --------- |
| Usia                    | Angka   | 1 – 120 tahun               | 30        |
| Jenis Kelamin           | Pilihan | Laki-laki / Perempuan       | Laki-laki |
| Durasi Tidur            | Desimal | 1 – 24 jam                  | 6.5       |
| Kualitas Tidur          | Slider  | 1 – 10                      | 7         |
| Tingkat Stres           | Slider  | 1 – 10                      | 5         |
| Aktivitas Fisik         | Angka   | 0 – 480 menit/hari          | 45        |
| Kategori BMI            | Pilihan | Normal / Overweight / Obese | Normal    |
| Tekanan Darah Sistolik  | Angka   | 80 – 200 mmHg               | 120       |
| Tekanan Darah Diastolik | Angka   | 50 – 130 mmHg               | 80        |
| Detak Jantung Istirahat | Angka   | 40 – 150 BPM                | 72        |
| Langkah Kaki Harian     | Angka   | 0 – 40.000 langkah          | 6000      |

Semua field wajib diisi. Field yang kosong akan ditandai dengan border merah dan fokus akan diarahkan ke field pertama yang kosong.

---

## Output & Interpretasi Hasil

### Label Hasil

| Label                | Ikon | Warna  | Interpretasi                                     |
| -------------------- | ---- | ------ | ------------------------------------------------ |
| Pola Tidur Sehat     | ✅   | Hijau  | Tidak terdeteksi gangguan, pertahankan kebiasaan |
| Indikasi Insomnia    | ⚠️   | Kuning | Perlu perbaikan kebiasaan tidur dan kelola stres |
| Indikasi Sleep Apnea | 🔴   | Merah  | Sangat disarankan konsultasi ke dokter           |

### Panel Explainable AI (XAI)

Menampilkan tiga faktor teratas yang paling memengaruhi prediksi beserta:

- Nilai aktual yang dimasukkan pengguna
- Persentase kontribusi relatif terhadap keputusan model
- Status kualitatif (misalnya: "Sangat Rileks", "Aktif", "Ideal")
- Deskripsi singkat pengaruh faktor tersebut

### Ringkasan Keputusan

Narasi otomatis yang merangkum dua faktor dominan dan menjelaskan apakah keputusan model didominasi satu faktor atau merupakan kombinasi beberapa faktor.

---

## Teknologi yang Digunakan

| Komponen      | Teknologi                                                |
| ------------- | -------------------------------------------------------- |
| Backend       | Python, Flask, Flask-CORS, Flask-SQLAlchemy              |
| Database      | PostgreSQL, pg8000 (driver)                              |
| Model ML      | XGBoost, joblib, pandas                                  |
| Keamanan      | Werkzeug (password hashing bcrypt)                       |
| Frontend      | HTML5, CSS3 (CSS Variables), Vanilla JS                  |
| Font          | Google Fonts — DM Serif Display, DM Sans                 |
| Sesi Pengguna | `sessionStorage` (login), `localStorage` (riwayat lokal) |

---

## Catatan Pengembangan

### Keterbatasan Saat Ini

- Autentikasi tidak menggunakan token/JWT; sesi disimpan di `sessionStorage` yang tidak persisten antar tab.
- Model tidak diperbarui secara _online_; prediksi berdasarkan data latih yang sudah ada.
- Tidak ada mekanisme lupa password.
- Riwayat lokal (`localStorage`) akan hilang jika pengguna membersihkan data browser.

### Saran Pengembangan Lanjutan

- Implementasi JWT untuk autentikasi yang lebih aman dan persisten.
- Tambahkan halaman profil pengguna untuk melihat riwayat analisis dari database.
- Visualisasi tren data (grafik) dari riwayat prediksi antar waktu.
- Tambahkan validasi server-side untuk semua input sebelum diproses model.
- Pertimbangkan deploy ke server cloud (misalnya: Heroku, Railway, atau VPS) agar dapat diakses publik.
- Tambahkan fitur ekspor riwayat analisis ke PDF atau CSV.

### Menjalankan di Lingkungan Berbeda

Jika backend dan frontend berjalan di host atau port yang berbeda, sesuaikan URL endpoint di file berikut:

- `login.html` — baris `fetch("http://127.0.0.1:5000/login")` dan `/register`
- `js/dashboard.js` — baris `fetch("http://127.0.0.1:5000/predict")`

---

## Lisensi

Dokumen dan kode ini disediakan sebagai bagian dari tugas proyek akademik.

**SADAR** · Syifa · Zefa · Ranabil · 2026
