import React, { useState } from 'react';
import { Bell, RefreshCw, Menu, ShieldCheck, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onToggleSidebar: () => void;
  pendingCount: number;
  reminders: Array<{ surat: { id: string; perihal: string; instansi_pengirim: string }; lama_hari: number }>;
  collisions: Array<{ alasan: string }>;
  onSelectSurat: (id: string) => void;
  onResetSeed: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onToggleSidebar,
  pendingCount,
  reminders,
  collisions,
  onSelectSurat,
  onResetSeed,
}) => {
  const [showNotif, setShowNotif] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (confirm('Reset seluruh data ke sampel bawaan awal (surat magang, aula bentrok BKD, narasumber)?')) {
      setResetting(true);
      await onResetSeed();
      setResetting(false);
    }
  };

  const totalAlerts = reminders.length + collisions.length;

  return (
    <header className="sticky top-0 z-40 bg-[#0B2A4A] text-white border-b border-[#123B66] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#123B66] focus:outline-none"
            aria-label="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#14B8A6] flex items-center justify-center text-[#0B2A4A] font-bold text-lg shadow-sm">
              TU
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base sm:text-lg tracking-tight text-white whitespace-nowrap">
                  TU Smart Agent
                </span>
                <span className="hidden sm:inline-block text-[11px] font-medium bg-[#123B66] text-teal-300 px-2 py-0.5 rounded">
                  BLSDM.35
                </span>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block">
                Balai Latihan Sumber Daya Manusia · Draft Surat Balasan
              </p>
            </div>
          </div>
        </div>

        {/* Center/Right Actions */}
        <div className="flex items-center gap-3">
          {/* Reset Demo Button */}
          <button
            onClick={handleReset}
            disabled={resetting}
            title="Reset database ke data seed awal"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#123B66] text-slate-200 hover:text-white hover:bg-[#1b4b7e] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo</span>
          </button>

          {/* Notification / Proactive Alert Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotif(!showNotif)}
              className="relative p-2 rounded-lg text-slate-200 hover:text-white hover:bg-[#123B66] transition-colors"
              aria-label="Pengingat Proaktif"
            >
              <Bell className="w-5 h-5" />
              {totalAlerts > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {totalAlerts}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotif && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 p-4 z-50">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <h4 className="font-semibold text-sm text-slate-900">Pengingat Proaktif Agent</h4>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{totalAlerts} aktif</span>
                </div>

                <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto">
                  {collisions.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-red-900">Peringatan Bentrok Antar-Surat!</p>
                          <p className="text-xs text-red-700 mt-1 leading-relaxed">{collisions[0].alasan}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {reminders.length > 0 ? (
                    reminders.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          onSelectSurat(item.surat.id);
                          setShowNotif(false);
                        }}
                        className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-amber-950 line-clamp-1">{item.surat.perihal}</p>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-200/60 px-1.5 py-0.5 rounded shrink-0">
                            {item.lama_hari} hari
                          </span>
                        </div>
                        <p className="text-xs text-amber-800 mt-0.5">{item.surat.instansi_pengirim}</p>
                        <p className="text-[11px] text-amber-700 mt-1.5 flex items-center gap-1 font-medium">
                          <span>Klik untuk buka dan proses draft →</span>
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-xs text-slate-500 flex flex-col items-center gap-1.5">
                      <CheckCircle className="w-6 h-6 text-emerald-500" />
                      <span>Semua surat masuk tertangani tepat waktu.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#123B66]">
            <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-medium text-xs flex items-center justify-center border border-teal-400">
              SN
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-white leading-tight">
                {user?.nama || 'Siti Nurhaliza, S.AP'}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-teal-300">
                <ShieldCheck className="w-3 h-3" />
                <span>Staf Tata Usaha</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
