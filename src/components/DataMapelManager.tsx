import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Layers
} from "lucide-react";
import { Mapel } from "../types";

interface Props {
  onNotify: (message: string, type: "success" | "error" | "info") => void;
  onRefreshAllData?: () => void;
}

export default function DataMapelManager({ onNotify, onRefreshAllData }: Props) {
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>(" ");
  const [filterUnit, setFilterUnit] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Form States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState<Partial<Mapel>>({
    KodeMapel: "",
    NamaMapel: "",
    Unit: "SMP"
  });

  const fetchMapel = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/db/DATA_MAPEL");
      if (res.ok) {
        const data = await res.json();
        setMapelList(data);
      } else {
        onNotify("Gagal mengambil data mata pelajaran.", "error");
      }
    } catch (e) {
      onNotify("Kesalahan jaringan saat mengambil data mata pelajaran.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapel();
    setSearchQuery(""); // Clear placeholder search
  }, []);

  // Filtered List
  const filteredMapel = mapelList.filter((m) => {
    const matchesSearch =
      m.NamaMapel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.KodeMapel.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUnit = filterUnit === "All" || m.Unit === filterUnit;

    return matchesSearch && matchesUnit;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMapel.length / itemsPerPage) || 1;
  const paginatedMapel = filteredMapel.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const generateNextKode = (existing: Mapel[]) => {
    const maxNum = existing.reduce((max, item) => {
      const num = parseInt(item.KodeMapel.replace("MP-", ""), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return `MP-${String(maxNum + 1).padStart(3, "0")}`;
  };

  const handleOpenAdd = () => {
    setModalType("add");
    const nextKode = generateNextKode(mapelList);
    setFormData({
      KodeMapel: nextKode,
      NamaMapel: "",
      Unit: "SMP"
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mapel: Mapel) => {
    setModalType("edit");
    setFormData({ ...mapel });
    setIsModalOpen(true);
  };

  const handleDelete = async (mapel: Mapel) => {
    if (confirm(`Apakah Anda yakin ingin menghapus mata pelajaran: "${mapel.NamaMapel}" (${mapel.KodeMapel})?`)) {
      try {
        const res = await fetch(`/api/db/DATA_MAPEL/KodeMapel/${mapel.KodeMapel}`, {
          method: "DELETE",
        });
        if (res.ok) {
          onNotify("Mata pelajaran berhasil dihapus.", "success");
          fetchMapel();
          if (onRefreshAllData) onRefreshAllData();
        } else {
          onNotify("Gagal menghapus mata pelajaran.", "error");
        }
      } catch (e) {
        onNotify("Kesalahan koneksi ke server.", "error");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.KodeMapel || !formData.NamaMapel) {
      onNotify("Kode Mapel dan Nama Mapel wajib diisi.", "error");
      return;
    }

    if (modalType === "add") {
      // Check duplicate
      const exists = mapelList.some(
        (m) => String(m.KodeMapel).trim().toUpperCase() === String(formData.KodeMapel).trim().toUpperCase()
      );
      if (exists) {
        onNotify(`Gagal: Kode mapel "${formData.KodeMapel}" sudah terdaftar.`, "error");
        return;
      }

      try {
        const res = await fetch("/api/db/DATA_MAPEL", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          onNotify("Mata pelajaran baru berhasil ditambahkan.", "success");
          setIsModalOpen(false);
          fetchMapel();
          if (onRefreshAllData) onRefreshAllData();
        } else {
          onNotify("Gagal menambahkan mata pelajaran.", "error");
        }
      } catch (err) {
        onNotify("Gagal menghubungkan ke server.", "error");
      }
    } else {
      // Edit
      try {
        const res = await fetch("/api/db/DATA_MAPEL/KodeMapel", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          onNotify("Perubahan mata pelajaran berhasil disimpan.", "success");
          setIsModalOpen(false);
          fetchMapel();
          if (onRefreshAllData) onRefreshAllData();
        } else {
          onNotify("Gagal menyimpan perubahan.", "error");
        }
      } catch (err) {
        onNotify("Gagal menghubungkan ke server.", "error");
      }
    }
  };

  // Stats
  const totalMapel = mapelList.length;
  const countSmp = mapelList.filter((m) => m.Unit === "SMP").length;
  const countSma = mapelList.filter((m) => m.Unit === "SMA").length;
  const countTmmia = mapelList.filter((m) => m.Unit === "TMMIA").length;

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 rounded-2xl transition-colors">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 bg-teal-600 rounded-xl text-white">
            <BookOpen className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Kelola Kurikulum Mata Pelajaran</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola kurikulum pengajaran pondok, mata pelajaran syari'ah, bahasa, ilmu umum, dan alur perizinan kelas.
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-teal-600/10 transition-all cursor-pointer shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Mata Pelajaran</span>
        </button>
      </div>

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-center shadow-sm flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Mapel</span>
            <span className="text-xl font-black text-slate-800 dark:text-white mt-0.5 block">{totalMapel}</span>
          </div>
          <BookOpen className="w-8 h-8 text-slate-300" />
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-center shadow-sm flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block">Mapel SMP</span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5 block">{countSmp}</span>
          </div>
          <Layers className="w-8 h-8 text-blue-200 dark:text-blue-950/50" />
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-center shadow-sm flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">Mapel SMA</span>
            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5 block">{countSma}</span>
          </div>
          <Layers className="w-8 h-8 text-indigo-200 dark:text-indigo-950/50" />
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-center shadow-sm flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider block">Mapel TMMIA</span>
            <span className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5 block">{countTmmia}</span>
          </div>
          <Layers className="w-8 h-8 text-purple-200 dark:text-purple-950/50" />
        </div>
      </div>

      {/* Filter Options */}
      <div className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm transition-colors">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode mapel, nama pelajaran..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
          />
        </div>

        {/* Filter Dropdown & Refresh */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-400">Unit:</span>
            <select
              value={filterUnit}
              onChange={(e) => {
                setFilterUnit(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-semibold"
            >
              <option value="All">Semua Unit Kurikulum</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
              <option value="TMMIA">TMMIA (Kulliyatul Mu'allimin)</option>
            </select>
          </div>

          <button
            onClick={fetchMapel}
            className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Grid of Subjects */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mb-2" />
          <p className="text-xs text-slate-400 font-mono">Mengunduh kurikulum...</p>
        </div>
      ) : paginatedMapel.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-400">
          <BookOpen className="w-10 h-10 text-slate-300 mb-2" />
          <p className="text-sm font-semibold">Tidak Ada Mata Pelajaran</p>
          <p className="text-xs text-slate-500 mt-1">Gunakan kata kunci pencarian yang berbeda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {paginatedMapel.map((mapel) => {
            return (
              <div
                key={mapel.KodeMapel}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                      {mapel.KodeMapel}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-extrabold text-[9px] uppercase tracking-wider ${
                        mapel.Unit === "SMP"
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                          : mapel.Unit === "SMA"
                          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400"
                          : "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400"
                      }`}
                    >
                      {mapel.Unit}
                    </span>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                      {mapel.NamaMapel}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1">Pondok Modern Al Ghozali</p>
                  </div>
                </div>

                <div className="mt-6 pt-3.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => handleOpenEdit(mapel)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600 hover:text-blue-700 dark:text-blue-400 rounded transition-colors cursor-pointer"
                    title="Ubah Mapel"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(mapel)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-rose-600 hover:text-rose-700 dark:text-rose-400 rounded transition-colors cursor-pointer"
                    title="Hapus Mapel"
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
      {!loading && filteredMapel.length > 0 && (
        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl flex items-center justify-between shadow-sm transition-colors text-xs font-semibold">
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
            Menampilkan {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, filteredMapel.length)} dari {filteredMapel.length} pelajaran
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
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden transform transition-all">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/50">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4.5 h-4.5 text-teal-600" />
                <h3 className="font-bold text-slate-950 dark:text-white">
                  {modalType === "add" ? "Tambah Pelajaran" : "Edit Mata Pelajaran"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Kode Mapel */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Kode Mata Pelajaran
                </label>
                <input
                  type="text"
                  disabled={modalType === "edit"}
                  value={formData.KodeMapel || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, KodeMapel: e.target.value.toUpperCase() }))}
                  placeholder="Contoh: MP-005"
                  className={`w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${
                    modalType === "edit"
                      ? "bg-slate-50 dark:bg-slate-700/50 text-slate-400 border-slate-100 dark:border-slate-600/50"
                      : "border-slate-200 dark:border-slate-600"
                  }`}
                />
              </div>

              {/* Nama Mapel */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Nama Mata Pelajaran
                </label>
                <input
                  type="text"
                  value={formData.NamaMapel || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, NamaMapel: e.target.value }))}
                  placeholder="Contoh: Nahwu / Tata Bahasa Arab"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              {/* Unit Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Unit Kurikulum
                </label>
                <select
                  value={formData.Unit || "SMP"}
                  onChange={(e) => setFormData((prev) => ({ ...prev, Unit: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="SMP">SMP (KBM Umum & Diniyah SMP)</option>
                  <option value="SMA">SMA (KBM Umum & Diniyah SMA)</option>
                  <option value="TMMIA">TMMIA (Kulliyatul Mu'allimin/at Al-Islamiyah)</option>
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
                  {modalType === "add" ? "Tambah" : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
