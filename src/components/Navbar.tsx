import { LogOut, Sun, Moon, Clock, Shield, Menu, X, BookOpen } from "lucide-react";
import { SessionUser } from "../types";
import { useState } from "react";

interface NavbarProps {
  user: SessionUser | null;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  availableTabs: { id: string; label: string; icon: any }[];
}

export default function Navbar({
  user,
  darkMode,
  setDarkMode,
  onLogout,
  activeTab,
  setActiveTab,
  availableTabs,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Format current local time dynamically or use mock time
  const formattedTime = "19:00 WIB";

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-700 hover:bg-teal-600 transition-colors cursor-pointer shadow-lg shadow-teal-500/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-lg block leading-none">SIPG AL-GHOZALI</span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wide">YPI PONDOK MODERN AL GHOZALI</span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          {user && (
            <div className="hidden lg:flex items-center space-x-1">
              {availableTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-nav-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-teal-700 text-white shadow-lg shadow-teal-700/10"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Right Accessories (User Info, Theme, Logout) */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-slate-400 font-mono text-xs border-r border-slate-800 pr-4">
              <Clock className="w-3.5 h-3.5" />
              <span>{formattedTime}</span>
            </div>

            {user && (
              <div className="flex items-center space-x-3 bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-800">
                <Shield className="w-4 h-4 text-teal-400" />
                <div className="text-left">
                  <span className="text-xs font-semibold block leading-none text-white">
                    {user.teacher ? user.teacher.Nama.split(",")[0] : (user.username === "admin" ? "Mursyid Anwar" : user.username)}
                  </span>
                  <span className="text-[9px] text-teal-400 font-mono block tracking-wider uppercase mt-0.5">
                    {user.role}
                  </span>
                </div>
              </div>
            )}

            <button
              id="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
              title={darkMode ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user && (
              <button
                id="btn-logout"
                onClick={onLogout}
                className="flex items-center space-x-1.5 px-3 py-2 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-sm font-medium transition-all cursor-pointer border border-rose-500/20"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex items-center space-x-2 md:hidden">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {user && mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-2 pt-2 pb-4 space-y-1">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center space-x-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? "bg-teal-700 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
          <div className="border-t border-slate-800 pt-3 mt-3 px-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400 font-mono uppercase">{user.role}</span>
              <span className="text-sm font-semibold text-white">
                {user.teacher ? user.teacher.Nama.split(",")[0] : (user.username === "admin" ? "Mursyid Anwar" : user.username)}
              </span>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="flex items-center justify-center space-x-2 w-full py-2 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-lg text-sm font-medium transition-all"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span>Keluar Aplikasi</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
