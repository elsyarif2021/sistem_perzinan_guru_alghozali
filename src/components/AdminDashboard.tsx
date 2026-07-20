import React, { useState, useEffect } from "react";
import {
  Users,
  BookOpen,
  UserCheck,
  ShieldAlert,
  Database,
  History,
  Activity,
  PlusCircle,
  FolderSync,
  Mail,
  PieChart,
  BarChart3,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowUpRight,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { Guru, Izin, Mapel, SessionUser } from "../types";

interface Props {
  user: SessionUser;
  guruList: Guru[];
  izinList: Izin[];
  mapelList: Mapel[];
  onNavigate: (tabId: string) => void;
  onOpenMailbox: () => void;
  onNotify: (message: string, type: "success" | "error" | "info") => void;
  onRefreshAllData: () => void;
}

interface LogEntry {
  IdLog: string;
  Timestamp: string;
  User: string;
  Activity: string;
  Details: string;
}

export default function AdminDashboard({
  user,
  guruList,
  izinList,
  mapelList,
  onNavigate,
  onOpenMailbox,
  onNotify,
  onRefreshAllData
}: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logSearch, setLogSearch] = useState<string>("");
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/db/DATA_LOG");
      if (res.ok) {
        const data = await res.json();
        // Sort newest logs first
        const sorted = data.sort(
          (a: LogEntry, b: LogEntry) =>
            new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime()
        );
        setLogs(sorted);
      }
    } catch (e) {
      console.error("Error fetching logs for dashboard:", e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [izinList, guruList, mapelList]);

  // Calculations
  const totalGurus = guruList.length;
  const totalMapels = mapelList.length;
  const totalIzins = izinList.length;

  // Breakdown of Gurus by Unit
  const countGuruSmp = guruList.filter((g) => g.Unit === "SMP").length;
  const countGuruSma = guruList.filter((g) => g.Unit === "SMA").length;
  const countGuruTmmia = guruList.filter((g) => g.Unit === "TMMIA").length;
  const countGuruPondok = guruList.filter((g) => g.Unit === "Pondok").length;

  // Breakdown of Mapels by Unit
  const countMapelSmp = mapelList.filter((m) => m.Unit === "SMP").length;
  const countMapelSma = mapelList.filter((m) => m.Unit === "SMA").length;
  const countMapelTmmia = mapelList.filter((m) => m.Unit === "TMMIA").length;

  // Active piket teachers
  const activePikets = guruList.filter((g) => g.IsPiket);

  // Pending Permits to approve
  const pendingPermitsCount = izinList.filter((i) => i.Status === "Menunggu Persetujuan").length;
  const approvedPermitsCount = izinList.filter((i) => ["Disetujui", "Selesai"].includes(i.Status)).length;
  const rejectedPermitsCount = izinList.filter((i) => i.Status === "Ditolak").length;
  const draftPermitsCount = izinList.filter((i) => i.Status === "Draft").length;

  // Breakdown by Permit Types
  const typeSakit = izinList.filter((i) => i.JenisIzin === "Izin Sakit").length;
  const typeDinas = izinList.filter((i) => i.JenisIzin === "Izin Kedinasan").length;
  const typePribadi = izinList.filter((i) => i.JenisIzin === "Izin Pribadi").length;

  // Filtered Log list
  const filteredLogs = logs.filter((log) => {
    const term = logSearch.toLowerCase();
    return (
      log.User.toLowerCase().includes(term) ||
      log.Activity.toLowerCase().includes(term) ||
      log.Details.toLowerCase().includes(term)
    );
  });

  const handleManualSync = () => {
    onRefreshAllData();
    fetchLogs();
    onNotify("Sinkronisasi data berhasil dijalankan.", "success");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Welcome Admin Bar */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl text-white shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-teal-400 font-extrabold uppercase tracking-widest flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Administrator Console</span>
          </span>
          <h2 className="text-xl font-bold mt-1">Ustadz Mursyid Anwar, M.Pd.</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Selamat datang kembali di panel utama sistem administrasi Pondok Modern Al Ghozali. Gunakan tab ini untuk memantau aktivitas KBM, data guru harian, kurikulum mapel, dan log server.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleManualSync}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700/80 text-white text-xs font-semibold rounded-xl border border-slate-700 cursor-pointer transition-all"
            title="Sinkronisasi manual"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sinkron Data</span>
          </button>
          <button
            onClick={onOpenMailbox}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-teal-600/15 cursor-pointer transition-all"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Simulator Email</span>
          </button>
        </div>
      </div>

      {/* Main Core Widgets Block */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: total teachers */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
              Database Guru
            </span>
            <span className="text-3xl font-black text-slate-900 dark:text-white block">
              {totalGurus}
            </span>
            <div className="flex flex-wrap gap-1 pt-1.5 text-[9px] font-mono font-bold text-slate-500">
              <span className="bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded">
                SMP: {countGuruSmp}
              </span>
              <span className="bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded">
                SMA: {countGuruSma}
              </span>
              <span className="bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded">
                TMMIA: {countGuruTmmia}
              </span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: subjects */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
              Kurikulum Mapel
            </span>
            <span className="text-3xl font-black text-slate-900 dark:text-white block">
              {totalMapels}
            </span>
            <div className="flex flex-wrap gap-1 pt-1.5 text-[9px] font-mono font-bold text-slate-500">
              <span className="bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded">
                SMP: {countMapelSmp}
              </span>
              <span className="bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded">
                SMA: {countMapelSma}
              </span>
              <span className="bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded">
                TMMIA: {countMapelTmmia}
              </span>
            </div>
          </div>
          <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl text-teal-600 dark:text-teal-400">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: active pikets */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-start justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
              Petugas Piket Aktif
            </span>
            <span className="text-3xl font-black text-slate-900 dark:text-white block">
              {activePikets.length}
            </span>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug">
              {activePikets.length > 0 
                ? `Ditugaskan: ${activePikets.map((g) => g.Nama.split(",")[0]).slice(0, 2).join(", ")}${activePikets.length > 2 ? "..." : ""}`
                : "Belum ada guru piket aktif"
              }
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: pending permits */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex items-start justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block font-mono">
              Butuh Verifikasi
            </span>
            <span className="text-3xl font-black text-rose-600 dark:text-rose-400 block">
              {pendingPermitsCount}
            </span>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug">
              {pendingPermitsCount > 0 
                ? "Menunggu persetujuan berjenjang."
                : "Seluruh antrean izin telah bersih."
              }
            </p>
          </div>
          <div className={`p-3 rounded-xl ${pendingPermitsCount > 0 ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" : "bg-slate-50 dark:bg-slate-700 text-slate-400"}`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Database Health and Statistics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Quick Actions and System Distribution stats */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Shortcuts */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-4 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Aksi Pintar Admin</span>
            </h3>
            
            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate("data_guru")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-blue-600">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Kelola Data Guru</span>
                    <span className="text-[10px] text-slate-400">Tambah, edit, hapus guru</span>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition-colors" />
              </button>

              <button
                onClick={() => onNavigate("data_mapel")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-teal-50 dark:bg-teal-950/30 rounded-lg text-teal-600">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Mata Pelajaran</span>
                    <span className="text-[10px] text-slate-400">Atur kurikulum diniyah & umum</span>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition-colors" />
              </button>

              <button
                onClick={() => onNavigate("database")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-violet-50 dark:bg-violet-950/30 rounded-lg text-violet-600">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Kelola Database</span>
                    <span className="text-[10px] text-slate-400">Edit spreadsheet json langsung</span>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition-colors" />
              </button>
            </div>
          </div>

          {/* Database Info Box */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-teal-400" />
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold">Status Server</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-900 font-extrabold text-[8px] uppercase">
                Active
              </span>
            </div>

            <div className="mt-4 space-y-2.5 font-mono text-[10px] text-slate-300">
              <div className="flex justify-between">
                <span>Spreadsheet ID:</span>
                <span className="text-teal-400 text-right truncate max-w-[120px]" title="18gX7-fS7tG71W_h_Z2rOq3rN2_vD0Y1A_T-X">18gX7...fS7t</span>
              </div>
              <div className="flex justify-between">
                <span>Total Perizinan:</span>
                <span>{totalIzins} Baris</span>
              </div>
              <div className="flex justify-between">
                <span>Total Jadwal KBM:</span>
                <span>124 Sesi</span>
              </div>
              <div className="flex justify-between">
                <span>Engine Verifikasi:</span>
                <span>Multi-Level (3-Tier)</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[9px] text-slate-400 leading-snug">
              Database disinkronkan secara real-time dengan Google Sheets API melalui Apps Script Webhook.
            </div>
          </div>
        </div>

        {/* Right column: Charts and searchable Live Logs */}
        <div className="lg:col-span-8 space-y-6">
          {/* visual permit status breakdown */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-4 flex items-center space-x-2">
              <BarChart3 className="w-4.5 h-4.5 text-teal-600" />
              <span>Status Distribusi Perizinan</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700/30 p-3.5 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-400 block font-mono">APPROVED / FINISHED</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{approvedPermitsCount}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Izin Terlaksana</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/30 p-3.5 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-400 block font-mono">PENDING VERIFY</span>
                <span className="text-2xl font-black text-rose-500 mt-1 block">{pendingPermitsCount}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Menunggu Verifikasi</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/30 p-3.5 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-400 block font-mono">REJECTED</span>
                <span className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1 block">{rejectedPermitsCount}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Izin Ditolak</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/30 p-3.5 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-400 block font-mono">DRAFTS</span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">{draftPermitsCount}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Penyusunan</span>
              </div>
            </div>

            {/* Simple visual bar chart of permit reasons */}
            <div className="mt-6 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                Alasan Ketidakhadiran Guru
              </span>
              
              <div className="space-y-2 text-xs">
                {/* Sakit */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Izin Sakit (Butuh Dokumen Pendukung)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{typeSakit} Izin ({totalIzins > 0 ? Math.round((typeSakit / totalIzins) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div style={{ width: `${totalIzins > 0 ? (typeSakit / totalIzins) * 100 : 0}%` }} className="bg-teal-600 h-full rounded-full"></div>
                  </div>
                </div>

                {/* Kedinasan */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Izin Kedinasan (Tugas/Utusan Pondok)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{typeDinas} Izin ({totalIzins > 0 ? Math.round((typeDinas / totalIzins) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div style={{ width: `${totalIzins > 0 ? (typeDinas / totalIzins) * 100 : 0}%` }} className="bg-indigo-600 h-full rounded-full"></div>
                  </div>
                </div>

                {/* Pribadi */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Izin Pribadi (Keluarga / Kepentingan Mendesak)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{typePribadi} Izin ({totalIzins > 0 ? Math.round((typePribadi / totalIzins) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div style={{ width: `${totalIzins > 0 ? (typePribadi / totalIzins) * 100 : 0}%` }} className="bg-amber-600 h-full rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Logs Stream */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                  <History className="w-4.5 h-4.5 text-teal-600" />
                  <span>Log Aktivitas Sistem Real-Time</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Histori audit jejak persetujuan, penambahan guru, & verifikasi harian.</p>
              </div>

              {/* Log Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari user, aksi, detil log..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-[11px] border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>

            {loadingLogs ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mb-2" />
                <span className="text-[10px] font-mono">Mengunduh logs audit trail...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                Tidak ada log aktivitas ditemukan.
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
                {filteredLogs.map((log) => {
                  const dateStr = new Date(log.Timestamp).toLocaleString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "short"
                  });

                  // Color mapping based on action
                  const isApproval = log.Activity.includes("Persetujuan") || log.Activity.includes("Verifikasi");
                  const isRequest = log.Activity.includes("Pengajuan");
                  
                  return (
                    <div
                      key={log.IdLog}
                      className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700/40 text-xs flex items-start justify-between gap-3 hover:border-slate-200 dark:hover:border-slate-600 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase font-mono ${
                            isApproval 
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : isRequest
                              ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                          }`}>
                            {log.Activity}
                          </span>
                          <span className="text-[10px] text-slate-700 dark:text-slate-300 font-bold">
                            User: {log.User}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                          {log.Details}
                        </p>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 font-mono font-semibold block">{dateStr}</span>
                        <span className="text-[8px] text-slate-400 font-mono tracking-wide">ID: {log.IdLog}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
