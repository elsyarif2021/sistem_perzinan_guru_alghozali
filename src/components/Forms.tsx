import React, { useState, useEffect } from "react";
import { SessionUser, Jadwal, Mapel, Guru } from "../types";
import {
  FileText,
  Calendar,
  User,
  Layers,
  BookOpen,
  CheckSquare,
  Users,
  Briefcase,
  UploadCloud,
  FileCheck,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";

interface Props {
  user: SessionUser;
  onNotify: (message: string, type: "success" | "error" | "info") => void;
  onSuccess: () => void;
}

interface FormState {
  Tanggal: string;
  Hari: string;
  JenisIzin: "Izin Sakit" | "Izin Kedinasan" | "Izin Pribadi";
  Alasan: string;
  LampiranUrl: string;
  LampiranNama: string;
}

interface PeriodAssignment {
  JamKe: number;
  KodeMapel: string;
  NamaMapel: string;
  KodeKelas: string;
  NamaKelas: string;
  NIPPengganti: string;
  Materi: string;
  Tugas: string;
  HalamanBuku: string;
  TargetPembelajaran: string;
  Instruksi: string;
}

export default function Forms({ user, onNotify, onSuccess }: Props) {
  const [formData, setFormData] = useState<FormState>({
    Tanggal: "",
    Hari: "",
    JenisIzin: "Izin Sakit",
    Alasan: "",
    LampiranUrl: "",
    LampiranNama: "",
  });

  const [teacherSchedule, setTeacherSchedule] = useState<Jadwal[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [selectedPeriods, setSelectedPeriods] = useState<{ [jam: number]: boolean }>({});
  const [substitutesForPeriod, setSubstitutesForPeriod] = useState<{ [jam: number]: Guru[] }>({});
  const [periodDetails, setPeriodDetails] = useState<{ [jam: number]: PeriodAssignment }>({});
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [loadingSubstitutes, setLoadingSubstitutes] = useState<{ [jam: number]: boolean }>({});
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Mapel List for lookups
  useEffect(() => {
    const fetchMapel = async () => {
      try {
        const res = await fetch("/api/db/DATA_MAPEL");
        if (res.ok) {
          const data = await res.json();
          setMapelList(data);
        }
      } catch (e) {
        console.error("Failed to fetch mapel.", e);
      }
    };
    fetchMapel();
  }, []);

  // Update day of the week and fetch schedules when date changes
  const handleDateChange = async (dateVal: string) => {
    if (!dateVal) {
      setFormData((prev) => ({ ...prev, Tanggal: "", Hari: "" }));
      setTeacherSchedule([]);
      setSelectedPeriods({});
      setPeriodDetails({});
      return;
    }

    const indonesianDays = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const dayIndex = new Date(dateVal).getDay();
    const dayName = indonesianDays[dayIndex];

    setFormData((prev) => ({ ...prev, Tanggal: dateVal, Hari: dayName }));
    setSelectedPeriods({});
    setPeriodDetails({});

    if (dayName === "Minggu") {
      onNotify("Hari Minggu adalah hari libur sekolah.", "info");
      setTeacherSchedule([]);
      return;
    }

    // Fetch this teacher's schedules for that day
    setLoadingSchedule(true);
    try {
      const res = await fetch("/api/db/DATA_JADWAL");
      if (res.ok) {
        const allJadwal: Jadwal[] = await res.json();
        // Filter by NIP and Hari
        const filtered = allJadwal.filter(
          (j) => j.NIP === user.nip && j.Hari === dayName
        );
        // Sort by JamKe
        filtered.sort((a, b) => a.JamKe - b.JamKe);
        setTeacherSchedule(filtered);

        if (filtered.length === 0) {
          onNotify(`Tidak ada jadwal mengajar pada hari ${dayName}.`, "info");
        }
      }
    } catch (e) {
      onNotify("Gagal memuat jadwal mengajar.", "error");
    } finally {
      setLoadingSchedule(false);
    }
  };

  // When a class schedule slot is checked/unchecked
  const handlePeriodCheckboxChange = async (jam: number, isChecked: boolean) => {
    setSelectedPeriods((prev) => ({ ...prev, [jam]: isChecked }));

    if (isChecked) {
      // Look up if there's a schedule for this Jam on that day
      const matchingSchedule = teacherSchedule.find((s) => s.JamKe === jam);
      
      let defaultMapelCode = "";
      let defaultMapelName = "";
      let defaultKelasCode = "";
      let defaultKelasName = "";

      if (matchingSchedule) {
        defaultMapelCode = matchingSchedule.KodeMapel;
        const mapelObj = mapelList.find((m) => m.KodeMapel === matchingSchedule.KodeMapel);
        defaultMapelName = mapelObj ? mapelObj.NamaMapel : matchingSchedule.KodeMapel;
        defaultKelasCode = matchingSchedule.KodeKelas;
        defaultKelasName = matchingSchedule.KodeKelas.replace("SMP-", "").replace("SMA-", "");
      }

      // Initialize period details
      setPeriodDetails((prev) => ({
        ...prev,
        [jam]: {
          JamKe: jam,
          KodeMapel: defaultMapelCode,
          NamaMapel: defaultMapelName,
          KodeKelas: defaultKelasCode,
          NamaKelas: defaultKelasName,
          NIPPengganti: "",
          Materi: "",
          Tugas: "",
          HalamanBuku: "",
          TargetPembelajaran: "",
          Instruksi: "",
        },
      }));

      // Fetch available substitute teachers for this period
      setLoadingSubstitutes((prev) => ({ ...prev, [jam]: true }));
      try {
        const res = await fetch(
          `/api/substitutes/check?hari=${formData.Hari}&jams=${jam}&excludeNip=${user.nip}`
        );
        if (res.ok) {
          const availableTeachers: Guru[] = await res.json();
          setSubstitutesForPeriod((prev) => ({ ...prev, [jam]: availableTeachers }));
        }
      } catch (e) {
        console.error("Failed to check substitutes", e);
      } finally {
        setLoadingSubstitutes((prev) => ({ ...prev, [jam]: false }));
      }
    } else {
      // Remove detail
      setPeriodDetails((prev) => {
        const updated = { ...prev };
        delete updated[jam];
        return updated;
      });
    }
  };

  // Modify individual period's sub fields
  const handlePeriodDetailChange = (jam: number, field: keyof PeriodAssignment, value: any) => {
    setPeriodDetails((prev) => ({
      ...prev,
      [jam]: {
        ...prev[jam],
        [field]: value,
      },
    }));
  };

  // Handles client-side base64 conversion and uploads to Drive simulator
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      onNotify("Ukuran berkas tidak boleh melebihi 5MB.", "error");
      return;
    }

    setUploadingFile(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;

      // Rename according to pattern: Tanggal_NamaGuru_JenisIzin.ext
      const cleanTeacherName = (user.teacher?.Nama || user.username)
        .replace(/[^a-zA-Z0-9]/g, "_")
        .substring(0, 20);
      const cleanJenisIzin = formData.JenisIzin.replace(/\s+/g, "_");
      const ext = file.name.split(".").pop();
      const generatedFileName = `${formData.Tanggal || "2026-07-19"}_${cleanTeacherName}_${cleanJenisIzin}.${ext}`;

      try {
        const res = await fetch("/api/permits/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: generatedFileName,
            fileType: file.type,
            fileData: base64Data,
          }),
        });

        if (res.ok) {
          const uploadResult = await res.json();
          setFormData((prev) => ({
            ...prev,
            LampiranUrl: uploadResult.filePath,
            LampiranNama: uploadResult.fileName,
          }));
          onNotify("Dokumen pendukung berhasil diunggah ke Google Drive.", "success");
        } else {
          onNotify("Gagal mengunggah dokumen.", "error");
        }
      } catch (err) {
        onNotify("Terjadi kesalahan pengunggahan.", "error");
      } finally {
        setUploadingFile(false);
      }
    };

    reader.onerror = () => {
      onNotify("Gagal membaca berkas.", "error");
      setUploadingFile(false);
    };

    reader.readAsDataURL(file);
  };

  // Submit full permit request
  const handleSubmitPermit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.Tanggal) {
      onNotify("Harap tentukan tanggal perizinan terlebih dahulu.", "error");
      return;
    }

    const activePeriods = Object.keys(selectedPeriods).filter(
      (k) => selectedPeriods[Number(k)]
    );

    if (activePeriods.length === 0) {
      onNotify("Harap pilih minimal satu jam pelajaran yang ingin ditinggalkan.", "error");
      return;
    }

    // Check if substitute teacher and lesson details are completed
    for (const jamStr of activePeriods) {
      const jam = Number(jamStr);
      const detail = periodDetails[jam];
      if (!detail.NIPPengganti) {
        onNotify(`Harap tunjuk Guru Pengganti pada Jam Ke-${jam}.`, "error");
        return;
      }
      if (!detail.NamaMapel || !detail.NamaMapel.trim()) {
        onNotify(`Harap isi Mata Pelajaran pada Jam Ke-${jam}.`, "error");
        return;
      }
      if (!detail.NamaKelas || !detail.NamaKelas.trim()) {
        onNotify(`Harap isi Kelas pada Jam Ke-${jam}.`, "error");
        return;
      }
      if (!detail.Materi.trim() || !detail.Tugas.trim() || !detail.Instruksi.trim()) {
        onNotify(`Harap isi lengkap Rencana Tugas & Instruksi pada Jam Ke-${jam}.`, "error");
        return;
      }
    }

    // Required files validation
    if (formData.JenisIzin === "Izin Sakit" && !formData.LampiranUrl) {
      onNotify("Izin Sakit wajib menyertakan unggahan Surat Dokter.", "error");
      return;
    }
    if (formData.JenisIzin === "Izin Kedinasan" && !formData.LampiranUrl) {
      onNotify("Izin Kedinasan wajib menyertakan unggahan Surat Tugas.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        permit: {
          Tanggal: formData.Tanggal,
          Hari: formData.Hari,
          NIP: user.nip,
          Unit: user.teacher?.Unit || "SMA",
          JenisIzin: formData.JenisIzin,
          Alasan: formData.Alasan,
          LampiranUrl: formData.LampiranUrl,
          LampiranNama: formData.LampiranNama,
        },
        substitutes: activePeriods.map((jamStr) => periodDetails[Number(jamStr)]),
        username: user.username,
      };

      const res = await fetch("/api/permits/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onNotify("Pengajuan perizinan berhasil dikirim! Notifikasi email dikirim otomatis.", "success");
        onSuccess();
      } else {
        onNotify("Gagal mengirim pengajuan perizinan.", "error");
      }
    } catch (err) {
      onNotify("Kesalahan server saat mengirim pengajuan.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalIzinHours = Object.values(selectedPeriods).filter(Boolean).length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 md:p-8 transition-colors">
      <div className="flex items-center space-x-3 border-b border-slate-100 dark:border-slate-700 pb-5 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center">
          <FileText className="w-5.5 h-5.5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Formulir Pengajuan Perizinan Guru</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Isi detail ketidakhadiran, tugas KBM, dan tunjuk guru pengganti</p>
        </div>
      </div>

      <form onSubmit={handleSubmitPermit} className="space-y-6">
        {/* Row 1: Teacher Profil Detail */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Nama Guru</span>
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-900 dark:text-white">
              <User className="w-3.5 h-3.5 text-teal-500" />
              <span>{user.teacher?.Nama || user.username}</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">NIP</span>
            <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
              {user.nip !== "-" ? user.nip : "ADMINISTRATOR"}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Unit Pendidikan</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400 w-fit">
              {user.teacher?.Unit || "SMA"}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Email Terdaftar</span>
            <span className="text-xs text-slate-600 dark:text-slate-400 truncate block">
              {user.email}
            </span>
          </div>
        </div>

        {/* Row 2: Date Picker & Reason Category */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Tanggal Perizinan</span>
            </label>
            <input
              type="date"
              required
              id="input-tanggal"
              min="2026-07-01"
              value={formData.Tanggal}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            {formData.Hari && (
              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-bold block font-mono">
                Hari Terpilih: {formData.Hari}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-slate-400" />
              <span>Jenis Perizinan</span>
            </label>
            <select
              value={formData.JenisIzin}
              id="input-jenis-izin"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  JenisIzin: e.target.value as any,
                }))
              }
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="Izin Sakit">Izin Sakit</option>
              <option value="Izin Kedinasan">Izin Kedinasan</option>
              <option value="Izin Pribadi">Izin Pribadi</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <UploadCloud className="w-4 h-4 text-slate-400" />
              <span>
                Dokumen Lampiran{" "}
                {formData.JenisIzin !== "Izin Pribadi" && <span className="text-rose-500">*</span>}
              </span>
            </label>
            <div className="flex items-center space-x-2">
              <label className="flex-1 flex items-center justify-between px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium cursor-pointer bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                <span className="text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                  {uploadingFile ? "Mengunggah..." : formData.LampiranNama || "Pilih berkas..."}
                </span>
                <UploadCloud className="w-4 h-4 text-teal-500 shrink-0" />
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingFile}
                />
              </label>
            </div>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 block leading-tight">
              {formData.JenisIzin === "Izin Sakit"
                ? "Surat Keterangan Dokter (.pdf/.png)"
                : formData.JenisIzin === "Izin Kedinasan"
                ? "Surat Tugas Instansi Pondok (.pdf/.png)"
                : "Dokumen Pendukung Opsional (.pdf/.png)"}
            </span>
          </div>
        </div>

        {/* Row 3: Alasan Perizinan */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <Briefcase className="w-4 h-4 text-slate-400" />
            <span>Alasan Perizinan Lengkap</span>
          </label>
          <textarea
            required
            rows={3}
            id="input-alasan"
            placeholder="Tuliskan keterangan dan alasan perizinan secara objektif..."
            value={formData.Alasan}
            onChange={(e) => setFormData((prev) => ({ ...prev, Alasan: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
          ></textarea>
        </div>

        {/* Row 4: Class Schedules Picker based on Date */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <BookOpen className="w-4.5 h-4.5 text-teal-600" />
              <span>Pilih Kelas & Jam Mengajar yang Ditinggalkan</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Jadwal mengajar Anda hari {formData.Hari || "..."} akan dimuat otomatis. Centang yang ditinggalkan.
            </p>
          </div>

          {!formData.Tanggal ? (
            <div className="flex items-center space-x-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-4.5 rounded-xl border border-amber-200/40">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>Harap pilih tanggal di atas terlebih dahulu untuk memuat jadwal mengajar.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((jam) => {
                const isChecked = !!selectedPeriods[jam];
                const matchingSchedule = teacherSchedule.find((s) => s.JamKe === jam);
                const mapelObj = matchingSchedule ? mapelList.find((m) => m.KodeMapel === matchingSchedule.KodeMapel) : null;
                const mapelName = mapelObj ? mapelObj.NamaMapel : matchingSchedule?.KodeMapel;
                const classLabel = matchingSchedule?.KodeKelas.replace("SMP-", "SMP ").replace("SMA-", "SMA ");

                return (
                  <div
                    key={jam}
                    onClick={() => handlePeriodCheckboxChange(jam, !isChecked)}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer select-none ${
                      isChecked
                        ? "bg-teal-50/70 dark:bg-teal-950/20 border-teal-300 dark:border-teal-800"
                        : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start space-x-2.5 h-full">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        id={`schedule-checkbox-${jam}`}
                        onChange={(e) => e.stopPropagation()} // Click handled by parent div
                        className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          Jam Ke-{jam}
                        </span>
                        {matchingSchedule ? (
                          <div className="mt-1 text-[10px] text-teal-600 dark:text-teal-400 leading-tight">
                            <span className="font-semibold block truncate" title={mapelName}>{mapelName}</span>
                            <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 block">{classLabel}</span>
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 block">
                            (Manual)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalIzinHours > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 p-3.5 rounded-xl text-xs font-semibold flex items-center space-x-2 border border-emerald-100 dark:border-emerald-900/30">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Terhitung otomatis: Jumlah izin = {totalIzinHours} Jam Mengajar.</span>
            </div>
          )}
        </div>

        {/* Row 5: Detailed Task assignments for Substitutes (only shows when periods are selected) */}
        {Object.keys(selectedPeriods).filter((k) => selectedPeriods[Number(k)]).length > 0 && (
          <div className="space-y-6 pt-5 border-t border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Users className="w-4.5 h-4.5 text-teal-600" />
                <span>Rencana Tugas & Penugasan Guru Pengganti</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tuliskan materi KBM mandiri dan instruksi detail agar guru pengganti dapat mendampingi siswa dengan optimal.
              </p>
            </div>

            <div className="space-y-6">
              {Object.keys(selectedPeriods)
                .filter((k) => selectedPeriods[Number(k)])
                .map((jamStr) => {
                  const jam = Number(jamStr);
                  const detail = periodDetails[jam];
                  if (!detail) return null;

                  const availableSubs = substitutesForPeriod[jam] || [];
                  const subLoading = loadingSubstitutes[jam];

                  return (
                    <div
                      key={jam}
                      className="p-5 border border-slate-100 dark:border-slate-700/60 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 space-y-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                        <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400 font-mono bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1 rounded-lg">
                          DETAIL JAM KE-{jam} {detail.NamaKelas && `(${detail.NamaKelas})`}
                        </span>

                        {/* Substitute Teacher Dropdown Lookup */}
                        <div className="flex items-center space-x-2">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                            GURU PENGGANTI:
                          </label>
                          {subLoading ? (
                            <span className="text-[10px] font-mono text-slate-400 flex items-center space-x-1">
                              <Loader className="w-3 h-3 animate-spin text-teal-500" />
                              <span>Mencari slot kosong...</span>
                            </span>
                          ) : availableSubs.length === 0 ? (
                            <span className="text-xs font-bold text-rose-500">
                              Tidak ada guru yang tersedia.
                            </span>
                          ) : (
                            <select
                              value={detail.NIPPengganti}
                              required
                              id={`input-pengganti-${jam}`}
                              onChange={(e) =>
                                handlePeriodDetailChange(jam, "NIPPengganti", e.target.value)
                              }
                              className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold"
                            >
                              <option value="">-- Pilih Guru Pengganti --</option>
                              {availableSubs.map((sub) => (
                                <option key={sub.NIP} value={sub.NIP}>
                                  {sub.Nama.split(",")[0]}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      {/* Manual Subject and Class Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-teal-50/20 dark:bg-teal-950/10 p-3 rounded-xl border border-teal-100/30">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-mono font-bold text-slate-500 dark:text-slate-400">
                            Mata Pelajaran <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            id={`input-mapel-manual-${jam}`}
                            placeholder="Tulis mata pelajaran secara manual..."
                            value={detail.NamaMapel}
                            onChange={(e) => {
                              handlePeriodDetailChange(jam, "NamaMapel", e.target.value);
                              handlePeriodDetailChange(jam, "KodeMapel", e.target.value);
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-mono font-bold text-slate-500 dark:text-slate-400">
                            Kelas (Contoh: XA, XB, XC) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            id={`input-kelas-manual-${jam}`}
                            placeholder="Tulis kelas secara manual (pisahkan dengan koma)"
                            value={detail.NamaKelas}
                            onChange={(e) => {
                              handlePeriodDetailChange(jam, "NamaKelas", e.target.value);
                              handlePeriodDetailChange(jam, "KodeKelas", e.target.value);
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold"
                          />
                        </div>
                      </div>

                      {/* Lesson Plan details inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-mono font-bold text-slate-500 dark:text-slate-400">
                            Materi KBM <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            id={`input-materi-${jam}`}
                            placeholder="Contoh: Suhu & Kalor"
                            value={detail.Materi}
                            onChange={(e) =>
                              handlePeriodDetailChange(jam, "Materi", e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-mono font-bold text-slate-500 dark:text-slate-400">
                            Halaman Buku <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            id={`input-halaman-${jam}`}
                            placeholder="Contoh: Hal. 42-45"
                            value={detail.HalamanBuku}
                            onChange={(e) =>
                              handlePeriodDetailChange(jam, "HalamanBuku", e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] uppercase font-mono font-bold text-slate-500 dark:text-slate-400">
                            Target Pembelajaran <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            id={`input-target-${jam}`}
                            placeholder="Contoh: Siswa memahami perpindahan kalor konduksi"
                            value={detail.TargetPembelajaran}
                            onChange={(e) =>
                              handlePeriodDetailChange(jam, "TargetPembelajaran", e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-mono font-bold text-slate-500 dark:text-slate-400">
                            Tugas Mandiri Siswa <span className="text-rose-500">*</span>
                          </label>
                          <textarea
                            required
                            rows={2}
                            id={`input-tugas-${jam}`}
                            placeholder="Tuliskan latihan soal / tugas yang wajib dikerjakan siswa..."
                            value={detail.Tugas}
                            onChange={(e) =>
                              handlePeriodDetailChange(jam, "Tugas", e.target.value)
                            }
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          ></textarea>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-mono font-bold text-slate-500 dark:text-slate-400">
                            Instruksi Khusus Guru Pengganti <span className="text-rose-500">*</span>
                          </label>
                          <textarea
                            required
                            rows={2}
                            id={`input-instruksi-${jam}`}
                            placeholder="Contoh: Harap kumpulkan tugas di akhir jam, bagikan kertas milimeter blok..."
                            value={detail.Instruksi}
                            onChange={(e) =>
                              handlePeriodDetailChange(jam, "Instruksi", e.target.value)
                            }
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Actions Button */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end space-x-3">
          <button
            type="submit"
            disabled={isSubmitting || uploadingFile}
            className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-teal-700 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin text-white" />
                <span>Mengirim Pengajuan...</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4" />
                <span>Ajukan Perizinan KBM</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
