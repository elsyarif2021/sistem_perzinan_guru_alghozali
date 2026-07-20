import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Phone,
  Mail,
  UserCheck,
  Building,
  X,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Guru } from "../types";

interface Props {
  onNotify: (message: string, type: "success" | "error" | "info") => void;
  onRefreshAllData?: () => void;
}

export default function DataGuruManager({ onNotify, onRefreshAllData }: Props) {
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterUnit, setFilterUnit] = useState<string>("All");
  const [filterPiket, setFilterPiket] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Form States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState<Partial<Guru>>({
    NIP: "",
    Nama: "",
    Unit: "SMP",
    NoHP: "",
    Email: "",
    IsPiket: false
  });

  const fetchGuru = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/db/DATA_GURU");
      if (res.ok) {
        const data = await res.json();
        setGuruList(data);
      } else {
        onNotify("Gagal mengambil data guru.", "error");
      }
    } catch (e) {
      onNotify("Kesalahan jaringan saat mengambil data guru.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuru();
  }, []);

  // Filtered List
  const filteredGuru = guruList.filter((g) => {
    const matchesSearch =
      g.Nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.NIP.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.Email && g.Email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.NoHP && g.NoHP.includes(searchQuery));

    const matchesUnit = filterUnit === "All" || g.Unit === filterUnit;
    
    let matchesPiket = true;
    if (filterPiket === "Piket") matchesPiket = g.IsPiket === true;
    if (filterPiket === "Bukan") matchesPiket = g.IsPiket === false;

    return matchesSearch && matchesUnit && matchesPiket;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredGuru.length / itemsPerPage) || 1;
  const paginatedGuru = filteredGuru.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenAdd = () => {
    setModalType("add");
    setFormData({
      NIP: "",
      Nama: "",
      Unit: "SMP",
      NoHP: "",
      Email: "",
      IsPiket: false
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (guru: Guru) => {
    setModalType("edit");
    setFormData({ ...guru });
    setIsModalOpen(true);
  };

  const handleDelete = async (guru: Guru) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data guru: "${guru.Nama}" (NIP: ${guru.NIP})?`)) {
      try {
        const res = await fetch(`/api/db/DATA_GURU/NIP/${guru.NIP}`, {
          method: "DELETE",
        });
        if (res.ok) {
          onNotify("Data guru berhasil dihapus.", "success");
          fetchGuru();
          if (onRefreshAllData) onRefreshAllData();
        } else {
          onNotify("Gagal menghapus data guru.", "error");
        }
      } catch (e) {
        onNotify("Kesalahan koneksi.", "error");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.NIP || !formData.Nama) {
      onNotify("NIP dan Nama Guru wajib diisi.", "error");
      return;
    }

    if (modalType === "add") {
      // Check duplicate
      const exists = guruList.some(
        (g) => String(g.NIP).trim() === String(formData.NIP).trim()
      );
      if (exists) {
        onNotify(`Gagal: Guru dengan NIP "${formData.NIP}" sudah terdaftar.`, "error");
        return;
      }

      try {
        const res = await fetch("/api/db/DATA_GURU", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          onNotify("Guru baru berhasil ditambahkan.", "success");
          setIsModalOpen(false);
          fetchGuru();
          if (onRefreshAllData) onRefreshAllData();
        } else {
          onNotify("Gagal menambahkan guru.", "error");
        }
      } catch (err) {
        onNotify("Gagal menghubungi server.", "error");
      }
    } else {
      // Edit
      try {
        const res = await fetch("/api/db/DATA_GURU/NIP", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          onNotify("Perubahan data guru berhasil disimpan.", "success");
          setIsModalOpen(false);
          fetchGuru();
          if (onRefreshAllData) onRefreshAllData();
        } else {
          onNotify("Gagal menyimpan perubahan.", "error");
        }
      } catch (err) {
        onNotify("Gagal menghubungi server.", "error");
      }
    }
  };

  // Stats calculation
  const totalGuru = guruList.length;
  const countSmp = guruList.filter((g) => g.Unit === "SMP").length;
  const countSma = guruList.filter((g) => g.Unit === "SMA").length;
  const countTmmia = guruList.filter((g) => g.Unit === "TMMIA").length;
  const countPondok = guruList.filter((g) => g.Unit === "Pondok").length;
  const activePiket = guruList.filter((g) => g.IsPiket).length;

  return (
    <div className="space-y-6">
      {/* Header & Counter Widgets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 rounded-2xl transition-colors">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 bg-teal-600 rounded-xl text-white">
            <Users className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Kelola Data Guru Pondok</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Daftar seluruh asatidzah Pondok Modern Al Ghozali, penentuan unit mengajar, dan status piket harian.
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-teal-600/10 transition-all cursor-pointer shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Guru</span>
        </button>
      </div>

      {/* Mini Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 text-center shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Total Guru</span>
          <span className="text-xl font-black text-slate-800 dark:text-white mt-1 block">{totalGuru}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 text-center shadow-sm">
          <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase block tracking-wider">Piket Aktif</span>
          <span className="text-xl font-black text-teal-600 dark:text-teal-400 mt-1 block">{activePiket}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 text-center shadow-sm">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase block tracking-wider">Unit SMP</span>
          <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1 block">{countSmp}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 text-center shadow-sm">
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase block tracking-wider">Unit SMA</span>
          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">{countSma}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 text-center shadow-sm">
          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase block tracking-wider">TMMIA</span>
          <span className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1 block">{countTmmia}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 text-center shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block tracking-wider">Pondok</span>
          <span className="text-xl font-black text-slate-600 dark:text-slate-300 mt-1 block">{countPondok}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm transition-colors">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari NIP, nama, email, NoHP..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Filter Unit */}
          <div className="flex items-center space-x-1 w-1/2 md:w-auto shrink-0">
            <span className="text-[10px] font-bold uppercase text-slate-400 hidden lg:inline">Unit:</span>
            <select
              value={filterUnit}
              onChange={(e) => {
                setFilterUnit(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-36 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-semibold"
            >
              <option value="All">Semua Unit</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
              <option value="TMMIA">TMMIA</option>
              <option value="Pondok">Pondok</option>
            </select>
          </div>

          {/* Filter Piket */}
          <div className="flex items-center space-x-1 w-1/2 md:w-auto shrink-0">
            <span className="text-[10px] font-bold uppercase text-slate-400 hidden lg:inline">Piket:</span>
            <select
              value={filterPiket}
              onChange={(e) => {
                setFilterPiket(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-36 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-semibold"
            >
              <option value="All">Semua Guru</option>
              <option value="Piket">Piket Aktif</option>
              <option value="Bukan">Bukan Piket</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchGuru}
            className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 transition-colors ml-auto cursor-pointer"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Teachers Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mb-2" />
          <p className="text-xs text-slate-400 font-mono">Mengunduh database guru...</p>
        </div>
      ) : paginatedGuru.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-400">
          <Users className="w-10 h-10 text-slate-300 mb-2" />
          <p className="text-sm font-semibold">Tidak Ada Guru Ditemukan</p>
          <p className="text-xs text-slate-500 mt-1">Sesuaikan filter atau tambahkan guru baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {paginatedGuru.map((guru) => {
            const initials = guru.Nama.replace("Ustadz ", "").replace("Ustadzah ", "").slice(0, 2).toUpperCase();
            return (
              <div
                key={guru.NIP}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600"
              >
                <div>
                  {/* Top Header Card */}
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 font-extrabold flex items-center justify-center text-xs shadow-sm">
                      {initials}
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`px-2 py-0.5 rounded font-extrabold text-[9px] uppercase tracking-wider ${
                          guru.Unit === "SMP"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                            : guru.Unit === "SMA"
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400"
                            : guru.Unit === "TMMIA"
                            ? "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400"
                            : "bg-slate-50 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {guru.Unit}
                      </span>
                      {guru.IsPiket && (
                        <span className="px-1.5 py-0.5 rounded bg-teal-500 text-white font-extrabold text-[8px] uppercase flex items-center space-x-0.5 shadow-sm shadow-teal-500/10">
                          <UserCheck className="w-2.5 h-2.5" />
                          <span>Piket</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="mt-3">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs leading-snug line-clamp-2">
                      {guru.Nama}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono block mt-1">NIP: {guru.NIP}</span>

                    <div className="mt-3.5 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {guru.NoHP && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <a
                            href={`https://wa.me/${guru.NoHP.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-teal-600 hover:underline inline-flex items-center space-x-0.5"
                          >
                            <span>{guru.NoHP}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                          </a>
                        </div>
                      )}
                      {guru.Email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[140px]" title={guru.Email}>{guru.Email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => handleOpenEdit(guru)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600 hover:text-blue-700 dark:text-blue-400 rounded transition-colors cursor-pointer"
                    title="Ubah Data"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(guru)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-rose-600 hover:text-rose-700 dark:text-rose-400 rounded transition-colors cursor-pointer"
                    title="Hapus Guru"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && filteredGuru.length > 0 && (
        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl flex items-center justify-between shadow-sm transition-colors text-xs font-semibold">
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
            Menampilkan {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, filteredGuru.length)} dari {filteredGuru.length} guru
          </span>
          <div className="flex items-center space-x-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
              Halaman {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/50">
              <div className="flex items-center space-x-2">
                <Users className="w-4.5 h-4.5 text-teal-600" />
                <h3 className="font-bold text-slate-950 dark:text-white">
                  {modalType === "add" ? "Tambah Guru Baru" : "Edit Data Guru"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* NIP Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  NIP Guru (Nomor Induk Pegawai)
                </label>
                <input
                  type="text"
                  disabled={modalType === "edit"}
                  value={formData.NIP || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, NIP: e.target.value }))}
                  placeholder="Contoh: 19800115001"
                  className={`w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
                    modalType === "edit"
                      ? "bg-slate-50 dark:bg-slate-700/50 text-slate-400 border-slate-100 dark:border-slate-600/50"
                      : "border-slate-200 dark:border-slate-600"
                  }`}
                />
              </div>

              {/* Nama Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  value={formData.Nama || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, Nama: e.target.value }))}
                  placeholder="Contoh: Ustadz Ahmad Fauzi, M.Pd."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              {/* Unit Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Lembaga / Unit Tugas Utama
                </label>
                <select
                  value={formData.Unit || "SMP"}
                  onChange={(e) => setFormData((prev) => ({ ...prev, Unit: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                  <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                  <option value="TMMIA">TMMIA (Tarbiyatul Mu'allimin/at Al-Islamiyah)</option>
                  <option value="Pondok">Pondok (Pusat / Yayasan)</option>
                </select>
              </div>

              {/* NoHP Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  No. HP / WhatsApp (Gunakan Kode Negara)
                </label>
                <input
                  type="text"
                  value={formData.NoHP || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, NoHP: e.target.value }))}
                  placeholder="Contoh: 628123456789"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Alamat Surat Elektronik / Email
                </label>
                <input
                  type="email"
                  value={formData.Email || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, Email: e.target.value }))}
                  placeholder="Contoh: ustadz@alghozali.sch.id"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              {/* IsPiket Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Status Penugasan Piket Harian
                </label>
                <select
                  value={formData.IsPiket ? "TRUE" : "FALSE"}
                  onChange={(e) => setFormData((prev) => ({ ...prev, IsPiket: e.target.value === "TRUE" }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="FALSE">FALSE (Bukan Guru Piket)</option>
                  <option value="TRUE">TRUE (Aktif Sebagai Guru Piket)</option>
                </select>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-teal-600/10 transition-colors cursor-pointer"
                >
                  {modalType === "add" ? "Tambah Guru" : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
