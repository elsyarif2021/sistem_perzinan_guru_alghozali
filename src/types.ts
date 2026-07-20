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
  Hari: string;
  JamKe: number;
  KodeMapel: string;
  KodeKelas: string;
}

export interface Izin {
  IdIzin: string;
  Tanggal: string;
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
  NIPPengganti: string;
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
  PasswordRaw: string;
  NIP: string;
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

export interface SimulatedEmail {
  id: string;
  timestamp: string;
  to: string;
  subject: string;
  body: string;
}

export interface SessionUser {
  username: string;
  role: "Administrator" | "Kepala Bidang Pendidikan" | "Waka Kurikulum" | "Guru" | "Guru Piket";
  nip: string;
  email: string;
  teacher?: Guru;
}
