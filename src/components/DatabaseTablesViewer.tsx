import React, { useState, useEffect } from "react";
import {
  Database,
  RefreshCw,
  Search,
  Download,
  Upload,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Plus,
  Trash2,
  Edit,
  X,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  UserPlus
} from "lucide-react";

interface TableMeta {
  id: string;
  name: string;
  description: string;
  columns: string[];
}

const SHEETS_META: TableMeta[] = [
  { id: "DATA_GURU", name: "1. DATA_GURU", description: "Data induk guru dan penugasan piket harian", columns: ["NIP", "Nama", "Unit", "NoHP", "Email", "IsPiket"] },
  { id: "DATA_MAPEL", name: "2. DATA_MAPEL", description: "Data mata pelajaran pondok modern dan umum", columns: ["KodeMapel", "NamaMapel", "Unit"] },
  { id: "DATA_KELAS", name: "3. DATA_KELAS", description: "Data rombongan belajar / kelas per unit", columns: ["KodeKelas", "NamaKelas", "Unit"] },
  { id: "DATA_JADWAL", name: "4. DATA_JADWAL", description: "Jadwal mengajar guru harian dan jam pelajaran", columns: ["IdJadwal", "NIP", "Hari", "JamKe", "KodeMapel", "KodeKelas"] },
  { id: "DATA_IZIN", name: "5. DATA_IZIN", description: "Arsip dan status pengajuan perizinan guru", columns: ["IdIzin", "Tanggal", "Hari", "NIP", "Unit", "JenisIzin", "Alasan", "Status", "LampiranNama", "CreatedAt"] },
  { id: "DATA_GURU_PENGGANTI", name: "6. DATA_GURU_PENGGANTI", description: "Penugasan guru pengganti dan instruksi mengajar", columns: ["IdIzin", "JamKe", "NIPOriginal", "NIPPengganti", "KodeKelas", "KodeMapel", "Materi", "Tugas", "HalamanBuku", "TargetPembelajaran", "Instruksi"] },
  { id: "DATA_LOG", name: "7. DATA_LOG", description: "Log audit seluruh aktivitas sistem (Audit Log)", columns: ["IdLog", "Timestamp", "User", "Activity", "Details"] },
  { id: "DATA_USER", name: "8. DATA_USER", description: "Akun login pengguna, kredensial, dan hak akses", columns: ["Username", "PasswordRaw", "NIP", "Role", "Email"] },
  { id: "DATA_APPROVAL", name: "9. DATA_APPROVAL", description: "Riwayat persetujuan dari Guru Piket, Waka, dan Kabid", columns: ["IdApproval", "IdIzin", "ApproverRole", "ApproverName", "Status", "TanggalApproval", "Catatan"] }
];

interface Props {
  onNotify: (message: string, type: "success" | "error" | "info") => void;
}

export default function DatabaseTablesViewer({ onNotify }: Props) {
  const [selectedSheet, setSelectedSheet] = useState<string>("DATA_GURU");
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formType, setFormType] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState<any>({});

  // Import Modal States
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [importRawText, setImportRawText] = useState<string>("");
  const [importProgress, setImportProgress] = useState<string>("");
  const [importing, setImporting] = useState<boolean>(false);

  const getTableIdKey = (sheetId: string): string => {
    switch (sheetId) {
      case "DATA_GURU": return "NIP";
      case "DATA_MAPEL": return "KodeMapel";
      case "DATA_KELAS": return "KodeKelas";
      case "DATA_JADWAL": return "IdJadwal";
      case "DATA_USER": return "Username";
      case "DATA_IZIN": return "IdIzin";
      case "DATA_GURU_PENGGANTI": return "IdIzin";
      case "DATA_LOG": return "IdLog";
      case "DATA_APPROVAL": return "IdApproval";
      default: return "";
    }
  };

  const generateNextId = (table: string, existingData: any[]) => {
    switch (table) {
      case "DATA_JADWAL": {
        const maxNum = existingData.reduce((max, item) => {
          const num = parseInt(String(item.IdJadwal).replace("J-", ""), 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        return `J-${String(maxNum + 1).padStart(3, "0")}`;
      }
      case "DATA_LOG": {
        const maxNum = existingData.reduce((max, item) => {
          const num = parseInt(String(item.IdLog).replace("L-", ""), 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        return `L-${String(maxNum + 1).padStart(3, "0")}`;
      }
      case "DATA_APPROVAL": {
        const maxNum = existingData.reduce((max, item) => {
          const num = parseInt(String(item.IdApproval).replace("AP-", ""), 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        return `AP-${String(maxNum + 1).padStart(3, "0")}`;
      }
      case "DATA_IZIN": {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const maxNum = existingData.reduce((max, item) => {
          if (String(item.IdIzin).startsWith(`IZ-${dateStr}-`)) {
            const num = parseInt(String(item.IdIzin).replace(`IZ-${dateStr}-`, ""), 10);
            return isNaN(num) ? max : Math.max(max, num);
          }
          return max;
        }, 0);
        return `IZ-${dateStr}-${String(maxNum + 1).padStart(3, "0")}`;
      }
      default:
        return "";
    }
  };

  const fetchTableData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/db/${selectedSheet}`);
      if (res.ok) {
        const data = await res.json();
        setTableData(data);
      } else {
        onNotify("Gagal mengambil data dari server.", "error");
      }
    } catch (e) {
      onNotify("Kesalahan koneksi ke server.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData();
    setCurrentPage(1);
    setSearchQuery("");
  }, [selectedSheet]);

  const activeMeta = SHEETS_META.find((s) => s.id === selectedSheet) || SHEETS_META[0];

  // Filtered data based on search query
  const filteredData = tableData.filter((row) => {
    if (!searchQuery) return true;
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleResetDatabase = async () => {
    if (confirm("Apakah Anda yakin ingin menyetel ulang database ke kondisi awal? Seluruh data baru akan hilang!")) {
      try {
        const res = await fetch("/api/db-admin/reset", { method: "POST" });
        if (res.ok) {
          onNotify("Database berhasil disetel ulang ke kondisi awal pondok.", "success");
          fetchTableData();
        } else {
          onNotify("Gagal menyetel ulang database.", "error");
        }
      } catch (e) {
        onNotify("Gagal menghubungi server.", "error");
      }
    }
  };

  const handleBackup = () => {
    window.open("/api/db-admin/backup", "_blank");
    onNotify("Cadangan database diunduh (perizinan_backup.json)", "success");
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.DATA_GURU || !json.DATA_IZIN || !json.DATA_USER) {
          onNotify("Format berkas cadangan database tidak valid.", "error");
          return;
        }

        const res = await fetch("/api/db-admin/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: json }),
        });

        if (res.ok) {
          onNotify("Database berhasil dipulihkan dari cadangan.", "success");
          fetchTableData();
        } else {
          onNotify("Gagal memulihkan database.", "error");
        }
      } catch (err) {
        onNotify("Berkas JSON rusak atau tidak terbaca.", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleOpenAddModal = () => {
    setFormType("add");
    const nextId = generateNextId(selectedSheet, tableData);
    const initialData: any = {};
    activeMeta.columns.forEach((col) => {
      const idKey = getTableIdKey(selectedSheet);
      if (col === idKey && nextId) {
        initialData[col] = nextId;
      } else if (col === "IsPiket") {
        initialData[col] = false;
      } else if (col === "JamKe") {
        initialData[col] = 1;
      } else if (col === "Unit") {
        initialData[col] = "SMP";
      } else if (col === "Role") {
        initialData[col] = "Guru";
      } else if (col === "Hari") {
        initialData[col] = "Senin";
      } else if (col === "Status") {
        initialData[col] = selectedSheet === "DATA_IZIN" ? "Menunggu Persetujuan" : "";
      } else if (col === "CreatedAt" || col === "Timestamp" || col === "TanggalApproval") {
        initialData[col] = new Date().toISOString();
      } else {
        initialData[col] = "";
      }
    });
    setFormData(initialData);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (row: any) => {
    setFormType("edit");
    setFormData({ ...row });
    setIsFormOpen(true);
  };

  const handleDeleteRow = async (row: any) => {
    const idKey = getTableIdKey(selectedSheet);
    const idVal = row[idKey];
    if (!idKey || idVal === undefined) {
      onNotify("Gagal menghapus: Kolom identitas tidak ditemukan.", "error");
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus baris dengan ${idKey}: "${idVal}" dari ${selectedSheet}?`)) {
      try {
        const res = await fetch(`/api/db/${selectedSheet}/${idKey}/${idVal}`, {
          method: "DELETE",
        });
        if (res.ok) {
          onNotify("Baris berhasil dihapus.", "success");
          fetchTableData();
        } else {
          onNotify("Gagal menghapus baris.", "error");
        }
      } catch (e) {
        onNotify("Kesalahan koneksi ke server.", "error");
      }
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const idKey = getTableIdKey(selectedSheet);
    
    if (formType === "add") {
      const idVal = formData[idKey];
      if (idVal === undefined || String(idVal).trim() === "") {
        onNotify(`Kolom kunci utama ${idKey} tidak boleh kosong.`, "error");
        return;
      }
      
      // For some tables like DATA_GURU_PENGGANTI, duplicate ID is allowed. Otherwise check.
      const shouldCheckDuplicate = ["DATA_GURU", "DATA_MAPEL", "DATA_KELAS", "DATA_USER", "DATA_JADWAL", "DATA_IZIN"].includes(selectedSheet);
      if (shouldCheckDuplicate) {
        const duplicate = tableData.some((row) => String(row[idKey]).toLowerCase() === String(idVal).toLowerCase());
        if (duplicate) {
          onNotify(`Gagal: Data dengan ${idKey} "${idVal}" sudah ada di database.`, "error");
          return;
        }
      }

      try {
        const res = await fetch(`/api/db/${selectedSheet}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          onNotify("Data berhasil ditambahkan.", "success");
          setIsFormOpen(false);
          fetchTableData();
        } else {
          onNotify("Gagal menambahkan data.", "error");
        }
      } catch (err) {
        onNotify("Kesalahan koneksi.", "error");
      }
    } else {
      // Edit
      try {
        const res = await fetch(`/api/db/${selectedSheet}/${idKey}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          onNotify("Data berhasil diubah.", "success");
          setIsFormOpen(false);
          fetchTableData();
        } else {
          onNotify("Gagal mengubah data.", "error");
        }
      } catch (err) {
        onNotify("Kesalahan koneksi.", "error");
      }
    }
  };

  // Paste / File Parser
  const parseCSV = (text: string, columns: string[]) => {
    if (!text.trim()) return [];
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    const firstLineCells = lines[0].split(/[\t,;]/).map(c => c.trim().replace(/^["']|["']$/g, ""));
    const hasHeaders = firstLineCells.some(cell => 
      columns.some(col => col.toLowerCase() === cell.toLowerCase())
    );

    let dataLines = lines;
    let headers = columns;

    if (hasHeaders) {
      headers = firstLineCells;
      dataLines = lines.slice(1);
    }

    const result: any[] = [];
    for (const line of dataLines) {
      let delimiter = ",";
      if (line.includes("\t")) delimiter = "\t";
      else if (line.includes(";")) delimiter = ";";

      const cells = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ""));
      const rowObj: any = {};
      
      columns.forEach((col, idx) => {
        const headerIdx = headers.findIndex(h => h.toLowerCase() === col.toLowerCase());
        const cellVal = headerIdx !== -1 ? cells[headerIdx] : cells[idx];
        
        if (cellVal !== undefined) {
          if (col === "JamKe") {
            rowObj[col] = Number(cellVal) || 1;
          } else if (col === "IsPiket") {
            rowObj[col] = cellVal.toUpperCase() === "TRUE" || cellVal === "1";
          } else {
            rowObj[col] = cellVal;
          }
        } else {
          if (col === "JamKe") rowObj[col] = 1;
          else if (col === "IsPiket") rowObj[col] = false;
          else rowObj[col] = "";
        }
      });

      result.push(rowObj);
    }

    return result;
  };

  const handleBulkImport = async () => {
    const rows = parseCSV(importRawText, activeMeta.columns);
    if (rows.length === 0) {
      onNotify("Tidak ada data valid yang bisa diimpor. Periksa format Anda.", "error");
      return;
    }

    setImporting(true);
    setImportProgress(`Memulai impor ${rows.length} baris...`);
    const idKey = getTableIdKey(selectedSheet);
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const idVal = row[idKey];

      if (idVal === undefined || String(idVal).trim() === "") {
        skipCount++;
        continue;
      }

      const exists = tableData.some((r) => String(r[idKey]).toLowerCase() === String(idVal).toLowerCase());
      
      try {
        let res;
        if (exists) {
          res = await fetch(`/api/db/${selectedSheet}/${idKey}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(row),
          });
        } else {
          res = await fetch(`/api/db/${selectedSheet}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(row),
          });
        }

        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
      }

      setImportProgress(`Mengimpor ${i + 1}/${rows.length} baris...`);
    }

    setImporting(false);
    onNotify(`Impor selesai! Berhasil: ${successCount}, Dilewati: ${skipCount}, Gagal: ${failCount}`, "success");
    setIsImportOpen(false);
    setImportRawText("");
    setImportProgress("");
    fetchTableData();
  };

  return (
    <div className="space-y-6">
      {/* DB Admin Tools */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 rounded-2xl transition-colors">
        <div className="flex items-start space-x-3">
          <Database className="w-5.5 h-5.5 text-teal-600 dark:text-teal-400 mt-1" />
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Panel Kontrol Database & KBM Al Ghozali</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola data guru, mata pelajaran, jadwal mengajar, dan pengguna sistem. Data di sini diselaraskan ke database utama.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleResetDatabase}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Reset Database</span>
          </button>
          <button
            onClick={handleBackup}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer border border-slate-700/50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Backup</span>
          </button>
          <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Restore Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestore}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar Table Selector */}
        <div className="lg:col-span-3 space-y-2">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 dark:text-slate-500 block px-2 uppercase font-bold">
            Pilih Tabel Database
          </span>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
            {SHEETS_META.map((sheet) => (
              <button
                key={sheet.id}
                onClick={() => setSelectedSheet(sheet.id)}
                className={`flex items-center justify-between w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedSheet === sheet.id
                    ? "bg-teal-700 text-white shadow-lg shadow-teal-700/10"
                    : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <Layers className={`w-3.5 h-3.5 shrink-0 ${selectedSheet === sheet.id ? "text-white" : "text-slate-400"}`} />
                  <span className="truncate">{sheet.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Spreadsheet Grid */}
        <div className="lg:col-span-9 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
          {/* Sheet Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Database className="w-4.5 h-4.5 text-teal-600" />
                <span>{activeMeta.name}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activeMeta.description}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari baris..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs w-40 sm:w-48 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <button
                onClick={handleOpenAddModal}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>

              <button
                onClick={() => setIsImportOpen(true)}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Import CSV</span>
              </button>

              <button
                onClick={fetchTableData}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Muat Ulang"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-500" : ""}`} />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto min-h-[360px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-teal-500 mb-2" />
                <span className="text-xs font-mono">Memuat baris sheet...</span>
              </div>
            ) : paginatedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <span className="text-sm font-semibold mb-1">Tidak Ada Data</span>
                <span className="text-xs text-slate-500">Tabel kosong atau kata kunci pencarian tidak cocok.</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 font-mono tracking-wider">
                    {activeMeta.columns.map((col) => (
                      <th key={col} className="px-4 py-3 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-600 dark:text-slate-300">
                  {paginatedData.map((row, index) => {
                    return (
                      <tr
                        key={index}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 font-mono transition-colors"
                      >
                        {activeMeta.columns.map((col) => {
                          let val = row[col];
                          if (typeof val === "boolean") {
                            val = val ? "TRUE" : "FALSE";
                          }
                          return (
                            <td key={col} className="px-4 py-3 truncate max-w-xs">
                              {col === "Status" ? (
                                <span
                                  className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                                    val === "Selesai" || val === "Disetujui"
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                                      : val === "Ditolak"
                                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400"
                                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                                  }`}
                                >
                                  {val}
                                </span>
                              ) : col === "IsPiket" ? (
                                <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${val === "TRUE" ? "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400" : "bg-slate-100 text-slate-500 dark:bg-slate-700"}`}>
                                  {val}
                                </span>
                              ) : (
                                String(val || "-")
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleOpenEditModal(row)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600 hover:text-blue-700 dark:text-blue-400 rounded transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRow(row)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-rose-600 hover:text-rose-700 dark:text-rose-400 rounded transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Table Footer Pagination */}
          {!loading && filteredData.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} baris
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="p-1.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200">
                  Halaman {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="p-1.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Form Modal (Add / Edit) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/50">
              <div className="flex items-center space-x-2">
                <Database className="w-4.5 h-4.5 text-teal-600" />
                <h3 className="font-bold text-slate-950 dark:text-white">
                  {formType === "add" ? "Tambah Data Baru" : "Edit Baris Data"} - {selectedSheet}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 max-h-[420px] overflow-y-auto pr-1">
                {activeMeta.columns.map((col) => {
                  const idKey = getTableIdKey(selectedSheet);
                  const isIdCol = col === idKey;
                  const isDisabled = isIdCol && formType === "edit";

                  // Check IsPiket
                  if (col === "IsPiket") {
                    return (
                      <div key={col} className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono tracking-wider">
                          IsPiket (Status Piket Guru)
                        </label>
                        <select
                          value={formData[col] ? "TRUE" : "FALSE"}
                          onChange={(e) => setFormData((prev: any) => ({ ...prev, [col]: e.target.value === "TRUE" }))}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                          <option value="FALSE">FALSE (Bukan Guru Piket)</option>
                          <option value="TRUE">TRUE (Guru Piket Aktif)</option>
                        </select>
                      </div>
                    );
                  }

                  // Check Unit dropdown
                  if (col === "Unit") {
                    return (
                      <div key={col} className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono tracking-wider">
                          Unit Lembaga
                        </label>
                        <select
                          value={formData[col] || "SMP"}
                          onChange={(e) => setFormData((prev: any) => ({ ...prev, [col]: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                          <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                          <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                          <option value="TMMIA">TMMIA (Tarbiyatul Mu'allimin/at Al-Islamiyah)</option>
                          <option value="Pondok">Pondok (Pusat / Yayasan)</option>
                        </select>
                      </div>
                    );
                  }

                  // Check Role dropdown
                  if (col === "Role") {
                    return (
                      <div key={col} className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono tracking-wider">
                          Hak Akses / Role Pengguna
                        </label>
                        <select
                          value={formData[col] || "Guru"}
                          onChange={(e) => setFormData((prev: any) => ({ ...prev, [col]: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                          <option value="Guru">Guru (Pengajar)</option>
                          <option value="Guru Piket">Guru Piket (Verifikator Lapangan)</option>
                          <option value="Waka Kurikulum">Waka Kurikulum (Persetujuan Akademik)</option>
                          <option value="Kepala Bidang Pendidikan">Kepala Bidang Pendidikan (Persetujuan Akhir)</option>
                          <option value="Administrator">Administrator (Akses Sistem Penuh)</option>
                        </select>
                      </div>
                    );
                  }

                  // Check Hari dropdown
                  if (col === "Hari") {
                    return (
                      <div key={col} className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono tracking-wider">
                          Hari Pelajaran
                        </label>
                        <select
                          value={formData[col] || "Senin"}
                          onChange={(e) => setFormData((prev: any) => ({ ...prev, [col]: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                          <option value="Senin">Senin</option>
                          <option value="Selasa">Selasa</option>
                          <option value="Rabu">Rabu</option>
                          <option value="Kamis">Kamis</option>
                          <option value="Sabtu">Sabtu</option>
                          <option value="Ahad">Ahad</option>
                        </select>
                      </div>
                    );
                  }

                  // Check JamKe
                  if (col === "JamKe") {
                    return (
                      <div key={col} className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono tracking-wider">
                          Jam Ke- (1 s.d. 10)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={Number(formData[col]) || 1}
                          onChange={(e) => setFormData((prev: any) => ({ ...prev, [col]: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                    );
                  }

                  // Check Status dropdown (DATA_IZIN or DATA_APPROVAL)
                  if (col === "Status" && (selectedSheet === "DATA_IZIN" || selectedSheet === "DATA_APPROVAL")) {
                    return (
                      <div key={col} className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono tracking-wider">
                          Status
                        </label>
                        <select
                          value={formData[col] || "Menunggu Persetujuan"}
                          onChange={(e) => setFormData((prev: any) => ({ ...prev, [col]: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                          <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
                          <option value="Disetujui">Disetujui</option>
                          <option value="Ditolak">Ditolak</option>
                          <option value="Selesai">Selesai</option>
                        </select>
                      </div>
                    );
                  }

                  // Default text/number inputs
                  return (
                    <div key={col} className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase font-mono tracking-wider flex justify-between">
                        <span>{col}</span>
                        {isIdCol && <span className="text-[10px] text-teal-600 font-bold lowercase">(kunci utama)</span>}
                      </label>
                      <input
                        type="text"
                        disabled={isDisabled}
                        value={formData[col] === undefined ? "" : formData[col]}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, [col]: e.target.value }))}
                        placeholder={`Tulis nilai untuk ${col}...`}
                        className={`w-full px-3 py-2 border rounded-lg text-xs font-semibold ${
                          isDisabled
                            ? "bg-slate-50 dark:bg-slate-700/60 text-slate-400 border-slate-100 dark:border-slate-600/40"
                            : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  {formType === "add" ? "Simpan Data" : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import CSV / Text Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/50">
              <div className="flex items-center space-x-2">
                <Upload className="w-4.5 h-4.5 text-teal-600" />
                <h3 className="font-bold text-slate-950 dark:text-white">
                  Impor Massal Data CSV / TSV - {selectedSheet}
                </h3>
              </div>
              <button
                disabled={importing}
                onClick={() => setIsImportOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="p-3 bg-teal-50/50 dark:bg-teal-950/10 border border-teal-100/40 dark:border-teal-900/20 rounded-xl space-y-1">
                <h4 className="text-xs font-bold text-teal-800 dark:text-teal-400">Petunjuk Format Berkas:</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tempelkan baris data yang dipisahkan dengan <b>koma (,)</b>, <b>titik koma (;)</b>, atau <b>Tab (salinan dari Excel)</b> di bawah ini. Baris pertama dapat diisi dengan nama kolom (opsional).
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 font-mono select-all bg-white dark:bg-slate-700 p-2 rounded border border-slate-100 dark:border-slate-600 mt-1.5">
                  Kolom yang diperlukan: {activeMeta.columns.join(", ")}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tempel Data Spreadsheet / CSV
                </label>
                <textarea
                  disabled={importing}
                  rows={8}
                  placeholder={`Contoh data:\n${activeMeta.columns.join(",")}\n...`}
                  value={importRawText}
                  onChange={(e) => setImportRawText(e.target.value)}
                  className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-mono bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                ></textarea>
              </div>

              {/* Progress and status */}
              {importProgress && (
                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                  <span>{importProgress}</span>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  disabled={importing}
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-40"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={importing || !importRawText.trim()}
                  onClick={handleBulkImport}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-md transition-colors cursor-pointer disabled:opacity-40 flex items-center space-x-1.5"
                >
                  {importing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengimpor...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Mulai Impor</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
