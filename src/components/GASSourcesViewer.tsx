import { useState } from "react";
import { GAS_SOURCES, GASFile } from "./GASSources";
import { Copy, Check, FileCode, Terminal, Layers, PlayCircle, ExternalLink } from "lucide-react";

export default function GASSourcesViewer() {
  const [selectedFile, setSelectedFile] = useState<GASFile>(GAS_SOURCES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors duration-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-indigo-500" />
              <span>Pusat Ekspor Google Apps Script</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Salin seluruh kode di bawah ini langsung ke editor Google Apps Script Anda untuk meluncurkan aplikasi perizinan guru secara mandiri.
            </p>
          </div>
          <a
            href="https://script.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <span>Buka Google Apps Script</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* File Navigator Sidebar */}
        <div className="lg:col-span-3 border-r border-slate-100 dark:border-slate-700 p-4 space-y-1 bg-slate-50/30 dark:bg-slate-800/10">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 dark:text-slate-500 block px-3 uppercase mb-2 font-bold">
            Berkas Kode (.gs & .html)
          </span>
          <div className="space-y-1">
            {GAS_SOURCES.map((file) => (
              <button
                key={file.name}
                onClick={() => setSelectedFile(file)}
                className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedFile.name === file.name
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-600"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <FileCode className={`w-4 h-4 shrink-0 ${selectedFile.name === file.name ? "text-indigo-500" : "text-slate-400"}`} />
                  <span className="truncate">{file.name}</span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase ${
                  file.type === "gs" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                }`}>
                  {file.type}
                </span>
              </button>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-700 mt-6 px-3">
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center space-x-1.5 mb-2">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Struktur Spreadsheet</span>
            </h4>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Buat dokumen Google Sheets baru, lalu buat 9 Tab (Sheet) dengan nama yang sama persis seperti nama tab database pada menu <strong>Database Sheets</strong>.
            </p>
          </div>
        </div>

        {/* Code Output Viewer */}
        <div className="lg:col-span-9 flex flex-col h-[580px] bg-slate-950 text-slate-100">
          {/* Code Header Control */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/80">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4.5 h-4.5 text-indigo-400" />
              <div>
                <span className="font-mono text-sm font-semibold">{selectedFile.name}</span>
                <span className="text-[10px] block text-slate-400">{selectedFile.description}</span>
              </div>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 hover:text-white text-xs font-medium rounded-lg transition-all border border-slate-700/50 cursor-pointer shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Kode</span>
                </>
              )}
            </button>
          </div>

          {/* Actual Code Block */}
          <div className="flex-1 overflow-auto p-4 md:p-6 font-mono text-xs leading-relaxed bg-slate-950 text-slate-300">
            <pre className="whitespace-pre scrollbar-thin select-all">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Footer Instruction Banner */}
      <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-indigo-50/30 dark:bg-indigo-950/10">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center space-x-2 mb-3">
          <PlayCircle className="w-4.5 h-4.5 text-indigo-600" />
          <span>Panduan Deploy Singkat Google Apps Script:</span>
        </h3>
        <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
          <li>Buat Google Sheets baru di Google Drive Anda, ubah nama dokumen menjadi <strong>Sistem Perizinan Guru</strong>.</li>
          <li>Buat tab-tab sheet kosong di dalamnya dengan nama: <code>DATA_GURU</code>, <code>DATA_MAPEL</code>, <code>DATA_KELAS</code>, <code>DATA_JADWAL</code>, <code>DATA_IZIN</code>, <code>DATA_GURU_PENGGANTI</code>, <code>DATA_LOG</code>, <code>DATA_USER</code>, dan <code>DATA_APPROVAL</code>.</li>
          <li>Klik menu <strong>Ekstensi</strong> → <strong>Apps Script</strong>.</li>
          <li>Hapus kode bawaan, lalu tambahkan file script baru (misal: <code>Code</code>, <code>Database</code>, <code>Drive</code>, dan seterusnya) lalu copy-paste kode dari Pusat Ekspor ini ke masing-masing file yang bersangkutan.</li>
          <li>Ubah nilai konstanta <code>SPREADSHEET_ID</code> di dalam <code>Database.gs</code> dengan ID Spreadsheet Anda (yang ada di tautan alamat peramban).</li>
          <li>Klik <strong>Terapkan</strong> (Deploy) → <strong>Penerapan baru</strong> → Pilih Jenis: <strong>Aplikasi web</strong> → Konfigurasi Akses: <strong>Siapa saja</strong> (Anyone).</li>
          <li>Otorisasi izin Google Akun Anda, salin tautan URL Aplikasi Web yang dihasilkan, dan jalankan!</li>
        </ol>
      </div>
    </div>
  );
}
