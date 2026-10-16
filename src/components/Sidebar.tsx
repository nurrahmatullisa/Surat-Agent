import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  Inbox,
  FileText,
  AlertOctagon,
  Building2,
  Bookmark,
  Sparkles,
  GraduationCap,
  History,
  Settings,
  X,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'upload'
  | 'surat-masuk'
  | 'drafts'
  | 'bentrok'
  | 'agenda'
  | 'kategori-template'
  | 'kategori-baru'
  | 'pembelajaran'
  | 'audit-log'
  | 'pengaturan';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
  counts: {
    surat_baru: number;
    bentrok: number;
    draft_siap: number;
    usulan_menunggu: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
  counts,
}) => {
  const menuItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'dashboard',
      label: 'Dashboard & Pengingat',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'upload',
      label: 'Upload Surat Masuk',
      icon: <UploadCloud className="w-4 h-4" />,
    },
    {
      id: 'surat-masuk',
      label: 'Daftar Surat Masuk',
      icon: <Inbox className="w-4 h-4" />,
      badge: counts.surat_baru > 0 ? counts.surat_baru : undefined,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'drafts',
      label: 'Draft Surat Balasan',
      icon: <FileText className="w-4 h-4" />,
      badge: counts.draft_siap > 0 ? counts.draft_siap : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'bentrok',
      label: 'Cek Bentrok Fasilitas',
      icon: <AlertOctagon className="w-4 h-4" />,
      badge: counts.bentrok > 0 ? counts.bentrok : undefined,
      badgeColor: 'bg-red-100 text-red-800 font-bold',
    },
    {
      id: 'agenda',
      label: 'Ketersediaan Fasilitas',
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      id: 'kategori-template',
      label: 'Kategori & Template',
      icon: <Bookmark className="w-4 h-4" />,
    },
    {
      id: 'kategori-baru',
      label: 'Surat Kategori Baru',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      id: 'pembelajaran',
      label: 'Pembelajaran Agent',
      icon: <GraduationCap className="w-4 h-4" />,
      badge: counts.usulan_menunggu > 0 ? counts.usulan_menunggu : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'audit-log',
      label: 'Riwayat & Log',
      icon: <History className="w-4 h-4" />,
    },
    {
      id: 'pengaturan',
      label: 'Pengaturan Sistem',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 md:top-16 z-50 md:z-30 h-full md:h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-100 bg-[#0B2A4A] text-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#14B8A6] text-[#0B2A4A] font-bold text-sm flex items-center justify-center">
              TU
            </div>
            <span className="font-semibold text-sm">TU Smart Agent</span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu Utama
          </div>

          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-[#0B2A4A] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`${isActive ? 'text-teal-300' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                      isActive ? 'bg-teal-500 text-[#0B2A4A]' : item.badgeColor || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3.5 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500 leading-relaxed">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>Fasilitas: Aula, Lab 1, Lab 2</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            Tanpa surat penolakan · Nomor B-____ manual · TTD di Srikandi.
          </p>
        </div>
      </aside>
    </>
  );
};
