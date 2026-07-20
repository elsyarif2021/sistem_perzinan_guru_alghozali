import { useState, useEffect } from "react";
import { Izin, Guru, Mapel } from "../types";
import {
  FileSpreadsheet,
  Printer,
  FileText,
  Filter,
  Layers,
  BookOpen,
  User,
  Calendar,
  Sparkles,
} from "lucide-react";

interface Props {
  izinList: Izin[];
  guruList: Guru[];
  mapelList: Mapel[];
}

export default function ReportView({ izinList, guruList, mapelList }: Props) {
  // Filters State
  const [filterType, setFilterType] = useState<string>("all"); // "all", "hari", "bulan", "guru", "unit", "mapel", "jenis"
  const [filterValHari, setFilterValHari] = useState<string>("");
  const [filterValBulan, setFilterValBulan] = useState<string>("");
  const [filterValGuru, setFilterValGuru] = useState<string>("");
  const [filterValUnit, setFilterValUnit] = useState<string>("");
  const [filterValMapel, setFilterValMapel] = useState<string>("");
  const [filterValJenis, setFilterValJenis] = useState<string>("");

  // Filtered List
  const [filteredReport, setFilteredReport] = useState<Izin[]>([]);

  useEffect(() => {
    let result = [...izinList];

    if (filterType === "hari" && filterValHari) {
      result = result.filter((i) => i.Tanggal === filterValHari);
    } else if (filterType === "bulan" && filterValBulan) {
      // format YYYY-MM
      result = result.filter((i) => i.Tanggal.startsWith(filterValBulan));
    } else if (filterType === "guru" && filterValGuru) {
      result = result.filter((i) => i.NIP === filterValGuru);
    } else if (filterType === "unit" && filterValUnit) {
      result = result.filter((i) => i.Unit === filterValUnit);
    } else if (filterType === "mapel" && filterValMapel) {
      // In this simulator, mapel is stored per substitute, we can approximate or find if any permit period maps to this mapel code
      // We will mock mapel check or use default
    } else if (filterType === "jenis" && filterValJenis) {
      result = result.filter((i) => i.JenisIzin === filterValJenis);
    }

    setFilteredReport(result);
  }, [
    izinList,
    filterType,
    filterValHari,
    filterValBulan,
    filterValGuru,
    filterValUnit,
    filterValMapel,
    filterValJenis,
  ]);

  // Actions
  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    alert("Simulator: Laporan Berhasil diekspor ke Microsoft Excel (SIPEG_Laporan.xlsx)");
  };

  const handleExportPDF = () => {
    alert("Simulator: Laporan Berhasil diekspor ke Adobe PDF (SIPEG_Laporan.pdf)");
  };

  return (
    <div className="space-y-6">
      {/* Report Filter Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 transition-colors print:hidden">
        <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
          <Filter className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-slate-900 dark:text-white">Filter Laporan Rekapitulasi</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Filter Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kategori Laporan</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="all">Semua Riwayat (Tanpa Filter)</option>
              <option value="hari">Laporan Per Hari</option>
              <option value="bulan">Laporan Per Bulan</option>
              <option value="guru">Laporan Per Guru</option>
              <option value="unit">Laporan Per Unit (SMP/SMA/TMMIA)</option>
              <option value="jenis">Laporan Per Jenis Izin</option>
            </select>
          </div>

          {/* Dynamic Filter Value Selection */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Parameter Filter</label>

            {filterType === "all" && (
              <div className="text-xs text-slate-400 italic py-2">Menampilkan semua arsip perizinan...</div>
            )}

            {filterType === "hari" && (
              <input
                type="date"
                value={filterValHari}
                onChange={(e) => setFilterValHari(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            )}

            {filterType === "bulan" && (
              <input
                type="month"
                value={filterValBulan}
                onChange={(e) => setFilterValBulan(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            )}

            {filterType === "guru" && (
              <select
                value={filterValGuru}
                onChange={(e) => setFilterValGuru(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">-- Pilih Guru --</option>
                {guruList.map((g) => (
                  <option key={g.NIP} value={g.NIP}>
                    {g.Nama}
                  </option>
                ))}
              </select>
            )}

            {filterType === "unit" && (
              <select
                value={filterValUnit}
                onChange={(e) => setFilterValUnit(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">-- Pilih Unit --</option>
                <option value="SMP">SMP Pondok Modern Al Ghozali</option>
                <option value="SMA">SMA Pondok Modern Al Ghozali</option>
                <option value="TMMIA">TMMIA (Tarbiyatul Mu'allimin/at Al-Islamiyah)</option>
              </select>
            )}

            {filterType === "jenis" && (
              <select
                value={filterValJenis}
                onChange={(e) => setFilterValJenis(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">-- Pilih Jenis --</option>
                <option value="Izin Sakit">Izin Sakit</option>
                <option value="Izin Kedinasan">Izin Kedinasan</option>
                <option value="Izin Pribadi">Izin Pribadi</option>
              </select>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-end justify-end space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow cursor-pointer border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Formal Document Layout */}
      <div className="bg-white text-slate-950 p-8 md:p-12 rounded-2xl border border-slate-100 shadow-sm print:border-none print:shadow-none print:p-0 transition-colors">
        {/* Document Header / Kop Surat */}
        <div className="text-center border-b-4 border-slate-900 pb-5 mb-6 relative">
          <div className="absolute left-0 top-0 hidden md:block">
            {/* Elegant logo placeholder */}
            <div className="w-14 h-14 rounded-full border-2 border-slate-900 flex items-center justify-center font-bold text-lg">
              YPI
            </div>
          </div>
          <span className="text-[10px] font-mono tracking-widest block font-extrabold uppercase text-slate-500">
            YAYASAN PENDIDIKAN ISLAM PONDOK MODERN AL GHOZALI
          </span>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1 uppercase">
            SISTEM INFORMASI PERIZINAN GURU (SIPEG)
          </h1>
          <p className="text-[11px] text-slate-600 mt-1 font-mono">
            Jl. Raya Al Ghozali No. 45, Bogor, Jawa Barat | Email: info@alghozali.sch.id
          </p>
        </div>

        {/* Document Metadata */}
        <div className="flex justify-between items-start mb-6 text-xs font-mono">
          <div>
            <span className="block font-bold">Laporan: REKAPITULASI KETIDAKHADIRAN GURU</span>
            <span className="block text-slate-500 mt-1">Kategori Filter: {filterType.toUpperCase()}</span>
          </div>
          <div className="text-right">
            <span className="block text-slate-500">Tanggal Cetak: 2026-07-19</span>
            <span className="block font-bold mt-1">Halaman: 1 dari 1</span>
          </div>
        </div>

        {/* Main Document Table */}
        <div className="overflow-x-auto">
          {filteredReport.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-mono text-xs">
              Tidak ada arsip perizinan yang memenuhi kriteria filter.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-y-2 border-slate-900 bg-slate-50 font-bold font-mono text-slate-800">
                  <th className="px-3 py-2.5">No</th>
                  <th className="px-3 py-2.5">Id Izin</th>
                  <th className="px-3 py-2.5">Tanggal / Hari</th>
                  <th className="px-3 py-2.5">Nama Guru</th>
                  <th className="px-3 py-2.5">Unit</th>
                  <th className="px-3 py-2.5">Jenis Perizinan</th>
                  <th className="px-3 py-2.5">Alasan Ketidakhadiran</th>
                  <th className="px-3 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredReport.map((row, idx) => {
                  const teacher = guruList.find((g) => g.NIP === row.NIP);
                  return (
                    <tr key={row.IdIzin} className="font-mono text-slate-800 hover:bg-slate-50/50">
                      <td className="px-3 py-3">{idx + 1}</td>
                      <td className="px-3 py-3 font-semibold">{row.IdIzin}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {row.Tanggal} <span className="text-[10px] text-slate-400">({row.Hari})</span>
                      </td>
                      <td className="px-3 py-3 font-bold whitespace-nowrap">
                        {teacher ? teacher.Nama.split(",")[0] : row.NIP}
                      </td>
                      <td className="px-3 py-3 font-bold">{row.Unit}</td>
                      <td className="px-3 py-3 font-semibold text-teal-700">{row.JenisIzin}</td>
                      <td className="px-3 py-3 leading-relaxed max-w-xs">{row.Alasan}</td>
                      <td className="px-3 py-3 text-right">
                        <span className="font-bold">{row.Status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Document Footer Signatures */}
        <div className="grid grid-cols-2 gap-12 mt-12 pt-10 border-t border-slate-100 text-xs font-mono text-center">
          <div>
            <span className="block text-slate-500 mb-14">Mengetahui, Waka Kurikulum</span>
            <span className="block font-bold underline">Ustadz H. Abdul Halim, Lc.</span>
            <span className="block text-slate-500 text-[10px] mt-1">NIP. 19780512001</span>
          </div>
          <div>
            <span className="block text-slate-500 mb-14">Bogor, 19 Juli 2026, Kepala Bidang Pendidikan</span>
            <span className="block font-bold underline">Dr. KH. Ghozali, M.A.</span>
            <span className="block text-slate-500 text-[10px] mt-1">NIDN. 0418047501</span>
          </div>
        </div>
      </div>
    </div>
  );
}
