import fs from "fs";
import path from "path";

// Define the database JSON path
const IS_VERCEL = !!process.env.VERCEL;
const ORIGINAL_DB_FILE = path.join(process.cwd(), "db.json");
export const DB_FILE = IS_VERCEL ? "/tmp/db.json" : ORIGINAL_DB_FILE;
export const UPLOAD_DIR = IS_VERCEL ? "/tmp/uploads" : path.join(process.cwd(), "uploads");

// Copy original db.json to /tmp/db.json if it doesn't exist on Vercel
if (IS_VERCEL && !fs.existsSync(DB_FILE)) {
  try {
    if (fs.existsSync(ORIGINAL_DB_FILE)) {
      fs.copyFileSync(ORIGINAL_DB_FILE, DB_FILE);
    }
  } catch (err) {
    console.error("Failed to copy initial db.json to /tmp", err);
  }
}

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export interface Guru {
  NIP: string;
  Nama: string;
  Unit: "SMP" | "SMA" | "TMMIA" | "Pondok";
  NoHP: string;
  Email: string;
  IsPiket: boolean;
}

export interface Mapel {
  KodeMapel: string;
  NamaMapel: string;
  Unit: string;
}

export interface Kelas {
  KodeKelas: string;
  NamaKelas: string;
  Unit: string;
}

export interface Jadwal {
  IdJadwal: string;
  NIP: string;
  Hari: string; // "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"
  JamKe: number; // 1 to 10
  KodeMapel: string;
  KodeKelas: string;
}

export interface Izin {
  IdIzin: string;
  Tanggal: string; // YYYY-MM-DD
  Hari: string;
  NIP: string;
  Unit: "SMP" | "SMA" | "TMMIA" | "Pondok";
  JenisIzin: "Izin Sakit" | "Izin Kedinasan" | "Izin Pribadi";
  Alasan: string;
  Status: "Draft" | "Menunggu Persetujuan" | "Disetujui" | "Ditolak" | "Selesai";
  LampiranUrl?: string;
  LampiranNama?: string;
  CreatedAt: string;
}

export interface GuruPengganti {
  IdIzin: string;
  JamKe: number;
  NIPOriginal: string;
  NIPPengganti: string; // NIP of substitute
  KodeKelas: string;
  KodeMapel: string;
  Materi: string;
  Tugas: string;
  HalamanBuku: string;
  TargetPembelajaran: string;
  Instruksi: string;
}

export interface Log {
  IdLog: string;
  Timestamp: string;
  User: string;
  Activity: string;
  Details: string;
}

export interface UserAccount {
  Username: string;
  PasswordRaw: string; // Plain password for ease of login simulation
  NIP: string; // "-" for admins / waka / kabid
  Role: "Administrator" | "Kepala Bidang Pendidikan" | "Waka Kurikulum" | "Guru" | "Guru Piket";
  Email: string;
}

export interface Approval {
  IdApproval: string;
  IdIzin: string;
  ApproverRole: string;
  ApproverName: string;
  Status: "Disetujui" | "Ditolak";
  TanggalApproval: string;
  Catatan: string;
}

// Complete database structure reflecting Google Sheets
export interface DatabaseSchema {
  DATA_GURU: Guru[];
  DATA_MAPEL: Mapel[];
  DATA_KELAS: Kelas[];
  DATA_JADWAL: Jadwal[];
  DATA_IZIN: Izin[];
  DATA_GURU_PENGGANTI: GuruPengganti[];
  DATA_LOG: Log[];
  DATA_USER: UserAccount[];
  DATA_APPROVAL: Approval[];
}

const INITIAL_DATABASE: DatabaseSchema = {
  DATA_GURU: [
    { NIP: "19780315007", Nama: "Ustadz Mursyid Anwar, M.Pd.", Unit: "Pondok", NoHP: "081234567899", Email: "mursyid.anwar@alghozali.sch.id", IsPiket: false },
    { NIP: "19800115001", Nama: "Ustadz Ahmad Fauzi, M.Pd.", Unit: "SMA", NoHP: "081234567890", Email: "ahmad.fauzi@alghozali.sch.id", IsPiket: false },
    { NIP: "19850420002", Nama: "Ustadzah Fatimah Azzahra, S.Si.", Unit: "SMP", NoHP: "081234567891", Email: "fatimah.zahra@alghozali.sch.id", IsPiket: false },
    { NIP: "19900910003", Nama: "Ustadz Ihsan Kamil, Lc.", Unit: "TMMIA", NoHP: "081234567892", Email: "ihsan.kamil@alghozali.sch.id", IsPiket: false },
    { NIP: "19920211004", Nama: "Ustadz Anwar Sadad, S.Ag.", Unit: "SMA", NoHP: "081234567893", Email: "anwar.sadad@alghozali.sch.id", IsPiket: true },
    { NIP: "19880707005", Nama: "Ustadzah Khadijah, S.Pd.", Unit: "SMP", NoHP: "081234567894", Email: "khadijah@alghozali.sch.id", IsPiket: false },
    { NIP: "19910515006", Nama: "Ustadz Hamzah Fansuri, M.A.", Unit: "TMMIA", NoHP: "081234567895", Email: "hamzah.fansuri@alghozali.sch.id", IsPiket: false }
  ],
  DATA_MAPEL: [
    { KodeMapel: "ARA-01", NamaMapel: "Durusul Lughah (Bahasa Arab)", Unit: "TMMIA" },
    { KodeMapel: "FIQ-01", NamaMapel: "Fikih Islam", Unit: "TMMIA" },
    { KodeMapel: "MTK-01", NamaMapel: "Matematika", Unit: "SMA" },
    { KodeMapel: "MTK-02", NamaMapel: "Matematika", Unit: "SMP" },
    { KodeMapel: "IPA-01", NamaMapel: "Fisika", Unit: "SMA" },
    { KodeMapel: "IPA-02", NamaMapel: "Sains Terpadu", Unit: "SMP" },
    { KodeMapel: "TAF-01", NamaMapel: "Tafsir Jalalain", Unit: "TMMIA" },
    { KodeMapel: "ENG-01", NamaMapel: "Bahasa Inggris", Unit: "SMA" }
  ],
  DATA_KELAS: [
    { KodeKelas: "SMP-7A", NamaKelas: "7A SMP", Unit: "SMP" },
    { KodeKelas: "SMP-8A", NamaKelas: "8A SMP", Unit: "SMP" },
    { KodeKelas: "SMA-10A", NamaKelas: "X IPA SMA", Unit: "SMA" },
    { KodeKelas: "SMA-11A", NamaKelas: "XI IPA SMA", Unit: "SMA" },
    { KodeKelas: "TMMIA-1", NamaKelas: "Kelas 1 TMMIA", Unit: "TMMIA" },
    { KodeKelas: "TMMIA-2", NamaKelas: "Kelas 2 TMMIA", Unit: "TMMIA" }
  ],
  DATA_JADWAL: [
    // Senin Schedules
    { IdJadwal: "J-001", NIP: "19800115001", Hari: "Senin", JamKe: 1, KodeMapel: "MTK-01", KodeKelas: "SMA-11A" },
    { IdJadwal: "J-002", NIP: "19800115001", Hari: "Senin", JamKe: 2, KodeMapel: "MTK-01", KodeKelas: "SMA-11A" },
    { IdJadwal: "J-003", NIP: "19800115001", Hari: "Senin", JamKe: 3, KodeMapel: "MTK-01", KodeKelas: "SMA-10A" },
    
    { IdJadwal: "J-004", NIP: "19850420002", Hari: "Senin", JamKe: 1, KodeMapel: "IPA-02", KodeKelas: "SMP-7A" },
    { IdJadwal: "J-005", NIP: "19850420002", Hari: "Senin", JamKe: 2, KodeMapel: "IPA-02", KodeKelas: "SMP-7A" },
    { IdJadwal: "J-006", NIP: "19850420002", Hari: "Senin", JamKe: 4, KodeMapel: "MTK-02", KodeKelas: "SMP-8A" },
    
    { IdJadwal: "J-007", NIP: "19900910003", Hari: "Senin", JamKe: 3, KodeMapel: "ARA-01", KodeKelas: "TMMIA-1" },
    { IdJadwal: "J-008", NIP: "19900910003", Hari: "Senin", JamKe: 4, KodeMapel: "ARA-01", KodeKelas: "TMMIA-1" },
    { IdJadwal: "J-009", NIP: "19900910003", Hari: "Senin", JamKe: 5, KodeMapel: "FIQ-01", KodeKelas: "TMMIA-2" },
    
    { IdJadwal: "J-010", NIP: "19920211004", Hari: "Senin", JamKe: 5, KodeMapel: "ENG-01", KodeKelas: "SMA-10A" },
    { IdJadwal: "J-011", NIP: "19920211004", Hari: "Senin", JamKe: 6, KodeMapel: "ENG-01", KodeKelas: "SMA-10A" },
    
    { IdJadwal: "J-012", NIP: "19880707005", Hari: "Senin", JamKe: 3, KodeMapel: "MTK-02", KodeKelas: "SMP-7A" },
    { IdJadwal: "J-013", NIP: "19880707005", Hari: "Senin", JamKe: 4, KodeMapel: "MTK-02", KodeKelas: "SMP-7A" },
    
    { IdJadwal: "J-014", NIP: "19910515006", Hari: "Senin", JamKe: 1, KodeMapel: "TAF-01", KodeKelas: "TMMIA-2" },
    { IdJadwal: "J-015", NIP: "19910515006", Hari: "Senin", JamKe: 2, KodeMapel: "TAF-01", KodeKelas: "TMMIA-2" },

    // Selasa Schedules
    { IdJadwal: "J-016", NIP: "19800115001", Hari: "Selasa", JamKe: 3, KodeMapel: "MTK-01", KodeKelas: "SMA-11A" },
    { IdJadwal: "J-017", NIP: "19850420002", Hari: "Selasa", JamKe: 1, KodeMapel: "IPA-02", KodeKelas: "SMP-8A" },
    { IdJadwal: "J-018", NIP: "19900910003", Hari: "Selasa", JamKe: 2, KodeMapel: "TAF-01", KodeKelas: "TMMIA-1" }
  ],
  DATA_IZIN: [
    {
      IdIzin: "IZ-20260715-001",
      Tanggal: "2026-07-15",
      Hari: "Rabu",
      NIP: "19850420002",
      Unit: "SMP",
      JenisIzin: "Izin Sakit",
      Alasan: "Demam tinggi, disarankan dokter istirahat total selama 2 hari.",
      Status: "Selesai",
      LampiranUrl: "/uploads/surat_dokter_fatimah.pdf",
      LampiranNama: "surat_dokter_fatimah.pdf",
      CreatedAt: "2026-07-15T07:30:00.000Z"
    },
    {
      IdIzin: "IZ-20260718-001",
      Tanggal: "2026-07-18",
      Hari: "Sabtu",
      NIP: "19900910003",
      Unit: "TMMIA",
      JenisIzin: "Izin Kedinasan",
      Alasan: "Menghadiri Rapat Koordinasi Kurikulum Pondok Modern se-Jawa Barat di Bandung.",
      Status: "Disetujui",
      LampiranUrl: "/uploads/surat_tugas_ihsan.pdf",
      LampiranNama: "surat_tugas_ihsan.pdf",
      CreatedAt: "2026-07-17T10:15:00.000Z"
    },
    {
      IdIzin: "IZ-20260719-001",
      Tanggal: "2026-07-19",
      Hari: "Senin",
      NIP: "19800115001",
      Unit: "SMA",
      JenisIzin: "Izin Pribadi",
      Alasan: "Mengantar orang tua kontrol kesehatan berkala di rumah sakit rujukan.",
      Status: "Menunggu Persetujuan",
      LampiranUrl: "",
      LampiranNama: "",
      CreatedAt: "2026-07-19T06:00:00.000Z"
    }
  ],
  DATA_GURU_PENGGANTI: [
    {
      IdIzin: "IZ-20260715-001",
      JamKe: 1,
      NIPOriginal: "19850420002",
      NIPPengganti: "19880707005",
      KodeKelas: "SMP-7A",
      KodeMapel: "IPA-02",
      Materi: "Suhu dan Kalor",
      Tugas: "Mengerjakan latihan soal halaman 45 No. 1-5",
      HalamanBuku: "45-46",
      TargetPembelajaran: "Siswa memahami perpindahan kalor secara konduksi, konveksi, dan radiasi",
      Instruksi: "Harap mendampingi siswa, mengumpulkan tugas di akhir jam pelajaran."
    },
    {
      IdIzin: "IZ-20260719-001",
      JamKe: 1,
      NIPOriginal: "19800115001",
      NIPPengganti: "19920211004",
      KodeKelas: "SMA-11A",
      KodeMapel: "MTK-01",
      Materi: "Persamaan Kuadrat",
      Tugas: "Latihan Soal Sub-bab 2.3",
      HalamanBuku: "72",
      TargetPembelajaran: "Siswa mampu menyelesaikan persamaan kuadrat dengan rumus kuadratik (abc)",
      Instruksi: "Bantu siswa jika ada kesulitan, pastikan kondisi kelas kondusif."
    },
    {
      IdIzin: "IZ-20260719-001",
      JamKe: 2,
      NIPOriginal: "19800115001",
      NIPPengganti: "19920211004",
      KodeKelas: "SMA-11A",
      KodeMapel: "MTK-01",
      Materi: "Fungsi Kuadrat",
      Tugas: "Menggambar grafik fungsi kuadrat di buku milimeter blok",
      HalamanBuku: "75",
      TargetPembelajaran: "Siswa mampu menggambar sketsa grafik fungsi kuadrat sederhana",
      Instruksi: "Bagikan kertas milimeter blok yang berada di lemari guru."
    }
  ],
  DATA_LOG: [
    { IdLog: "L-001", Timestamp: "2026-07-15T07:30:00.000Z", User: "fatimah", Activity: "Pengajuan Izin", Details: "Mengajukan Izin Sakit untuk tanggal 2026-07-15" },
    { IdLog: "L-002", Timestamp: "2026-07-15T08:00:00.000Z", User: "anwar", Activity: "Verifikasi Piket", Details: "Guru Piket memverifikasi perizinan IZ-20260715-001" },
    { IdLog: "L-003", Timestamp: "2026-07-15T09:00:00.000Z", User: "waka_kurikulum", Activity: "Persetujuan Waka", Details: "Waka Kurikulum menyetujui perizinan IZ-20260715-001" },
    { IdLog: "L-004", Timestamp: "2026-07-15T10:00:00.000Z", User: "kabid_pendidikan", Activity: "Persetujuan Final", Details: "Kabid Pendidikan menyetujui perizinan IZ-20260715-001 (Selesai)" },
    { IdLog: "L-005", Timestamp: "2026-07-19T06:00:00.000Z", User: "ahmad", Activity: "Pengajuan Izin", Details: "Mengajukan Izin Pribadi untuk tanggal 2026-07-19" }
  ],
  DATA_USER: [
    { Username: "admin", PasswordRaw: "admin123", NIP: "19780315007", Role: "Administrator", Email: "mursyid.anwar@alghozali.sch.id" },
    { Username: "ahmad", PasswordRaw: "guru123", NIP: "19800115001", Role: "Guru", Email: "ahmad.fauzi@alghozali.sch.id" },
    { Username: "fatimah", PasswordRaw: "guru123", NIP: "19850420002", Role: "Guru", Email: "fatimah.zahra@alghozali.sch.id" },
    { Username: "ihsan", PasswordRaw: "guru123", NIP: "19900910003", Role: "Guru", Email: "ihsan.kamil@alghozali.sch.id" },
    { Username: "anwar", PasswordRaw: "piket123", NIP: "19920211004", Role: "Guru Piket", Email: "anwar.sadad@alghozali.sch.id" },
    { Username: "waka", PasswordRaw: "waka123", NIP: "-", Role: "Waka Kurikulum", Email: "waka.kurikulum@alghozali.sch.id" },
    { Username: "kabid", PasswordRaw: "kabid123", NIP: "-", Role: "Kepala Bidang Pendidikan", Email: "kabid.pendidikan@alghozali.sch.id" }
  ],
  DATA_APPROVAL: [
    { IdApproval: "AP-001", IdIzin: "IZ-20260715-001", ApproverRole: "Guru Piket", ApproverName: "Ustadz Anwar Sadad, S.Ag.", Status: "Disetujui", TanggalApproval: "2026-07-15T08:00:00.000Z", Catatan: "Dokumen surat keterangan dokter valid." },
    { IdApproval: "AP-002", IdIzin: "IZ-20260715-001", ApproverRole: "Waka Kurikulum", ApproverName: "Ustadz H. Abdul Halim, Lc.", Status: "Disetujui", TanggalApproval: "2026-07-15T09:00:00.000Z", Catatan: "Disetujui. Guru pengganti sudah sesuai." },
    { IdApproval: "AP-003", IdIzin: "IZ-20260715-001", ApproverRole: "Kepala Bidang Pendidikan", ApproverName: "Dr. KH. Ghozali, M.A.", Status: "Disetujui", TanggalApproval: "2026-07-15T10:00:00.000Z", Catatan: "Semoga lekas sembuh." },
    { IdApproval: "AP-004", IdIzin: "IZ-20260718-001", ApproverRole: "Guru Piket", ApproverName: "Ustadz Anwar Sadad, S.Ag.", Status: "Disetujui", TanggalApproval: "2026-07-17T11:00:00.000Z", Catatan: "Agenda dinas pondok disetujui." },
    { IdApproval: "AP-005", IdIzin: "IZ-20260718-001", ApproverRole: "Waka Kurikulum", ApproverName: "Ustadz H. Abdul Halim, Lc.", Status: "Disetujui", TanggalApproval: "2026-07-17T14:30:00.000Z", Catatan: "Penting untuk pengembangan kurikulum." }
  ]
};

// Singleton db instance
class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = { ...INITIAL_DATABASE };
    this.load();
  }

  // Load from db.json file
  public load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(fileContent);
      } else {
        this.save();
      }
    } catch (e) {
      console.error("Failed to load database. Using initial database.", e);
      this.data = { ...INITIAL_DATABASE };
    }
  }

  // Save to db.json file
  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to save database.", e);
    }
  }

  // Get entire DB
  public getAll(): DatabaseSchema {
    return this.data;
  }

  // Set entire DB (Restore)
  public restore(newData: DatabaseSchema) {
    this.data = newData;
    this.save();
    this.log("SYSTEM", "Restore Database", "Database dipulihkan dari cadangan");
  }

  // Reset to initial
  public reset() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    this.save();
    this.log("SYSTEM", "Reset Database", "Database diatur ulang ke kondisi awal");
  }

  // Add Log Entry
  public log(user: string, activity: string, details: string) {
    const id = "L-" + String(this.data.DATA_LOG.length + 1).padStart(3, "0");
    const newLog: Log = {
      IdLog: id,
      Timestamp: new Date().toISOString(),
      User: user,
      Activity: activity,
      Details: details
    };
    this.data.DATA_LOG.unshift(newLog); // Put latest logs first
    this.save();
  }

  // Substitute logic checking
  // Returns list of Guru that are free during specific JamKe on specific Hari
  public getAvailableSubstitutes(hari: string, jamList: number[], excludeNIP: string): Guru[] {
    const allGuru = this.data.DATA_GURU;
    const allJadwal = this.data.DATA_JADWAL;
    const allIzin = this.data.DATA_IZIN;
    const allPengganti = this.data.DATA_GURU_PENGGANTI;

    // Filter out teachers who are currently on an approved or pending permit on that date (if relevant, but here we check schedule block)
    return allGuru.filter((guru) => {
      // Cannot substitute themselves
      if (guru.NIP === excludeNIP) return false;

      // Check if this teacher has scheduled classes on any of these JamKe
      const hasClass = allJadwal.some(
        (j) => j.NIP === guru.NIP && j.Hari === hari && jamList.includes(j.JamKe)
      );
      if (hasClass) return false;

      // Check if this teacher is already assigned as a substitute teacher on these JamKe
      // for an active permit (though they can substitute multiple if they have time, typically they shouldn't conflict)
      const isAlreadySubstituting = allPengganti.some((p) => {
        const relatedIzin = allIzin.find((iz) => iz.IdIzin === p.IdIzin);
        const isActive = relatedIzin && ["Menunggu Persetujuan", "Disetujui"].includes(relatedIzin.Status);
        return isActive && p.NIPPengganti === guru.NIP && jamList.includes(p.JamKe);
      });
      if (isAlreadySubstituting) return false;

      return true;
    });
  }
}

export const dbInstance = new Database();
