import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { UploadSuratView } from './components/UploadSuratView';
import { SuratMasukListView } from './components/SuratMasukListView';
import { DetailSuratView } from './components/DetailSuratView';
import { DraftEditorView } from './components/DraftEditorView';
import { BentrokView } from './components/BentrokView';
import { KategoriTemplateView } from './components/KategoriTemplateView';
import { KategoriBaruView } from './components/KategoriBaruView';
import { FasilitasView } from './components/FasilitasView';
import { PembelajaranView } from './components/PembelajaranView';
import { AuditLogView } from './components/AuditLogView';
import { PengaturanView } from './components/PengaturanView';
import {
  User,
  SuratMasuk,
  DraftBalasan,
  KategoriSurat,
  TemplateSurat,
  FasilitasBooking,
  UsulanPembaruan,
  AuditLog,
  Pengaturan,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Selected sub-views
  const [selectedSuratId, setSelectedSuratId] = useState<string | null>(null);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);

  // Data states
  const [suratList, setSuratList] = useState<SuratMasuk[]>([]);
  const [draftsList, setDraftsList] = useState<DraftBalasan[]>([]);
  const [kategoriList, setKategoriList] = useState<KategoriSurat[]>([]);
  const [templatesList, setTemplatesList] = useState<TemplateSurat[]>([]);
  const [fasilitasList, setFasilitasList] = useState<FasilitasBooking[]>([]);
  const [usulanList, setUsulanList] = useState<UsulanPembaruan[]>([]);
  const [contohRevisi, setContohRevisi] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [pengaturan, setPengaturan] = useState<Pengaturan | null>(null);

  // Proactive Reminders
  const [reminders, setReminders] = useState<Array<{ surat: SuratMasuk; lama_hari: number }>>([]);
  const [collisions, setCollisions] = useState<Array<{ surat_a: SuratMasuk; surat_b: SuratMasuk; alasan: string }>>([]);

  const [counts, setCounts] = useState({
    total_surat: 0,
    surat_baru: 0,
    sedang_diproses: 0,
    bentrok: 0,
    draft_siap: 0,
    selesai: 0,
    usulan_menunggu: 0,
    agenda_aktif: 0,
  });

  const loadAllData = async () => {
    try {
      // 1. User
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) setUser(await userRes.json());

      // 2. Summary
      const sumRes = await fetch('/api/dashboard-summary');
      if (sumRes.ok) {
        const sum = await sumRes.json();
        setCounts(sum.counts);
        setReminders(sum.pengingat_tertunda || []);
        setCollisions(sum.konflik_potensial_antar_surat || []);
      }

      // 3. Surat
      const suratRes = await fetch('/api/surat-masuk');
      if (suratRes.ok) setSuratList(await suratRes.json());

      // 4. Drafts
      const draftsRes = await fetch('/api/drafts');
      if (draftsRes.ok) setDraftsList(await draftsRes.json());

      // 5. Kategori & Template
      const katRes = await fetch('/api/kategori');
      if (katRes.ok) setKategoriList(await katRes.json());

      const tmplRes = await fetch('/api/templates');
      if (tmplRes.ok) setTemplatesList(await tmplRes.json());

      // 6. Fasilitas Ruangan
      const fasRes = await fetch('/api/fasilitas');
      if (fasRes.ok) setFasilitasList(await fasRes.json());

      // 7. Pembelajaran
      const pembRes = await fetch('/api/pembelajaran');
      if (pembRes.ok) {
        const pData = await pembRes.json();
        setContohRevisi(pData.contoh_revisi || []);
        setUsulanList(pData.usulan_pembaruan || []);
      }

      // 8. Logs & Pengaturan
      const logRes = await fetch('/api/audit-logs');
      if (logRes.ok) setAuditLogs(await logRes.json());

      const pengRes = await fetch('/api/pengaturan');
      if (pengRes.ok) setPengaturan(await pengRes.json());
    } catch (e) {
      console.error('Failed to load application data:', e);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Process Agent handler
  const handleProcessAgent = async (suratId: string) => {
    try {
      const res = await fetch(`/api/surat-masuk/${suratId}/process-agent`, {
        method: 'POST',
      });
      const data = await res.json();
      await loadAllData();

      if (data.bentrok_detected) {
        setActiveTab('bentrok');
        setSelectedSuratId(suratId);
      } else if (data.draft_id) {
        setSelectedDraftId(data.draft_id);
        setActiveTab('drafts');
      } else {
        setSelectedSuratId(suratId);
      }
    } catch (e) {
      console.error(e);
      alert('Gagal memproses agent');
    }
  };

  // Resolve conflict handler
  const handleResolveConflict = async (suratId: string, altTanggal: string, altRuangan: string) => {
    try {
      const res = await fetch(`/api/surat-masuk/${suratId}/resolve-conflict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alternatif_tanggal: altTanggal,
          alternatif_ruangan: altRuangan,
        }),
      });
      const data = await res.json();
      await loadAllData();

      if (data.draft_id) {
        setSelectedDraftId(data.draft_id);
        setActiveTab('drafts');
      } else {
        setActiveTab('surat-masuk');
      }
    } catch (e) {
      console.error(e);
      alert('Gagal menyelesaikan bentrok');
    }
  };

  // Decide proposal (approve / reject)
  const handleResolveUsulan = async (id: string, status: 'disetujui' | 'ditolak') => {
    try {
      await fetch(`/api/pembelajaran/usulan/${id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  // Reset database to initial seed
  const handleResetSeed = async () => {
    try {
      await fetch('/api/db/reset', { method: 'POST' });
      setSelectedSuratId(null);
      setSelectedDraftId(null);
      await loadAllData();
      setActiveTab('dashboard');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        pendingCount={counts.surat_baru}
        reminders={reminders}
        collisions={collisions}
        onSelectSurat={(id) => {
          setSelectedSuratId(id);
          setSelectedDraftId(null);
          setActiveTab('surat-masuk');
        }}
        onResetSeed={handleResetSeed}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setSelectedSuratId(null);
            setSelectedDraftId(null);
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          counts={counts}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {/* Detailed View for Single Selected Draft */}
          {selectedDraftId && (
            <DraftEditorView
              draftId={selectedDraftId}
              onBack={() => setSelectedDraftId(null)}
              onRefreshData={loadAllData}
            />
          )}

          {/* Detailed View for Single Selected Surat */}
          {!selectedDraftId && selectedSuratId && (
            <DetailSuratView
              suratId={selectedSuratId}
              onBack={() => setSelectedSuratId(null)}
              onProcessAgent={handleProcessAgent}
              onNavigateToDraft={(dId) => setSelectedDraftId(dId)}
              onNavigateToBentrok={() => setActiveTab('bentrok')}
            />
          )}

          {/* Standard Tab Navigation Views */}
          {!selectedDraftId && !selectedSuratId && (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  counts={counts}
                  reminders={reminders}
                  collisions={collisions}
                  usulanList={usulanList.filter((u) => u.status === 'menunggu')}
                  recentSurat={suratList.slice(0, 5)}
                  recentDrafts={draftsList.slice(0, 5)}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onSelectSurat={(id) => setSelectedSuratId(id)}
                  onSelectDraft={(id) => setSelectedDraftId(id)}
                  onProcessAgent={handleProcessAgent}
                  onResolveUsulan={handleResolveUsulan}
                />
              )}

              {activeTab === 'upload' && (
                <UploadSuratView
                  onUploadSuccess={(surat, run, draftId) => {
                    loadAllData();
                    if (draftId) setSelectedDraftId(draftId);
                  }}
                  onNavigateToDraft={(dId) => setSelectedDraftId(dId)}
                  onNavigateToBentrok={() => setActiveTab('bentrok')}
                />
              )}

              {activeTab === 'surat-masuk' && (
                <SuratMasukListView
                  suratList={suratList}
                  onSelectSurat={(id) => setSelectedSuratId(id)}
                  onProcessAgent={handleProcessAgent}
                  onSelectDraft={(dId) => setSelectedDraftId(dId)}
                  onNavigateUpload={() => setActiveTab('upload')}
                  onNavigateBentrok={() => setActiveTab('bentrok')}
                />
              )}

              {activeTab === 'drafts' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                        Daftar Draft Surat Balasan (.docx)
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">
                        Pilih draft untuk ditinjau, melengkapi nomor surat (B-____), menyunting redaksi, dan mengunduh berkas Word.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {draftsList.map((d) => (
                      <div
                        key={d.id}
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 hover:border-emerald-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                            {d.nomor_surat_text}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            {d.jumlah_putaran} Putaran Audit
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{d.perihal}</h4>
                          <p className="text-xs text-slate-600 mt-1 whitespace-pre-line line-clamp-2">
                            Kepada: {d.tujuan_surat.split('\n')[0]}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-slate-500">
                            {new Date(d.created_at).toLocaleDateString('id-ID')}
                          </span>
                          <button
                            onClick={() => setSelectedDraftId(d.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#0B2A4A] text-white text-xs font-semibold hover:bg-[#123B66]"
                          >
                            Buka & Periksa Draft
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'bentrok' && (
                <BentrokView
                  suratList={suratList}
                  onResolveConflict={handleResolveConflict}
                  onNavigateToDraft={(dId) => setSelectedDraftId(dId)}
                />
              )}

              {activeTab === 'agenda' && (
                <FasilitasView
                  fasilitasList={fasilitasList}
                  onRefresh={loadAllData}
                />
              )}

              {activeTab === 'kategori-template' && (
                <KategoriTemplateView
                  kategoriList={kategoriList}
                  templates={templatesList}
                  onRefresh={loadAllData}
                />
              )}

              {activeTab === 'kategori-baru' && (
                <KategoriBaruView
                  suratList={suratList}
                  kategoriList={kategoriList}
                  onRefresh={loadAllData}
                  onNavigateToDraft={(dId) => setSelectedDraftId(dId)}
                />
              )}

              {activeTab === 'pembelajaran' && (
                <PembelajaranView
                  contohRevisi={contohRevisi}
                  usulanList={usulanList}
                  onResolveUsulan={handleResolveUsulan}
                />
              )}

              {activeTab === 'audit-log' && (
                <AuditLogView logs={auditLogs} />
              )}

              {activeTab === 'pengaturan' && pengaturan && (
                <PengaturanView
                  pengaturan={pengaturan}
                  onRefresh={loadAllData}
                  onResetSeed={handleResetSeed}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
