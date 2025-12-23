import { useState, useRef } from "react";
import html2canvas from "html2canvas";

function App() {
  // CONFIG & STATE
  const [month, setMonth] = useState(10); // Default Oktober
  const [year, setYear] = useState(2024);

  // TARGET Default (5-3-3 untuk 14 org)
  const [targetPagi, setTargetPagi] = useState(5);
  const [targetSiang, setTargetSiang] = useState(3);
  const [targetMalam, setTargetMalam] = useState(3);

  // DATA PERAWAT (Awal 14 Orang)
  const [nurses, setNurses] = useState([
    { id: 1, name: "Wiwiek W.", role: "karu" },
    { id: 2, name: "Siti Indah", role: "wakaru" },
    { id: 3, name: "Grenada", role: "regular" },
    { id: 4, name: "Yunita", role: "regular" },
    { id: 5, name: "Siti Rahayu", role: "regular" },
    { id: 6, name: "Dian Ekawati", role: "regular" },
    { id: 7, name: "Lulu Nur", role: "regular" },
    { id: 8, name: "Rizka Maulia", role: "regular" },
    { id: 9, name: "Gayo Herlambang", role: "regular" },
    { id: 10, name: "Dimas Agil", role: "regular" },
    { id: 11, name: "A'an Tri", role: "regular" },
    { id: 12, name: "Ima Putri", role: "regular" },
    { id: 13, name: "Auliya M", role: "regular" },
    { id: 14, name: "Ubaid Hanif", role: "regular" },
  ]);

  // STATE TAMBAH PERAWAT
  const [newNurseName, setNewNurseName] = useState("");

  const [requests, setRequests] = useState([]);
  const [reqNurseId, setReqNurseId] = useState(3);
  const [reqDate, setReqDate] = useState(1);
  const [reqShift, setReqShift] = useState(4); // Default Cuti

  const [scheduleData, setScheduleData] = useState(null);
  const [daysCount, setDaysCount] = useState(30);
  const [loading, setLoading] = useState(false);

  // REF UNTUK DOWNLOAD GAMBAR
  const printRef = useRef();

  const shiftOpts = [
    { id: 4, label: "Cuti (Kuning)" },
    { id: 0, label: "Libur (L)" },
    { id: 1, label: "Pagi (P)" },
    { id: 2, label: "Siang (S)" },
    { id: 3, label: "Malam (M)" },
  ];

  const isSunday = (d) => new Date(year, month - 1, d).getDay() === 0;
  const getMonthName = (m) =>
    new Date(0, m - 1).toLocaleString("id-ID", { month: "long" });

  // --- FITUR 1: TAMBAH PERAWAT ---
  const handleAddNurse = () => {
    if (!newNurseName.trim()) return alert("Nama tidak boleh kosong!");
    const newId =
      nurses.length > 0 ? Math.max(...nurses.map((n) => n.id)) + 1 : 1;
    const newNurse = { id: newId, name: newNurseName, role: "regular" };
    setNurses([...nurses, newNurse]);
    setNewNurseName(""); // Reset input
  };

  // --- FITUR 2: UNDUH GAMBAR ---
  // ALTERNATIF: Langsung Print / Save as PDF bawaan Browser
  const handleDownloadImage = () => {
    window.print();
  };

  const addRequest = () => {
    const newReq = {
      nurse_id: parseInt(reqNurseId),
      day: parseInt(reqDate),
      shift_id: parseInt(reqShift),
    };
    const filtered = requests.filter(
      (r) => !(r.nurse_id === newReq.nurse_id && r.day === newReq.day)
    );
    setRequests([...filtered, newReq]);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setScheduleData(null);
    try {
      const payload = {
        month: parseInt(month),
        year: parseInt(year),
        nurses: nurses,
        requests: requests,
        targets: {
          morning: parseInt(targetPagi),
          afternoon: parseInt(targetSiang),
          night: parseInt(targetMalam),
        },
      };
      const res = await fetch("http://127.0.0.1:8000/generate-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.status === "SUCCESS") {
        setScheduleData(result.data);
        setDaysCount(result.days_count);
      } else {
        alert(result.message);
      }
    } catch (err) {
      alert("Backend error (Pastikan uvicorn jalan)");
    }
    setLoading(false);
  };

  const countShift = (dayIdx, shiftId) =>
    scheduleData
      ? scheduleData.filter((row) => row.schedule[dayIdx].shift_id === shiftId)
          .length
      : 0;
  const getTarget = (sid) =>
    sid === 1 ? targetPagi : sid === 2 ? targetSiang : targetMalam;

  return (
    <div className="min-h-screen w-screen bg-slate-100 font-sans text-slate-800 pb-20 overflow-x-hidden flex flex-col">
      {/* HEADER UTAMA */}
      <div className="w-full bg-white border-b border-slate-300 px-6 py-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-50 shadow-sm gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
            Jadwal Dinas <span className="text-blue-600">Lantai 1</span>
          </h1>
          <p className="text-xs text-slate-500">
            {nurses.length} Personil Aktif
          </p>
        </div>

        {/* INPUT BULAN & TAHUN */}
        <div className="flex gap-2 items-center bg-slate-50 p-1 rounded-lg border border-slate-200 shadow-inner">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-transparent font-bold text-sm p-2 outline-none cursor-pointer"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i + 1}>
                {new Date(0, i).toLocaleString("id-ID", { month: "long" })}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="bg-transparent font-bold text-sm w-16 p-2 outline-none text-center border-l border-slate-300"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 transition shadow-lg shadow-slate-300"
          >
            {loading ? "..." : "GENERATE JADWAL"}
          </button>
          {/* TOMBOL UNDUH */}
          {scheduleData && (
            <button
              onClick={handleDownloadImage}
              className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition shadow-lg shadow-green-200 flex items-center gap-2"
            >
              <span>📥 Unduh</span>
            </button>
          )}
        </div>
      </div>

      <div className="w-full px-4 py-6 space-y-6">
        {/* PANEL KONTROL (Grid Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. INPUT TARGET */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
              Target Per Shift
            </h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <span className="text-xs text-center block mb-1">Pagi</span>
                <input
                  type="number"
                  value={targetPagi}
                  onChange={(e) => setTargetPagi(e.target.value)}
                  className="w-full border p-2 rounded text-center font-bold"
                />
              </div>
              <div className="flex-1">
                <span className="text-xs text-center block mb-1">Siang</span>
                <input
                  type="number"
                  value={targetSiang}
                  onChange={(e) => setTargetSiang(e.target.value)}
                  className="w-full border p-2 rounded text-center font-bold"
                />
              </div>
              <div className="flex-1">
                <span className="text-xs text-center block mb-1">Malam</span>
                <input
                  type="number"
                  value={targetMalam}
                  onChange={(e) => setTargetMalam(e.target.value)}
                  className="w-full border p-2 rounded text-center font-bold"
                />
              </div>
            </div>
          </div>

          {/* 2. TAMBAH REQUEST */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
              Request / Cuti / Jangkar
            </h3>
            <div className="flex gap-2">
              <select
                className="flex-1 border border-slate-300 p-2 rounded text-sm min-w-[80px]"
                onChange={(e) => setReqNurseId(e.target.value)}
              >
                {nurses.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Tgl"
                className="w-12 border border-slate-300 p-2 rounded text-sm text-center"
                value={reqDate}
                onChange={(e) => setReqDate(e.target.value)}
              />
              <select
                className="w-20 border border-slate-300 p-2 rounded text-sm"
                onChange={(e) => setReqShift(e.target.value)}
              >
                {shiftOpts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button
                onClick={addRequest}
                className="bg-yellow-400 text-yellow-900 font-bold px-3 rounded hover:bg-yellow-500"
              >
                +
              </button>
            </div>
          </div>

          {/* 3. MANAJEMEN PERAWAT (Baru) */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
              Tambah Perawat Baru
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nama Perawat..."
                className="flex-1 border border-slate-300 p-2 rounded text-sm"
                value={newNurseName}
                onChange={(e) => setNewNurseName(e.target.value)}
              />
              <button
                onClick={handleAddNurse}
                className="bg-blue-600 text-white font-bold px-4 rounded hover:bg-blue-700 text-sm"
              >
                Simpan
              </button>
            </div>
            <div className="mt-2 text-[10px] text-slate-400">
              Total: {nurses.length} Orang
            </div>
          </div>
        </div>

        {/* LIST REQUEST AKTIF */}
        {requests.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {requests.map((r, idx) => (
              <div
                key={idx}
                className="flex items-center text-xs bg-white border border-slate-200 px-2 py-1 rounded shadow-sm"
              >
                <span className="font-bold mr-1 text-slate-700">
                  {nurses.find((n) => n.id === r.nurse_id)?.name}
                </span>
                <span className="text-slate-400 mr-1">Tgl {r.day}:</span>
                <span
                  className={`font-bold ${
                    r.shift_id === 4 ? "text-yellow-600" : ""
                  }`}
                >
                  {shiftOpts.find((s) => s.id === r.shift_id).label}
                </span>
                <button
                  onClick={() =>
                    setRequests(requests.filter((_, i) => i !== idx))
                  }
                  className="ml-2 text-red-400 hover:text-red-600 font-bold"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* AREA TABEL HASIL (YANG AKAN DI-SCREENSHOT) */}
        {/* Kita beri ID/Ref disini agar html2canvas memotret div ini */}
        <div
          ref={printRef}
          className="bg-white rounded-xl shadow-xl border border-slate-300 overflow-hidden flex flex-col w-full p-4"
        >
          {/* JUDUL KHUSUS CETAK */}
          {scheduleData && (
            <div className="mb-4 text-center border-b-2 border-slate-800 pb-4">
              <h2 className="text-2xl font-bold text-slate-900 uppercase">
                JADWAL DINAS PERAWAT
              </h2>
              <h3 className="text-lg font-semibold text-slate-600 uppercase">
                BULAN {getMonthName(month)} {year}
              </h3>
            </div>
          )}

          {scheduleData && (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full border-collapse w-full">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold border-b-2 border-slate-300">
                    <th className="p-2 w-48 border-r border-slate-300 text-left pl-4">
                      Nama
                    </th>
                    <th className="p-2 w-16 border-r border-slate-300 text-center">
                      Jabatan
                    </th>
                    {[...Array(daysCount)].map((_, i) => (
                      <th
                        key={i}
                        className={`p-1 min-w-[30px] text-center border-l border-slate-200 ${
                          isSunday(i + 1) ? "bg-red-500 text-white" : ""
                        }`}
                      >
                        {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-xs font-medium">
                  {scheduleData.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-200 h-8">
                      <td className="px-4 border-r border-slate-200 font-bold text-slate-700 whitespace-nowrap">
                        {row.nurse.name}
                      </td>
                      <td className="px-2 border-r border-slate-200 text-center text-[10px] text-slate-400 uppercase">
                        {row.nurse.role.toUpperCase()}
                      </td>
                      {row.schedule.map((shift, dIdx) => (
                        <td
                          key={dIdx}
                          className={`p-0 text-center border-l border-slate-200 ${
                            isSunday(dIdx + 1) && shift.label === "L"
                              ? "bg-red-50"
                              : ""
                          }`}
                        >
                          <div
                            className={`w-full h-8 flex items-center justify-center ${shift.bg_color} ${shift.text_color}`}
                          >
                            {shift.shift_id !== 0 && shift.label}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* FOOTER TOTAL */}
                  {[1, 2, 3].map((sid) => (
                    <tr
                      key={sid}
                      className="bg-slate-800 text-white text-[10px] font-bold h-8"
                    >
                      <td
                        className="px-4 border-r border-slate-600 text-right"
                        colSpan={2}
                      >
                        TOTAL{" "}
                        {sid === 1 ? "PAGI" : sid === 2 ? "SIANG" : "MALAM"}
                      </td>
                      {[...Array(daysCount)].map((_, i) => (
                        <td
                          key={i}
                          className={`text-center border-l border-slate-600 ${
                            countShift(i, sid) < getTarget(sid)
                              ? "text-red-400"
                              : "text-green-400"
                          }`}
                        >
                          {countShift(i, sid)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* FOOTER CETAK */}
          {scheduleData && (
            <div className="mt-4 flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
              <span>Generated by Sistem Jadwal Otomatis</span>
              <span>
                Dicetak pada: {new Date().toLocaleDateString("id-ID")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
