from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ortools.sat.python import cp_model
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# --- KONFIGURASI AGAR BISA DIAKSES REACT (CORS) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Membolehkan semua akses (aman untuk development)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- FORMAT DATA (Yang dikirim dari Frontend) ---
class ShiftType(BaseModel):
    id: int
    label: str  # Contoh: "Pagi", "Malam"
    color: str

class RequestOff(BaseModel):
    nurse_index: int
    day: int
    shift_id: int # ID 0 biasanya untuk Libur

class ScheduleRequest(BaseModel):
    num_nurses: int
    num_days: int
    shift_types: list[ShiftType]
    requests: list[RequestOff]
    min_days_off: int 

# --- ENDPOINT UTAMA (API) ---
@app.post("/generate-schedule")
def generate_schedule(data: ScheduleRequest):
    # 1. Inisialisasi Model Matematika
    model = cp_model.CpModel()
    shifts = {}

    # 2. Membuat Variabel: Setiap (perawat, hari) punya satu nilai shift
    for n in range(data.num_nurses):
        for d in range(data.num_days):
            # Domain: 0 sampai jumlah tipe shift - 1
            shifts[(n, d)] = model.NewIntVar(0, len(data.shift_types) - 1, f'shift_n{n}_d{d}')

    # 3. MENERAPKAN REQUEST (Hard Constraint)
    # Jika ada request libur/tukar, paksa variabel bernilai sesuai request
    for req in data.requests:
        model.Add(shifts[(req.nurse_index, req.day)] == req.shift_id)

    # 4. ATURAN JATAH LIBUR (Constraint)
    # Asumsi: ID 0 adalah 'Libur'
    off_shift_id = 0 
    
    for n in range(data.num_nurses):
        is_off = []
        for d in range(data.num_days):
            # Logika Boolean: Apakah hari ini libur? (1=Ya, 0=Tidak)
            b_var = model.NewBoolVar(f'is_off_n{n}_d{d}')
            model.Add(shifts[(n, d)] == off_shift_id).OnlyEnforceIf(b_var)
            model.Add(shifts[(n, d)] != off_shift_id).OnlyEnforceIf(b_var.Not())
            is_off.append(b_var)
        
        # Jumlah hari libur >= minimal yang diminta
        model.Add(sum(is_off) >= data.min_days_off)

    # 5. ATURAN HARIAN (Minimal ada yang jaga)
    # Kita skip shift ID 0 (Libur), sisanya (Pagi/Siang/Malam) harus ada yang isi
    # Contoh sederhana: Setiap hari minimal 1 orang TIDAK LIBUR
    for d in range(data.num_days):
        model.Add(sum([shifts[(n, d)] != 0 for n in range(data.num_nurses)]) >= 1)

    # 6. MENCARI SOLUSI
    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    # 7. MENYUSUN HASIL UNTUK DIKIRIM BALIK
    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        result_schedule = []
        for n in range(data.num_nurses):
            nurse_schedule = []
            for d in range(data.num_days):
                s_val = solver.Value(shifts[(n, d)])
                # Ambil info lengkap shift (label & warna) berdasarkan ID
                shift_info = next((s for s in data.shift_types if s.id == s_val), None)
                nurse_schedule.append(shift_info)
            result_schedule.append({"nurse_id": n, "schedule": nurse_schedule})
        
        return {"status": "SUCCESS", "data": result_schedule}
    else:
        return {"status": "FAILED", "message": "Jadwal bentrok! Tidak ada solusi yang memenuhi semua aturan."}