from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ortools.sat.python import cp_model
from fastapi.middleware.cors import CORSMiddleware
import calendar
from datetime import date

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Nurse(BaseModel):
    id: int
    name: str
    role: str 

class RequestOff(BaseModel):
    nurse_id: int
    day: int
    shift_id: int 

class ShiftTargets(BaseModel):
    morning: int
    afternoon: int
    night: int

class ScheduleRequest(BaseModel):
    month: int
    year: int
    nurses: list[Nurse]
    requests: list[RequestOff]
    targets: ShiftTargets

@app.post("/generate-schedule")
def generate_schedule(data: ScheduleRequest):
    print(f"📥 Generating: {data.month}/{data.year} for {len(data.nurses)} Nurses")
    
    _, num_days = calendar.monthrange(data.year, data.month)
    days = list(range(1, num_days + 1))
    
    model = cp_model.CpModel()
    shifts = {} 

    # Pola Rolling: P P S S M M L L
    pattern_sequence = [1, 1, 2, 2, 3, 3, 0, 0] 
    pattern_len = len(pattern_sequence)

    nurse_offsets = {}
    for nurse in data.nurses:
        if nurse.role == "regular":
            nurse_offsets[nurse.id] = model.NewIntVar(0, pattern_len - 1, f'offset_n{nurse.id}')

    for nurse in data.nurses:
        for d in days:
            shifts[(nurse.id, d)] = model.NewIntVar(0, 4, f's_n{nurse.id}_d{d}')

            # 1. HARD CONSTRAINT: REQUEST
            req = next((r for r in data.requests if r.nurse_id == nurse.id and r.day == d), None)
            if req:
                model.Add(shifts[(nurse.id, d)] == req.shift_id)
            else:
                # 2. ROLE STATIC (Karu, Wakaru, Katim -> PAGI)
                # Sesuai gambar: 3 Teratas (Kuning) masuk Pagi terus
                if nurse.role in ["karu", "wakaru", "katim"]:
                    curr_date = date(data.year, data.month, d)
                    is_sunday = curr_date.weekday() == 6
                    if is_sunday:
                        model.Add(shifts[(nurse.id, d)] == 0) # Libur Minggu
                    else:
                        model.Add(shifts[(nurse.id, d)] == 1) # Pagi Senin-Sabtu
                
                # 3. ROLE REGULAR (Rolling)
                else: 
                    pattern_idx = model.NewIntVar(0, pattern_len - 1, f'pidx_n{nurse.id}_d{d}')
                    model.AddModuloEquality(pattern_idx, nurse_offsets[nurse.id] + (d - 1), pattern_len)
                    possible_shifts = [[i, val] for i, val in enumerate(pattern_sequence)]
                    model.AddAllowedAssignments([pattern_idx, shifts[(nurse.id, d)]], possible_shifts)

    # --- PENYEIMBANGAN TARGET ---
    target_map = {
        1: data.targets.morning,   
        2: data.targets.afternoon, 
        3: data.targets.night      
    }

    total_penalties = []

    for d in days:
        for s_type in [1, 2, 3]: 
            workers = []
            for nurse in data.nurses:
                is_working = model.NewBoolVar(f'w_n{nurse.id}_d{d}_s{s_type}')
                model.Add(shifts[(nurse.id, d)] == s_type).OnlyEnforceIf(is_working)
                model.Add(shifts[(nurse.id, d)] != s_type).OnlyEnforceIf(is_working.Not())
                workers.append(is_working)
            
            target = target_map[s_type]
            
            # Hitung selisih dari target
            diff = model.NewIntVar(-20, 20, f'diff_d{d}_s{s_type}')
            model.Add(diff == sum(workers) - target)
            abs_diff = model.NewIntVar(0, 20, f'abs_diff_d{d}_s{s_type}')
            model.AddAbsEquality(abs_diff, diff)
            total_penalties.append(abs_diff)

    model.Minimize(sum(total_penalties))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5.0
    status = solver.Solve(model)

    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        res_data = []
        for nurse in data.nurses:
            nurse_schedule = []
            for d in days:
                val = solver.Value(shifts[(nurse.id, d)])
                label, color, text_color = "L", "bg-white", "text-slate-400"
                if val == 1: label, color, text_color = "P", "bg-white", "text-slate-800 font-bold"
                elif val == 2: label, color, text_color = "S", "bg-green-200", "text-green-800 font-bold"
                elif val == 3: label, color, text_color = "M", "bg-blue-200", "text-blue-800 font-bold"
                elif val == 4: label, color, text_color = "C", "bg-yellow-300", "text-yellow-900 font-bold"

                nurse_schedule.append({
                    "day": d, "shift_id": val, "label": label, "bg_color": color, "text_color": text_color
                })
            res_data.append({"nurse": nurse, "schedule": nurse_schedule})
        return {"status": "SUCCESS", "data": res_data, "days_count": num_days}
    else:
        return {"status": "FAILED", "message": "Gagal. Konflik terlalu berat."}