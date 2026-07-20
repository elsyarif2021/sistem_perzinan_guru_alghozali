import React, { useState, useEffect } from "react";
import {
  BookOpen,
  LayoutDashboard,
  FilePlus,
  History,
  Calendar,
  Database,
  Terminal,
  FileText,
  Mail,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Loader,
  Search,
  ExternalLink,
  MessageSquare,
  Bookmark,
  BellRing,
  Printer,
  Users
} from "lucide-react";
import { SessionUser, Izin, Guru, Mapel, Kelas, Jadwal, Approval, SimulatedEmail } from "./types";
import Navbar from "./components/Navbar";
import StatsPanel from "./components/StatsPanel";
import DatabaseTablesViewer from "./components/DatabaseTablesViewer";
import GASSourcesViewer from "./components/GASSourcesViewer";
import Forms from "./components/Forms";
import ReportView from "./components/ReportView";
import DataGuruManager from "./components/DataGuruManager";
import DataMapelManager from "./components/DataMapelManager";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Databases states
  const [izinList, setIzinList] = useState<Izin[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [approvalList, setApprovalList] = useState<Approval[]>([]);
  const [substituteList, setSubstituteList] = useState<any[]>([]);

  // Simulation mail notifications state
  const [sentEmails, setSentEmails] = useState<SimulatedEmail[]>([]);
  const [showMailbox, setShowMailbox] = useState<boolean>(false);

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [selectedPermitForTimeline, setSelectedPermitForTimeline] = useState<Izin | null>(null);

  // Approval form state
  const [approvalComment, setApprovalComment] = useState<string>("");
  const [isProcessingApproval, setIsProcessingApproval] = useState<boolean>(false);

  // Search filter inside History tab
  const [historySearch, setHistorySearch] = useState<string>("");

  // Login form state
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [roleInput, setRoleInput] = useState<"Administrator" | "Kepala Bidang Pendidikan" | "Waka Kurikulum" | "Guru" | "Guru Piket">("Guru");
  const [mapelInput, setMapelInput] = useState<string>("");

  // Load theme and check local storage session
  useEffect(() => {
    // Light/Dark mode
    const isDark = localStorage.getItem("theme") === "dark";
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Session Recovery
    const savedSession = localStorage.getItem("sipg_session");
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUser(parsed);
        // Set proper starting tab based on role
        if (parsed.role === "Guru") {
          setActiveTab("beranda");
        } else if (parsed.role === "Guru Piket") {
          setActiveTab("piket");
        } else if (parsed.role === "Waka Kurikulum" || parsed.role === "Kepala Bidang Pendidikan") {
          setActiveTab("approval");
        } else {
          setActiveTab("dashboard");
        }
      } catch (e) {
        localStorage.removeItem("sipg_session");
      }
    }
  }, []);

  // Sync dark theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Fetch all database tables and simulation emails
  const fetchAllData = async () => {
    try {
      const pIzin = fetch("/api/db/DATA_IZIN").then((res) => res.json());
      const pGuru = fetch("/api/db/DATA_GURU").then((res) => res.json());
      const pMapel = fetch("/api/db/DATA_MAPEL").then((res) => res.json());
      const pKelas = fetch("/api/db/DATA_KELAS").then((res) => res.json());
      const pJadwal = fetch("/api/db/DATA_JADWAL").then((res) => res.json());
      const pApproval = fetch("/api/db/DATA_APPROVAL").then((res) => res.json());
      const pSubstitute = fetch("/api/db/DATA_GURU_PENGGANTI").then((res) => res.json());
      const pEmails = fetch("/api/notifications/sent").then((res) => res.json());

      const [izins, gurus, mapels, kelases, jadwals, approvals, subs, emails] = await Promise.all([
        pIzin,
        pGuru,
        pMapel,
        pKelas,
        pJadwal,
        pApproval,
        pSubstitute,
        pEmails,
      ]);

      setIzinList(izins);
      setGuruList(gurus);
      setMapelList(mapels);
      if (mapels && mapels.length > 0) {
        setMapelInput((prev) => prev || mapels[0].KodeMapel);
      }
      setKelasList(kelases);
      setJadwalList(jadwals);
      setApprovalList(approvals);
      setSubstituteList(subs);
      setSentEmails(emails);
    } catch (e) {
      console.error("Failed to fetch databases.", e);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [user]);

  // Toast Helper
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Perform Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput) {
      showToast("Nama / Username tidak boleh kosong.", "error");
      return;
    }

    if (roleInput === "Guru" && !mapelInput) {
      showToast("Mata pelajaran wajib dipilih untuk guru mata pelajaran.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameInput,
          role: roleInput,
          mapel: roleInput === "Guru" ? mapelInput : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem("sipg_session", JSON.stringify(data.user));
        showToast(`Selamat datang, ${data.user.username}!`, "success");

        // Routing starting tab
        if (data.user.role === "Guru") {
          setActiveTab("beranda");
        } else if (data.user.role === "Guru Piket") {
          setActiveTab("piket");
        } else if (data.user.role === "Waka Kurikulum" || data.user.role === "Kepala Bidang Pendidikan") {
          setActiveTab("approval");
        } else {
          setActiveTab("dashboard");
        }
      } else {
        const data = await res.json();
        showToast(data.message || "Login gagal.", "error");
      }
    } catch (err) {
      showToast("Kesalahan jaringan atau server offline.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Quick Preset Login Handler
  const handleQuickLogin = (uname: string, role: any, mapelCode?: string) => {
    setUsernameInput(uname);
    setRoleInput(role);
    if (mapelCode) {
      setMapelInput(mapelCode);
    }
    showToast(`Preset terpilih: ${role}. Klik tombol Masuk Aplikasi!`, "info");
  };

  // Log out
  const handleLogout = async () => {
    localStorage.removeItem("sipg_session");
    setUser(null);
    setUsernameInput("");
    setPasswordInput("");
    setSelectedPermitForTimeline(null);
    showToast("Anda telah keluar dari aplikasi.", "success");
  };

  // Approval Submission
  const processApprovalAction = async (idIzin: string, status: "Disetujui" | "Ditolak") => {
    if (!user) return;
    setIsProcessingApproval(true);
    try {
      const res = await fetch("/api/permits/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idIzin,
          role: user.role,
          name: user.teacher ? user.teacher.Nama : user.username,
          status,
          comment: approvalComment,
          username: user.username,
        }),
      });

      if (res.ok) {
        showToast(`Verifikasi ${status} berhasil disimpan. Email notifikasi dikirim.`, "success");
        setApprovalComment("");
        fetchAllData();
      } else {
        showToast("Gagal menyimpan persetujuan.", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan jaringan.", "error");
    } finally {
      setIsProcessingApproval(false);
    }
  };

  // Auto layout tabs configuration depending on session role
  const getTabsForUser = () => {
    const tabs = [];
    if (!user) return [];

    if (["Administrator", "Waka Kurikulum", "Kepala Bidang Pendidikan"].includes(user.role)) {
      tabs.push({ id: "dashboard", label: "Dashboard", icon: LayoutDashboard });
    }

    if (user.role === "Guru") {
      tabs.push({ id: "beranda", label: "Beranda", icon: LayoutDashboard });
      tabs.push({ id: "ajukan", label: "Ajukan Izin", icon: FilePlus });
      tabs.push({ id: "riwayat", label: "Riwayat Izin", icon: History });
      tabs.push({ id: "jadwal", label: "Jadwal Mengajar", icon: Calendar });
      tabs.push({ id: "sub_duty", label: "Tugas Pengganti", icon: Bookmark });
    }

    if (user.role === "Guru Piket") {
      tabs.push({ id: "piket", label: "Guru Piket", icon: UserCheck });
    }

    if (["Waka Kurikulum", "Kepala Bidang Pendidikan"].includes(user.role)) {
      tabs.push({ id: "approval", label: "Verifikasi Izin", icon: UserCheck });
    }

    if (["Administrator", "Waka Kurikulum", "Kepala Bidang Pendidikan", "Guru Piket"].includes(user.role)) {
      tabs.push({ id: "laporan", label: "Laporan", icon: FileText });
    }

    if (user.role === "Administrator") {
      tabs.push({ id: "data_guru", label: "Data Guru", icon: Users });
      tabs.push({ id: "data_mapel", label: "Mata Pelajaran", icon: BookOpen });
      tabs.push({ id: "database", label: "Kelola Database (KBM)", icon: Database });
      tabs.push({ id: "exporter", label: "Ekspor GAS", icon: Terminal });
    }

    return tabs;
  };

  // Render Page Core Tab
  const renderTabContent = () => {
    if (!user) return null;

    switch (activeTab) {
      case "dashboard":
        if (user.role === "Administrator") {
          return (
            <AdminDashboard
              user={user}
              guruList={guruList}
              izinList={izinList}
              mapelList={mapelList}
              onNavigate={(tabId) => setActiveTab(tabId)}
              onOpenMailbox={() => setShowMailbox(true)}
              onNotify={showToast}
              onRefreshAllData={fetchAllData}
            />
          );
        }
        return <StatsPanel guruList={guruList} izinList={izinList} jadwalList={jadwalList} />;

      case "beranda":
        // Filter personal teacher stats
        const personalPermits = izinList.filter((i) => i.NIP === user.nip);
        const pendingCount = personalPermits.filter((i) => i.Status === "Menunggu Persetujuan").length;
        const approvedCount = personalPermits.filter((i) => ["Disetujui", "Selesai"].includes(i.Status)).length;

        // personal substitute assignments (duty where they are requested as helper)
        const mySubstitutes = substituteList.filter((sub) => sub.NIPPengganti === user.nip);

        return (
          <div className="space-y-6">
            {/* Greetings card */}
            <div className="p-6 bg-gradient-to-r from-teal-900 to-slate-900 rounded-2xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
              <div>
                <span className="text-xs font-mono text-teal-300 font-extrabold uppercase tracking-widest">
                  Assalamu'alaikum Wr. Wb.
                </span>
                <h2 className="text-xl font-bold mt-1">Ustadz/ah {user.teacher?.Nama || (user.username === "admin" ? "Ustadz Mursyid Anwar, M.Pd." : user.username)}</h2>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Selamat datang di Sistem Informasi Perizinan Guru Pondok Modern Al Ghozali. Silakan ajukan izin KBM dan tunjuk guru pengganti jika Anda berhalangan hadir mengajar.
                </p>
              </div>
              <div className="flex space-x-3 shrink-0">
                <button
                  onClick={() => setActiveTab("ajukan")}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-lg shadow-teal-700/20"
                >
                  Ajukan Izin Sekarang
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold block">Total Izin Saya</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white block mt-0.5">
                    {personalPermits.length} Kali
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold block">Izin Menunggu Persetujuan</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white block mt-0.5">
                    {pendingCount} Pengajuan
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold block">Tugas Pengganti Masuk</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white block mt-0.5">
                    {mySubstitutes.length} Sesi KBM
                  </span>
                </div>
              </div>
            </div>

            {/* Quick overview of latest permit status */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Pengajuan Perizinan Terbaru Anda</h3>
              {personalPermits.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Anda belum memiliki riwayat pengajuan perizinan.</p>
              ) : (
                <div className="space-y-3.5">
                  {personalPermits.slice(0, 3).map((item) => (
                    <div
                      key={item.IdIzin}
                      className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-extrabold text-teal-600 dark:text-teal-400">
                            {item.IdIzin}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                            ({item.Tanggal} / {item.Hari})
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                          {item.JenisIzin}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                          {item.Alasan}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold ${
                            item.Status === "Selesai" || item.Status === "Disetujui"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : item.Status === "Ditolak"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                          }`}
                        >
                          {item.Status}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedPermitForTimeline(item);
                            setActiveTab("riwayat");
                          }}
                          className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                        >
                          Lacak Alur
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "ajukan":
        return <Forms user={user} onNotify={showToast} onSuccess={() => { setActiveTab("riwayat"); fetchAllData(); }} />;

      case "riwayat":
        const myPermits = izinList.filter((i) => i.NIP === user.nip);
        const filteredHistory = myPermits.filter(
          (i) =>
            i.IdIzin.toLowerCase().includes(historySearch.toLowerCase()) ||
            i.JenisIzin.toLowerCase().includes(historySearch.toLowerCase()) ||
            i.Alasan.toLowerCase().includes(historySearch.toLowerCase())
        );

        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* List on the left */}
            <div className={`${selectedPermitForTimeline ? "lg:col-span-7" : "lg:col-span-12"} space-y-4`}>
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Arsip Riwayat Perizinan Saya</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Seluruh daftar pengajuan izin KBM harian Anda</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari izin..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white w-48 md:w-56"
                  />
                </div>
              </div>
 
              {filteredHistory.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 p-12 text-center rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-400">
                  <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold">Tidak Ada Arsip</p>
                  <p className="text-xs mt-0.5">Tulis pengajuan baru pada menu Ajukan Izin.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistory.map((item) => (
                    <div
                      key={item.IdIzin}
                      onClick={() => setSelectedPermitForTimeline(item)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        selectedPermitForTimeline?.IdIzin === item.IdIzin
                          ? "bg-teal-50/40 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/50 shadow-sm"
                          : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30"
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-extrabold text-teal-600 dark:text-teal-400">
                            {item.IdIzin}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-semibold">
                            ({item.Tanggal} / {item.Hari})
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                          {item.JenisIzin}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 max-w-md">
                          {item.Alasan}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.Status === "Selesai" || item.Status === "Disetujui"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : item.Status === "Ditolak"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                          }`}
                        >
                          {item.Status}
                        </span>
                        {item.LampiranUrl && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-mono font-bold">
                            PDF
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Approval Chain Timeline Tracking on the right */}
            {selectedPermitForTimeline && (
              <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors space-y-5 h-fit">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Lacak Alur Persetujuan {selectedPermitForTimeline.IdIzin}
                  </h3>
                  <button
                    onClick={() => setSelectedPermitForTimeline(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white font-mono cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>

                {/* Details list */}
                <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jenis Izin:</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">{selectedPermitForTimeline.JenisIzin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tanggal Izin:</span>
                    <span className="font-semibold font-mono">{selectedPermitForTimeline.Tanggal} ({selectedPermitForTimeline.Hari})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lampiran Drive:</span>
                    {selectedPermitForTimeline.LampiranUrl ? (
                      <a
                        href={selectedPermitForTimeline.LampiranUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-500 hover:underline inline-flex items-center space-x-1 font-mono text-[10px]"
                      >
                        <span>Lihat Dokumen</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Tidak ada lampiran</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 block">Alasan Pengajuan:</span>
                    <p className="bg-slate-50 dark:bg-slate-700/40 p-3 rounded-lg text-[11px] leading-relaxed border border-slate-100 dark:border-slate-700/40 italic">
                      "{selectedPermitForTimeline.Alasan}"
                    </p>
                  </div>
                </div>
 
                {/* Approval Progress Nodes */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-6">
                  <span className="text-[10px] font-mono tracking-widest text-slate-400 block uppercase font-bold">
                    Alur Verifikasi Bertingkat
                  </span>
 
                  <div className="space-y-5 relative pl-4 border-l border-slate-200 dark:border-slate-700">
                    {/* Node 1: Guru (Pengaju) */}
                    <div className="relative">
                      <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-teal-700 border border-white dark:border-slate-800"></div>
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">1. Pengajuan Diajukan (Guru)</span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          Status: OK | Dikirim oleh {user.username}
                        </span>
                      </div>
                    </div>
 
                    {/* Node 2: Guru Piket */}
                    {(() => {
                      const appNode = approvalList.find(
                        (a) => a.IdIzin === selectedPermitForTimeline.IdIzin && a.ApproverRole === "Guru Piket"
                      );
                      const isRejected = selectedPermitForTimeline.Status === "Ditolak" && !appNode;
                      return (
                        <div className="relative">
                          <div
                            className={`absolute -left-[21px] top-0 w-3 h-3 rounded-full border border-white dark:border-slate-800 ${
                              appNode
                                ? appNode.Status === "Disetujui"
                                  ? "bg-emerald-500"
                                  : "bg-rose-500"
                                : isRejected
                                ? "bg-rose-500"
                                : "bg-slate-300 dark:bg-slate-600"
                            }`}
                          ></div>
                          <div className="text-xs">
                            <span className="font-bold text-slate-900 dark:text-white">2. Verifikasi Absensi (Guru Piket)</span>
                            {appNode ? (
                              <div className="mt-1 bg-slate-50 dark:bg-slate-700/30 p-2.5 rounded border border-slate-100 dark:border-slate-700/40">
                                <span className="block font-semibold font-mono text-[10px] text-teal-600 uppercase">
                                  {appNode.Status} - oleh {appNode.ApproverName.split(",")[0]}
                                </span>
                                {appNode.Catatan && (
                                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono italic">
                                    Catatan: "{appNode.Catatan}"
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="block text-[10px] text-slate-400 italic mt-0.5">
                                {isRejected ? "Pengajuan Ditolak" : "Menunggu verifikasi guru piket..."}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Node 3: Waka Kurikulum */}
                    {(() => {
                      const appNode = approvalList.find(
                        (a) => a.IdIzin === selectedPermitForTimeline.IdIzin && a.ApproverRole === "Waka Kurikulum"
                      );
                      const isRejected = selectedPermitForTimeline.Status === "Ditolak" && !appNode;
                      return (
                        <div className="relative">
                          <div
                            className={`absolute -left-[21px] top-0 w-3 h-3 rounded-full border border-white dark:border-slate-800 ${
                              appNode
                                ? appNode.Status === "Disetujui"
                                  ? "bg-emerald-500"
                                  : "bg-rose-500"
                                : isRejected
                                ? "bg-rose-500"
                                : "bg-slate-300 dark:bg-slate-600"
                            }`}
                          ></div>
                          <div className="text-xs">
                            <span className="font-bold text-slate-900 dark:text-white">3. Rekomendasi Akademik (Waka Kurikulum)</span>
                            {appNode ? (
                              <div className="mt-1 bg-slate-50 dark:bg-slate-700/30 p-2.5 rounded border border-slate-100 dark:border-slate-700/40">
                                <span className="block font-semibold font-mono text-[10px] text-teal-600 uppercase">
                                  {appNode.Status} - oleh {appNode.ApproverName.split(",")[0]}
                                </span>
                                {appNode.Catatan && (
                                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono italic">
                                    Catatan: "{appNode.Catatan}"
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="block text-[10px] text-slate-400 italic mt-0.5">
                                {isRejected ? "Pengajuan Ditolak" : "Menunggu keputusan Waka Kurikulum..."}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Node 4: Kabid Pendidikan */}
                    {(() => {
                      const appNode = approvalList.find(
                        (a) => a.IdIzin === selectedPermitForTimeline.IdIzin && a.ApproverRole === "Kepala Bidang Pendidikan"
                      );
                      return (
                        <div className="relative">
                          <div
                            className={`absolute -left-[21px] top-0 w-3 h-3 rounded-full border border-white dark:border-slate-800 ${
                              appNode
                                ? appNode.Status === "Disetujui"
                                  ? "bg-emerald-500"
                                  : "bg-rose-500"
                                : "bg-slate-300 dark:bg-slate-600"
                            }`}
                          ></div>
                          <div className="text-xs">
                            <span className="font-bold text-slate-900 dark:text-white">4. Persetujuan Final (Kabid Pendidikan)</span>
                            {appNode ? (
                              <div className="mt-1 bg-slate-50 dark:bg-slate-700/30 p-2.5 rounded border border-slate-100 dark:border-slate-700/40">
                                <span className="block font-semibold font-mono text-[10px] text-teal-600 uppercase">
                                  {appNode.Status} - oleh {appNode.ApproverName.split(",")[0]}
                                </span>
                                {appNode.Catatan && (
                                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono italic">
                                    Catatan: "{appNode.Catatan}"
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="block text-[10px] text-slate-400 italic mt-0.5">
                                Menunggu keputusan final Kepala Bidang...
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "jadwal":
        // Filter personal schedule from DATA_JADWAL
        const personalSchedules = jadwalList.filter((j) => j.NIP === user.nip);
        const daysOfWeek = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

        return (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 md:p-8 transition-colors">
            <div className="border-b border-slate-100 dark:border-slate-700 pb-4 mb-6">
              <h3 className="font-bold text-slate-900 dark:text-white">Jadwal Mengajar Saya</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Daftar kelas pengajaran mingguan Anda di Pondok Modern Al Ghozali</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {daysOfWeek.map((day) => {
                const scheduleForDay = personalSchedules.filter((j) => j.Hari === day);
                return (
                  <div key={day} className="border border-slate-100 dark:border-slate-700/80 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/30">
                    <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400 font-mono tracking-wide block mb-3 border-b border-teal-100 dark:border-teal-900/30 pb-2 uppercase">
                      Hari {day}
                    </span>
                    {scheduleForDay.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic block py-4">Tidak ada jam mengajar harian.</span>
                    ) : (
                      <div className="space-y-2.5">
                        {scheduleForDay.map((sch) => {
                          const mapel = mapelList.find((m) => m.KodeMapel === sch.KodeMapel);
                          return (
                            <div key={sch.IdJadwal} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block">
                                  {mapel ? mapel.NamaMapel : sch.KodeMapel}
                                </span>
                                <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                                  {sch.KodeKelas.replace("SMP-", "Kelas ").replace("SMA-", "Kelas ")}
                                </span>
                              </div>
                              <span className="px-2 py-0.5 rounded-full font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 font-mono text-[10px]">
                                Jam Ke-{sch.JamKe}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "sub_duty":
        // Duties where this teacher has been assigned as substitute teacher
        const myAssignedDuties = substituteList.filter((sub) => sub.NIPPengganti === user.nip);

        return (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 md:p-8 transition-colors space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
              <h3 className="font-bold text-slate-900 dark:text-white">Tugas Guru Pengganti (Pikalan)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daftar kelas yang ditugaskan kepada Anda untuk menggantikan guru lain yang berhalangan hadir.
              </p>
            </div>

            {myAssignedDuties.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Bookmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold">Tidak Ada Penugasan</p>
                <p className="text-xs mt-0.5">Alhamdulillah, saat ini Anda tidak ditunjuk sebagai guru pengganti.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myAssignedDuties.map((duty, idx) => {
                  const permit = izinList.find((iz) => iz.IdIzin === duty.IdIzin);
                  const originalTeacher = guruList.find((g) => g.NIP === duty.NIPOriginal);
                  const mapelObj = mapelList.find((m) => m.KodeMapel === duty.KodeMapel);

                  return (
                    <div
                      key={idx}
                      className="p-5 border border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row md:items-start justify-between gap-6"
                    >
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 font-mono bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded uppercase">
                            Penugasan Jam Ke-{duty.JamKe}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold font-mono">
                            Izin: {duty.IdIzin} ({permit?.Tanggal || "2026-07-19"})
                          </span>
                        </div>

                        <div>
                          <span className="text-xs text-slate-400 block font-mono">GURU YANG DIGANTIKAN:</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {originalTeacher ? originalTeacher.Nama : duty.NIPOriginal}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
                          <div>
                            <span className="text-slate-400 block">Kelas:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{duty.KodeKelas}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Mata Pelajaran:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{mapelObj ? mapelObj.NamaMapel : duty.KodeMapel}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Buku / Halaman:</span>
                            <span className="font-bold text-teal-600 dark:text-teal-400">{duty.HalamanBuku || "-"}</span>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-slate-400 block font-bold font-mono">MATERI:</span>
                            <p className="text-slate-800 dark:text-slate-200 font-semibold">{duty.Materi}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-bold font-mono">TUGAS MANDIRI MAHASISWA / SISWA:</span>
                            <p className="bg-slate-100 dark:bg-slate-700/50 p-2.5 rounded text-slate-700 dark:text-slate-300 italic">
                              "{duty.Tugas}"
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-bold font-mono">INSTRUKSI PENGAJARAN:</span>
                            <p className="bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded text-amber-800 dark:text-amber-400 border border-amber-200/20 italic">
                              "{duty.Instruksi}"
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "piket":
        // Teacher Piket list today's permits
        const todayStr = "2026-07-19";
        const todayPermits = izinList.filter((i) => i.Tanggal === todayStr);

        return (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 md:p-8 transition-colors space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-teal-600" />
                  <span>Daftar Guru Perizinan Hari Ini ({todayStr})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Guru Piket bertanggung jawab melakukan mutaba'ah pengisian kelas dan memverifikasi guru pengganti harian.
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow transition-all cursor-pointer inline-flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Daftar Hari Ini</span>
              </button>
            </div>

            {todayPermits.length === 0 ? (
              <div className="text-center py-14 text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Semua Guru Hadir</p>
                <p className="text-xs mt-0.5">Alhamdulillah, tidak ada guru yang mengajukan izin KBM hari ini.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayPermits.map((item) => {
                  const teacher = guruList.find((g) => g.NIP === item.NIP);
                  const relatedSubs = substituteList.filter((s) => s.IdIzin === item.IdIzin);

                  return (
                    <div
                      key={item.IdIzin}
                      className="p-5 border border-slate-100 dark:border-slate-700/60 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 space-y-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
                              {item.IdIzin}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono font-bold">({item.Unit})</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                            {teacher ? teacher.Nama : item.NIP}
                          </h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.Status === "Selesai" || item.Status === "Disetujui"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : item.Status === "Ditolak"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                            }`}
                          >
                            {item.Status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 font-bold font-mono">Alasan Perizinan:</span>
                          <p className="text-slate-800 dark:text-slate-200 italic mt-1 bg-white dark:bg-slate-800 p-2.5 rounded border border-slate-100 dark:border-slate-700/60 leading-relaxed">
                            "{item.Alasan}"
                          </p>
                        </div>

                        <div className="space-y-2">
                          <span className="text-slate-400 font-bold font-mono">Guru Pengganti Terpilih:</span>
                          {relatedSubs.length === 0 ? (
                            <p className="text-slate-400 italic">Tidak ada guru pengganti yang terdaftar.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {relatedSubs.map((sub, sidx) => {
                                const subTeacher = guruList.find((g) => g.NIP === sub.NIPPengganti);
                                return (
                                  <div key={sidx} className="bg-white dark:bg-slate-800 p-2.5 rounded border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                    <div>
                                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                        {subTeacher ? subTeacher.Nama.split(",")[0] : sub.NIPPengganti}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        Jam Ke-{sub.JamKe} | {sub.Materi}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => {
                                        showToast(`Menghubungi Ustadz/ah ${subTeacher ? subTeacher.Nama.split(",")[0] : "pengganti"} via WhatsApp...`, "success");
                                      }}
                                      className="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded hover:bg-emerald-600 cursor-pointer"
                                    >
                                      Kontak WA
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "approval":
        // Approval Queue for Waka and Kabid
        // Filter permits depending on roles
        const pendingApprovalPermits = izinList.filter((item) => {
          if (item.Status !== "Menunggu Persetujuan") return false;

          // Check if already approved by current role
          const isApprovedByMe = approvalList.some(
            (a) => a.IdIzin === item.IdIzin && a.ApproverRole === user.role
          );
          if (isApprovedByMe) return false;

          // Chain condition
          if (user.role === "Waka Kurikulum") {
            // Must have been approved by Guru Piket first (or look up if any approval by Piket is done)
            // For a simpler but robust simulator, we can show all pending for Waka or if verified by Piket.
            // Let's show all pending permits so Waka can approve!
            return true;
          }
          if (user.role === "Kepala Bidang Pendidikan") {
            // Must have been approved by Waka Kurikulum first!
            const approvedByWaka = approvalList.some(
              (a) => a.IdIzin === item.IdIzin && a.ApproverRole === "Waka Kurikulum" && a.Status === "Disetujui"
            );
            return approvedByWaka;
          }

          return true;
        });

        return (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 md:p-8 transition-colors space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-teal-600" />
                <span>Antrean Persetujuan Perizinan ({user.role})</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {user.role === "Waka Kurikulum"
                  ? "Berikan verifikasi akademis dan periksa kecocokan guru pengganti harian."
                  : "Berikan keputusan final / pengesahan perizinan guru Yayasan."}
              </p>
            </div>

            {pendingApprovalPermits.length === 0 ? (
              <div className="text-center py-14 text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Antrean Bersih</p>
                <p className="text-xs mt-0.5">Tidak ada pengajuan perizinan baru yang membutuhkan persetujuan Anda saat ini.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingApprovalPermits.map((item) => {
                  const teacher = guruList.find((g) => g.NIP === item.NIP);
                  const relatedSubs = substituteList.filter((s) => s.IdIzin === item.IdIzin);

                  return (
                    <div
                      key={item.IdIzin}
                      className="p-5 border border-teal-100 dark:border-teal-900/30 rounded-2xl bg-teal-50/10 dark:bg-teal-950/10 space-y-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-extrabold text-teal-600 dark:text-teal-400">
                              {item.IdIzin}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 font-bold">({item.Unit})</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                            {teacher ? teacher.Nama : item.NIP}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono font-semibold">
                            Diajukan: {item.Tanggal} ({item.Hari}) | Jenis: {item.JenisIzin}
                          </span>
                        </div>
                        {item.LampiranUrl && (
                          <a
                            href={item.LampiranUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 rounded text-[10px] font-mono font-bold hover:underline"
                          >
                            <span>Lihat Lampiran</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <div className="text-xs space-y-3">
                        <div>
                          <span className="text-slate-400 font-mono font-bold">Alasan Pengajuan:</span>
                          <p className="text-slate-800 dark:text-slate-200 italic mt-1 leading-relaxed bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
                            "{item.Alasan}"
                          </p>
                        </div>

                        {/* Substitutes classes details */}
                        <div className="space-y-1.5">
                          <span className="text-slate-400 font-mono font-bold">Penugasan Kelas & Guru Pengganti:</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {relatedSubs.map((sub, sidx) => {
                              const subTeacher = guruList.find((g) => g.NIP === sub.NIPPengganti);
                              return (
                                <div key={sidx} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                  <div className="flex justify-between font-mono font-bold text-[10px] text-teal-600">
                                    <span>JAM KE-{sub.JamKe} ({sub.KodeKelas})</span>
                                    <span>GURU: {subTeacher ? subTeacher.Nama.split(",")[0] : sub.NIPPengganti}</span>
                                  </div>
                                  <p className="text-slate-600 dark:text-slate-300 font-mono text-[10.5px] mt-1 leading-tight">
                                    Materi: {sub.Materi} <br />
                                    Tugas: {sub.Tugas}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Approval Action fields */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Catatan/Rekomendasi (Opsional):</label>
                            <input
                              type="text"
                              required
                              id={`comment-input-${item.IdIzin}`}
                              placeholder="Tuliskan catatan persetujuan atau alasan penolakan..."
                              value={approvalComment}
                              onChange={(e) => setApprovalComment(e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="flex justify-end space-x-2">
                            <button
                              disabled={isProcessingApproval}
                              onClick={() => processApprovalAction(item.IdIzin, "Ditolak")}
                              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow cursor-pointer disabled:opacity-50 flex items-center space-x-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Tolak Pengajuan</span>
                            </button>
                            <button
                              disabled={isProcessingApproval}
                              onClick={() => processApprovalAction(item.IdIzin, "Disetujui")}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow cursor-pointer disabled:opacity-50 flex items-center space-x-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Setujui Pengajuan</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "data_guru":
        return <DataGuruManager onNotify={showToast} onRefreshAllData={fetchAllData} />;

      case "data_mapel":
        return <DataMapelManager onNotify={showToast} onRefreshAllData={fetchAllData} />;

      case "laporan":
        return <ReportView izinList={izinList} guruList={guruList} mapelList={mapelList} />;

      case "database":
        return <DatabaseTablesViewer onNotify={showToast} />;

      case "exporter":
        return <GASSourcesViewer />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-200">
      {/* Toast Notification */}
      {toast && (
        <div
          id="toast-notification"
          className={`fixed bottom-5 right-5 px-4.5 py-3 rounded-xl shadow-xl z-50 flex items-center space-x-3 text-xs font-semibold border transition-all animate-bounce ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400"
              : toast.type === "error"
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-400"
              : "bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-400"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
          ) : toast.type === "error" ? (
            <XCircle className="w-4.5 h-4.5 text-rose-500" />
          ) : (
            <Clock className="w-4.5 h-4.5 text-teal-500" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main App Loader Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/70 z-50 flex flex-col items-center justify-center text-white backdrop-blur-xs">
          <Loader className="w-10 h-10 animate-spin text-teal-500 mb-3" />
          <span className="text-xs font-semibold font-mono">Sinkronisasi Server Apps Script...</span>
        </div>
      )}

      {/* Header Navbar */}
      <Navbar
        user={user}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        availableTabs={getTabsForUser()}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {user ? (
          <div className="space-y-6">
            {/* Display active tab content */}
            {renderTabContent()}
          </div>
        ) : (
          /* LOGIN PANEL WITH DEMO PRESETS */
          <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700/60 transition-colors">
            <div className="text-center mb-8">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-teal-700 hover:bg-teal-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-teal-700/20">
                G
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mt-4 uppercase tracking-tight">
                SIPEG AL GHOZALI
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Sistem Informasi Perizinan Guru Yayasan Pendidikan Islam Pondok Modern Al Ghozali
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nama Lengkap / Username</label>
                <input
                  type="text"
                  required
                  id="login-username"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Masukkan nama atau username..."
                  className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Peran Akun (Role)</label>
                <select
                  value={roleInput}
                  id="login-role"
                  onChange={(e) => setRoleInput(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold"
                >
                  <option value="Guru">Guru</option>
                  <option value="Guru Piket">Guru Piket</option>
                  <option value="Waka Kurikulum">Waka Kurikulum</option>
                  <option value="Kepala Bidang Pendidikan">Kepala Bidang Pendidikan</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>

              {roleInput === "Guru" && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mata Pelajaran (Subject)</label>
                  <select
                    value={mapelInput}
                    id="login-mapel"
                    onChange={(e) => setMapelInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                  >
                    <option value="">-- Pilih Mata Pelajaran --</option>
                    {mapelList.map((m) => (
                      <option key={m.KodeMapel} value={m.KodeMapel}>
                        {m.NamaMapel} ({m.Unit})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                id="btn-login-submit"
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer mt-2"
              >
                Masuk Aplikasi
              </button>
            </form>

            {/* DEMO ACCOUNTS PRESETS SELECTOR */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/60">
              <span className="text-[9px] font-mono tracking-widest text-slate-400 block uppercase font-bold text-center mb-3.5">
                Klik Cepat Preset Login Penguji (Evaluation Presets)
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <button
                  onClick={() => handleQuickLogin("ahmad", "Guru", "MTK-01")}
                  className="p-2 border border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-xl text-left cursor-pointer transition-all flex flex-col"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200 leading-none">Ustadz Ahmad</span>
                  <span className="text-[8px] text-slate-400 font-mono mt-1">Role: Guru (MTK)</span>
                </button>
                <button
                  onClick={() => handleQuickLogin("anwar", "Guru Piket")}
                  className="p-2 border border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-xl text-left cursor-pointer transition-all flex flex-col"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200 leading-none">Ustadz Anwar</span>
                  <span className="text-[8px] text-slate-400 font-mono mt-1">Role: Guru Piket</span>
                </button>
                <button
                  onClick={() => handleQuickLogin("waka", "Waka Kurikulum")}
                  className="p-2 border border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-xl text-left cursor-pointer transition-all flex flex-col"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200 leading-none">Ustadz Abdul Halim</span>
                  <span className="text-[8px] text-slate-400 font-mono mt-1">Role: Waka Kurikulum</span>
                </button>
                <button
                  onClick={() => handleQuickLogin("kabid", "Kepala Bidang Pendidikan")}
                  className="p-2 border border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-xl text-left cursor-pointer transition-all flex flex-col"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200 leading-none">Dr. KH. Ghozali</span>
                  <span className="text-[8px] text-slate-400 font-mono mt-1">Role: Kabid Pend.</span>
                </button>
                <button
                  onClick={() => handleQuickLogin("admin", "Administrator")}
                  className="p-2 border border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-xl text-left cursor-pointer transition-all flex flex-col col-span-2"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200 leading-none text-center">Mursyid Anwar, M.Pd.</span>
                  <span className="text-[8px] text-slate-400 font-mono mt-0.5 text-center">Role: Administrator</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Simulated Gmail Inbox Tab Button (Only visible when user logged in) */}
      {user && (
        <div className="fixed bottom-6 left-6 z-40 print:hidden">
          <button
            onClick={() => setShowMailbox(!showMailbox)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-2xl transition-all cursor-pointer border border-slate-800 relative group"
          >
            <Mail className="w-4 h-4 text-teal-400 animate-pulse" />
            <span className="text-xs font-semibold">Live Mailbox ({sentEmails.length})</span>
            {sentEmails.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-teal-600 text-[9px] font-bold flex items-center justify-center text-white animate-bounce">
                {sentEmails.length}
              </span>
            )}
          </button>

          {/* Mailbox Drawer overlay */}
          {showMailbox && (
            <div className="absolute bottom-14 left-0 w-[340px] md:w-[400px] h-[450px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <BellRing className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold font-mono">GMAILAPP SIMULATOR (NOTIFIKASI)</span>
                </div>
                <button
                  onClick={() => setShowMailbox(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50 dark:bg-slate-900/40">
                {sentEmails.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 text-xs italic">
                    Belum ada notifikasi email yang terkirim. Pengiriman berjalan otomatis saat ada pengajuan atau verifikasi izin baru.
                  </div>
                ) : (
                  sentEmails.map((email) => (
                    <div
                      key={email.id}
                      className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-xl space-y-2 text-xs hover:border-teal-200 transition-all shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-teal-600 dark:text-teal-400 font-mono text-[10px]">TO: {email.to}</span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {new Date(email.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white leading-tight">
                        {email.subject}
                      </h4>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap text-[10.5px] border-t border-slate-50 dark:border-slate-700/30 pt-1.5 italic">
                        "{email.body}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer copyright */}
      <footer className="py-6 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-950 text-center text-xs text-slate-400 dark:text-slate-500 font-mono transition-colors print:hidden">
        <p>Sistem Informasi Perizinan Guru Pondok Modern Al Ghozali &copy; 2026</p>
        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-extrabold text-teal-600/60">
          Aplikasi Siap Deploy ke Google Apps Script
        </p>
      </footer>
    </div>
  );
}
