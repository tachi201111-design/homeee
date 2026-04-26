import React, { useState, useEffect, Component, ErrorInfo, ReactNode, useRef, Suspense } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { OBJLoader } from 'three-stdlib';
import { 
  Home, 
  FolderOpen, 
  DraftingCompass, 
  Compass, 
  User, 
  Menu, 
  Settings, 
  Bell, 
  ChevronRight, 
  Globe, 
  Moon, 
  Ruler, 
  Mail, 
  Lock, 
  ShieldCheck, 
  Trash2, 
  Info, 
  FileText, 
  ShieldAlert, 
  Star,
  LogOut,
  PlusCircle,
  LayoutGrid,
  UploadCloud,
  BookOpen,
  Edit3,
  Save,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from './lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User as FirebaseUser 
} from 'firebase/auth';
import { dataService } from './services/dataService';
import { geminiService } from './services/geminiService';

// --- Types ---
type Tab = 'home' | 'projects' | 'design' | 'explore' | 'profile' | 'settings' | 'login';

// --- Shared Components ---
const BottomNav = ({ activeTab, setTab }: { activeTab: Tab; setTab: (t: Tab) => void }) => {
  const tabs = [
    { id: 'home', label: 'หน้าหลัก', icon: Home },
    { id: 'projects', label: 'โปรเจกต์', icon: FolderOpen },
    { id: 'design', label: 'ออกแบบ', icon: DraftingCompass },
    { id: 'explore', label: 'สำรวจ', icon: Compass },
    { id: 'profile', label: 'โปรไฟล์', icon: User },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe h-20 bg-brand-surface/95 backdrop-blur-xl border-t border-brand-border rounded-t-2xl shadow-[0_-8px_24px_rgba(0,0,0,0.4)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id || (tab.id === 'profile' && activeTab === 'settings');
        return (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id as Tab)}
            className={`flex flex-col items-center justify-center transition-all active:scale-90 ${
              isActive ? 'text-brand-accent' : 'text-brand-text-dim hover:text-brand-accent'
            }`}
          >
            <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-brand-accent/10' : ''}`}>
              <Icon size={24} />
            </div>
            <span className="text-[10px] font-bold mt-1 uppercase tracking-[0.1em]">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

const Header = ({ title, leftAction, user, onMenuClick }: { title: string; leftAction?: React.ReactNode; user?: FirebaseUser | null; onMenuClick?: () => void }) => (
  <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 h-16 bg-brand-bg/80 backdrop-blur-md border-b border-brand-border shadow-md">
    <div className="flex items-center gap-3">
      {leftAction || (
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors active:scale-95"
          aria-label="Toggle Menu"
        >
          <Menu size={24} />
        </button>
      )}
      <h1 className="text-xl font-serif font-semibold tracking-tight text-brand-text-main italic">{title}</h1>
    </div>
    <div className="w-10 h-10 rounded-full overflow-hidden border border-brand-accent/30 p-[1px] bg-brand-surface">
      {user?.photoURL ? (
        <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover rounded-full" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-brand-accent">
          <User size={20} />
        </div>
      )}
    </div>
  </header>
);

// --- Sub-Views ---

// --- Sub-Views ---

const ProjectsView = ({ onProjectClick }: { onProjectClick?: (title: string) => void }) => {
  const [filter, setFilter] = useState('all');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      const data = await dataService.getProjects();
      setProjects(data || []);
      setLoading(false);
    };
    fetchProjects();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('ยืนยันการลบโปรเจกต์นี้?')) {
      await dataService.deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  const filtered = filter === 'all' 
    ? projects 
    : projects.filter(p => p.status?.toLowerCase() === filter);

  return (
    <div className="pt-20 pb-24 px-6 max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-border pb-6">
        <div>
          <span className="text-[10px] text-brand-accent font-bold uppercase tracking-[0.3em]">Architectural Archives</span>
          <h2 className="text-4xl font-serif text-brand-text-main mt-2 italic tracking-tight">Project Registry</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {['all', 'live', 'draft', 'shared', 'archived'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${
                filter === f ? 'bg-brand-accent text-brand-bg shadow-lg' : 'bg-brand-surface text-brand-text-dim border border-brand-border hover:border-brand-accent/50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <label className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-dim/40">
           <Compass size={16} />
        </label>
        <input 
          type="text" 
          placeholder="Search encrypted archives..."
          className="w-full bg-brand-surface border border-brand-border rounded-sm py-4 pl-12 pr-4 text-xs font-light text-brand-text-main focus:outline-none focus:border-brand-accent transition-all placeholder:text-brand-text-dim/20"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 opacity-50 animate-pulse">
           {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[16/10] bg-brand-surface rounded-sm" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filtered.map((p) => (
            <motion.div 
              key={p.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onProjectClick?.(p.title)}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-brand-border bg-brand-surface shadow-2xl">
                <img 
                  src={p.img || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&fit=crop'} 
                  className="w-full h-full object-cover filter grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700 scale-105 group-hover:scale-100" 
                  alt={p.title}
                />
                <div className="absolute top-4 right-4 px-3 py-1 bg-brand-bg/80 backdrop-blur-sm border border-brand-accent text-brand-accent text-[8px] font-bold uppercase tracking-[0.2em] rounded-full">
                  {p.status}
                </div>
                <button 
                  onClick={(e) => handleDelete(p.id, e)}
                  className="absolute bottom-4 left-4 p-2 bg-red-500/20 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mt-5 flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-serif text-brand-text-main italic group-hover:text-brand-accent transition-colors">
                    {p.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[9px] text-brand-text-dim font-bold uppercase tracking-widest">Private</span>
                    <div className="w-1 h-1 rounded-full bg-brand-border" />
                    <span className="text-[9px] text-brand-text-dim font-bold uppercase tracking-widest">
                      {p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                </div>
                <button className="text-brand-accent opacity-0 group-hover:opacity-100 transition-all">
                  <PlusCircle size={20} className="rotate-45" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 border border-dashed border-brand-border rounded-sm">
          <p className="text-xs text-brand-text-dim uppercase tracking-[0.2em]">No records found in this sector</p>
        </div>
      )}
    </div>
  );
};

const SettingsView = ({ onSignOut }: { onSignOut: () => void }) => {
  const [darkTheme, setDarkTheme] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);

  // ... rest of SettingsView components

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-4 mt-8">
      <h3 className="text-[10px] font-bold text-brand-accent uppercase tracking-[0.2em] px-1">{title}</h3>
      <div className="bg-brand-surface rounded-lg border border-brand-border overflow-hidden">
        {children}
      </div>
    </div>
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Item = ({ icon: Icon, label, value, onClick, color = 'text-brand-text-dim' }: { icon: any; label: string; value?: string; onClick?: () => void; color?: string }) => (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-brand-border last:border-0 group text-left"
    >
      <div className="flex items-center gap-4">
        <Icon size={18} className={color} />
        <span className="font-medium text-brand-text-main text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-xs text-brand-text-dim">{value}</span>}
        <ChevronRight size={16} className="text-brand-text-dim group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Toggle = ({ icon: Icon, label, checked, onChange }: { icon: any; label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="w-full flex items-center justify-between p-4 border-b border-brand-border last:border-0">
      <div className="flex items-center gap-4">
        <Icon size={18} className="text-brand-text-dim" />
        <span className="font-medium text-brand-text-main text-sm">{label}</span>
      </div>
      <button 
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full transition-colors relative ${checked ? 'bg-brand-accent' : 'bg-brand-text-dim/20'}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );

  return (
    <div className="pt-20 pb-24 px-6 max-w-xl mx-auto">
      <div className="py-6 border-b border-brand-border">
        <h2 className="text-4xl font-serif font-light text-brand-text-main tracking-tight">การตั้งค่า</h2>
        <p className="text-xs text-brand-text-dim uppercase tracking-widest mt-2">Personalize your architectural experience</p>
      </div>

      <Section title="ทั่วไป">
        <Item icon={Globe} label="ภาษา" value="ไทย" />
        <Toggle icon={Moon} label="ธีมมืด" checked={darkTheme} onChange={setDarkTheme} />
        <Item icon={Ruler} label="หน่วยวัด" value="เมตริก (ม.)" />
      </Section>

      <Section title="การแจ้งเตือน">
        <Toggle icon={Bell} label="การแจ้งเตือนแบบพุช" checked={pushNotif} onChange={setPushNotif} />
        <Item icon={Mail} label="การแจ้งเตือนทางอีเมล" />
      </Section>

      <Section title="ความปลอดภัย">
        <Item icon={Lock} label="เปลี่ยนรหัสผ่าน" />
        <Item icon={ShieldCheck} label="การยืนยันสองขั้นตอน" />
        <Item icon={Trash2} label="ลบบัญชี" color="text-red-400" />
      </Section>

      <Section title="เกี่ยวกับ">
        <div className="w-full flex items-center justify-between p-4 border-b border-brand-border text-brand-text-main text-sm">
          <div className="flex items-center gap-4">
            <Info size={18} className="text-brand-text-dim" />
            <span className="font-medium text-sm">เวอร์ชันแอป</span>
          </div>
          <span className="text-xs text-brand-text-dim">v4.2.0 (Build 2024)</span>
        </div>
        <Item icon={FileText} label="ข้อกำหนดการให้บริการ" />
        <Item icon={ShieldAlert} label="นโยบายความเป็นส่วนตัว" />
        <Item icon={Star} label="ให้คะแนนแอป" />
      </Section>

      <button 
        onClick={onSignOut}
        className="w-full mt-10 py-4 rounded-md border border-brand-accent text-brand-accent text-xs font-bold uppercase tracking-widest hover:bg-brand-accent hover:text-brand-bg transition-all flex items-center justify-center gap-3"
      >
        <LogOut size={16} /> ออกจากระบบ
      </button>
      
      <p className="text-center mt-12 text-brand-text-dim text-[10px] font-bold uppercase tracking-[0.3em]">
        Design Intelligence v4.2
      </p>
    </div>
  );
};

const HomeView = ({ setTab, user }: { setTab: (t: Tab) => void; user: FirebaseUser | null }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      const data = await dataService.getProjects();
      setProjects(data?.slice(0, 3) || []);
    };
    fetchProjects();
  }, []);

  return (
    <div className="pt-20 pb-24 px-6 max-w-2xl mx-auto space-y-10">
      <div className="flex items-center justify-between border-b border-brand-border pb-6">
        <div>
          <span className="text-[10px] text-brand-accent font-bold uppercase tracking-widest">Architectural Registry</span>
          <h2 className="text-3xl font-serif text-brand-text-main mt-1 italic">Welcome, {user?.displayName?.split(' ')[0] || 'Architect'}</h2>
        </div>
        <div className="px-3 py-1 border border-brand-accent text-brand-accent text-[8px] uppercase tracking-widest rounded-full">
          Estate Access
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-brand-text-main uppercase tracking-[0.2em]">Portfolio</h3>
        <button onClick={() => setTab('projects')} className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">View Archives</button>
      </div>
      <div className="flex gap-6 overflow-x-auto no-scrollbar -mx-6 px-6">
        {projects.length > 0 ? projects.map((p) => (
          <div 
            key={p.id} 
            onClick={() => setTab('design')}
            className="min-w-[280px] bg-brand-surface rounded-sm overflow-hidden border border-brand-border hover:border-brand-accent/50 transition-colors cursor-pointer group"
          >
            <div className="h-44 overflow-hidden filter grayscale group-hover:grayscale-0 transition-all duration-700">
              <img src={p.img || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop'} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="p-6">
              <h4 className="font-serif text-lg font-light text-brand-text-main italic group-hover:text-brand-accent transition-colors">{p.title}</h4>
              <p className="text-[10px] text-brand-text-dim uppercase tracking-wider mt-2">{p.status}</p>
            </div>
          </div>
        )) : (
          <div className="w-full py-10 text-center border border-dashed border-brand-border rounded-sm">
             <p className="text-[10px] text-brand-text-dim uppercase tracking-widest">No recent projects</p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <h3 className="text-sm font-bold text-brand-text-main uppercase tracking-[0.2em] mb-6">Operations</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: PlusCircle, label: 'New Project', active: true, onClick: () => setTab('design') },
            { icon: LayoutGrid, label: 'Templates' },
            { icon: UploadCloud, label: 'Import Plan' },
            { icon: BookOpen, label: 'Intelligence', onClick: () => setTab('explore') },
          ].map((item, i) => (
            <button 
              key={i} 
              onClick={item.onClick}
              className={`flex flex-col items-start p-6 rounded-sm border transition-all active:scale-95 ${item.active ? 'bg-brand-accent text-brand-bg border-brand-accent' : 'bg-brand-surface text-brand-accent border-brand-border hover:border-brand-accent'}`}
            >
              <item.icon size={24} className="mb-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
        <h3 className="text-sm font-bold text-brand-text-main uppercase tracking-[0.2em] mb-6">Recent Records</h3>
        <div className="bg-brand-surface rounded-sm border border-brand-border overflow-hidden">
          {[
            { icon: Edit3, label: 'Acquisition: Villa No. 7', time: '2h ago', detail: 'Closed at 4.2M' },
            { icon: Save, label: 'Dividend Payout', time: '5h ago', detail: 'Distributed to 12 partners' },
            { icon: Share2, label: 'Appraisal Update', time: 'Yesterday', detail: 'London Sector' },
          ].map((act, i) => (
            <div key={i} className="flex items-center gap-5 p-5 border-b border-brand-border last:border-0 hover:bg-white/5 transition-colors">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
              <div className="flex-1">
                <p className="text-sm font-bold text-brand-text-main">{act.label}</p>
                <p className="text-[10px] text-brand-text-dim uppercase tracking-wider mt-1">{act.time} • {act.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-[10px] text-brand-accent underline uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
          View all activity logs
        </div>
      </div>
    </div>
  );
};

const ProfileView = ({ setTab, user }: { setTab: (t: Tab) => void; user: FirebaseUser | null }) => {
  return (
    <div className="pt-20 pb-24 px-6 max-w-lg mx-auto">
      <div className="flex flex-col items-center space-y-6 mb-12">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border border-brand-accent/50 p-1 shadow-2xl bg-brand-surface">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-brand-accent">
                <User size={48} />
              </div>
            )}
          </div>
          <button className="absolute bottom-1 right-1 bg-brand-accent p-2 rounded-full text-brand-bg shadow-lg">
            <Edit3 size={14} />
          </button>
        </div>
        <div className="text-center">
          <h2 className="text-4xl font-serif text-brand-text-main italic tracking-tight">{user?.displayName || 'Unknown Architect'}</h2>
          <p className="text-brand-text-dim text-xs uppercase tracking-widest mt-2">{user?.email}</p>
        </div>
        <button className="px-10 py-3 border border-brand-accent rounded-sm text-[10px] font-bold text-brand-accent uppercase tracking-widest hover:bg-brand-accent hover:text-brand-bg transition-all">
          Edit Professional Profile
        </button>
      </div>
      {/* ... the rest of stats and buttons */}

      <div className="grid grid-cols-3 gap-0 bg-brand-surface rounded-sm border border-brand-border shadow-sm mb-10 overflow-hidden">
        {[
          { label: 'Projects', val: '12' },
          { label: 'Designs', val: '34' },
          { label: 'Saved', val: '8' },
        ].map((s, i) => (
          <div key={i} className={`py-6 text-center ${i !== 2 ? 'border-r border-brand-border' : ''}`}>
            <p className="text-3xl font-serif text-brand-accent italic tracking-tighter">{s.val}</p>
            <p className="text-[9px] font-bold text-brand-text-dim uppercase tracking-widest mt-2">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-brand-surface rounded-sm border border-brand-border overflow-hidden shadow-sm mb-10">
        <button className="w-full flex items-center justify-between p-5 border-b border-brand-border hover:bg-white/5 group">
          <div className="flex items-center gap-4">
            <User size={18} className="text-brand-text-dim" />
            <span className="text-sm font-bold text-brand-text-main uppercase tracking-widest">Personal Assets</span>
          </div>
          <ChevronRight size={16} className="text-brand-text-dim group-hover:translate-x-1" />
        </button>
        <button onClick={() => setTab('settings')} className="w-full flex items-center justify-between p-5 border-b border-brand-border hover:bg-white/5 group">
          <div className="flex items-center gap-4">
            <Settings size={18} className="text-brand-text-dim" />
            <span className="text-sm font-bold text-brand-text-main uppercase tracking-widest">Registry Settings</span>
          </div>
          <ChevronRight size={16} className="text-brand-text-dim group-hover:translate-x-1" />
        </button>
        <button className="w-full flex items-center justify-between p-5 hover:bg-white/5 group">
          <div className="flex items-center gap-4">
            <FolderOpen size={18} className="text-brand-text-dim" />
            <span className="text-sm font-bold text-brand-text-main uppercase tracking-widest">Asset Management</span>
          </div>
          <ChevronRight size={16} className="text-brand-text-dim group-hover:translate-x-1" />
        </button>
      </div>

      <div className="flex items-center justify-between mb-6 px-1">
        <h3 className="text-xs font-bold text-brand-text-main uppercase tracking-[0.2em]">Featured Works</h3>
        <button className="text-[10px] font-bold text-brand-accent uppercase tracking-widest hover:underline">Catalogue</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[
          { title: 'The Obsidian Villa', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&h=300&fit=crop' },
          { title: 'Golden Hour Loft', img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=300&fit=crop' },
        ].map((d, i) => (
          <div key={i} className="bg-brand-surface rounded-sm overflow-hidden border border-brand-border shadow-sm group cursor-pointer active:scale-95 transition-transform">
            <div className="aspect-square overflow-hidden relative filter brightness-75 hover:brightness-100 transition-all duration-500">
              <img src={d.img} alt={d.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="p-4">
              <p className="font-serif text-sm italic text-brand-text-main truncate">{d.title}</p>
              <p className="text-[9px] text-brand-text-dim uppercase mt-1 tracking-widest italic">Archival Record</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LoginView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return setError('Firebase missing');
    
    let targetPassword = password;
    if (email === 'admin@admin.com' && password === '1234') {
      targetPassword = 'password123';
    }

    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, targetPassword);
        await dataService.createUserProfile({ 
          uid: result.user.uid, 
          email: result.user.email!, 
          displayName: email.split('@')[0] 
        });
      } else {
        try {
          await signInWithEmailAndPassword(auth, email, targetPassword);
        } catch (signInErr: any) {
          const isUserNotFound = signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential';
          if (isUserNotFound && email === 'admin@admin.com') {
            const result = await createUserWithEmailAndPassword(auth, email, targetPassword);
            await dataService.createUserProfile({ 
              uid: result.user.uid, 
              email: result.user.email!, 
              displayName: 'Admin' 
            });
          } else throw signInErr;
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = 'Authentication failed';
      if (err.code === 'auth/weak-password') msg = 'Password too weak';
      if (err.code === 'auth/invalid-email') msg = 'Invalid email';
      if (err.code === 'auth/wrong-password') msg = 'Wrong password';
      if (err.code === 'auth/user-not-found') msg = 'User not found';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      await dataService.createUserProfile({ 
        uid: result.user.uid, 
        email: result.user.email!, 
        displayName: result.user.displayName || 'User' 
      });
    } catch (err) {
      setError('Google login failed');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-brand-surface border border-brand-border p-8 rounded-lg shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-brand-accent italic mb-2">Aethel Gard</h1>
          <p className="text-brand-text-dim text-xs uppercase tracking-widest">Sign in to your estate</p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-6">
          {error && <div className="text-xs text-red-400 bg-red-400/10 p-3 border border-red-400/20 rounded text-center">{error}</div>}
          
          <div className="space-y-1">
            <label className="text-[10px] text-brand-text-dim uppercase tracking-widest font-bold block ml-1">Email</label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded py-3 px-4 text-sm text-brand-text-main focus:border-brand-accent outline-none transition-colors"
              placeholder="admin@admin.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-brand-text-dim uppercase tracking-widest font-bold block ml-1">Password</label>
            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded py-3 px-4 text-sm text-brand-text-main focus:border-brand-accent outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-brand-accent text-brand-bg py-3 rounded font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <div className="h-px bg-brand-border flex-1" />
          <span className="text-[10px] text-brand-text-dim uppercase tracking-widest">OR</span>
          <div className="h-px bg-brand-border flex-1" />
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-white text-black py-3 rounded font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/04/google.svg" className="w-4 h-4 ml-[-8px]" />
          Continue with Google
        </button>

        <div className="mt-8 text-center">
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-[10px] text-brand-accent uppercase tracking-widest font-bold hover:underline">
            {isSignUp ? 'Have an account? Login' : 'Need an account? Register'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Model3DItem = ({ url, format }: { url: string; format: 'gltf' | 'obj' }) => {
  if (format === 'obj') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = useLoader(OBJLoader, url) as any;
    return <primitive object={obj} scale={0.5} />;
  } else if (format === 'gltf') {
    const { scene } = useGLTF(url);
    return <primitive object={scene} scale={0.5} />;
  }
  return null;
};

const DesignView = () => {
  const [zoom, setZoom] = useState(100);
  const [saving, setSaving] = useState(false);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [selectedTool, setSelectedTool] = useState('selection');
  const [canvasItems, setCanvasItems] = useState<{ id: number; img?: string; name: string; x: number; y: number; type?: '2d' | '3d'; url?: string; format?: 'gltf' | 'obj' }[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name;
    const url = URL.createObjectURL(file);
    let format: 'gltf' | 'obj' | null = null;
    
    if (name.toLowerCase().endsWith('.obj')) {
      format = 'obj';
    } else if (name.toLowerCase().endsWith('.glb') || name.toLowerCase().endsWith('.gltf')) {
      format = 'gltf';
    }

    if (format) {
      setCanvasItems([...canvasItems, {
        id: Date.now(),
        name,
        img: '',
        x: 100,
        y: 100,
        type: '3d',
        url,
        format
      }]);
    } else {
      alert("Unsupported file format. Please upload .obj, .gltf, or .glb");
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await dataService.createProject({
        title: projectName,
        status: 'Draft',
        img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&fit=crop',
        data: { zoom, canvasItems }
      });
      alert('บันทึกโปรเจกต์เรียบร้อยแล้ว!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const addItem = (item: { name: string; img: string }) => {
    setCanvasItems([...canvasItems, { 
      ...item, 
      id: Date.now(), 
      x: Math.random() * 200 + 50, 
      y: Math.random() * 200 + 50,
      type: '2d'
    }]);
  };

  const removeItem = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCanvasItems(canvasItems.filter(item => item.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  const clearCanvas = () => {
    if (confirm('คุณต้องการล้างข้อมูลทั้งหมดในพื้นที่ออกแบบใช่หรือไม่?')) {
      setCanvasItems([]);
      setSelectedItemId(null);
    }
  };

  const tools = [
    { id: 'selection', label: 'เลือก', icon: Compass },
    { id: 'wall', label: 'ผนัง', icon: Edit3 },
    { id: 'door', label: 'ประตู', icon: LogOut },
    { id: 'window', label: 'หน้าต่าง', icon: LayoutGrid },
    { id: 'room', label: 'พื้นที่', icon: PlusCircle },
  ];

  const categories = [
    { id: 'living', label: 'ห้องนั่งเล่น', count: 124 },
    { id: 'kitchen', label: 'ห้องครัว', count: 86 },
    { id: 'bedroom', label: 'ห้องนอน', count: 52 },
    { id: 'outdoor', label: 'ภายนอก', count: 31 },
  ];

  return (
    <div className="pt-16 pb-20 h-screen flex flex-col md:flex-row overflow-hidden bg-brand-bg">
      {/* Left Sidebar - Tools */}
      <aside className="w-full md:w-20 bg-brand-surface border-r border-brand-border flex md:flex-col items-center py-4 px-2 md:px-0 gap-4 overflow-x-auto md:overflow-y-auto no-scrollbar order-2 md:order-1">
        {tools.map((tool) => (
          <button 
            key={tool.id}
            onClick={() => setSelectedTool(tool.id)}
            className={`flex flex-col items-center justify-center min-w-[64px] md:w-full py-3 transition-colors group ${
              selectedTool === tool.id ? 'bg-brand-accent/20 border-l-2 border-brand-accent' : 'hover:bg-white/5 border-l-2 border-transparent'
            }`}
          >
            <tool.icon size={20} className={`${selectedTool === tool.id ? 'text-brand-accent' : 'text-brand-text-dim group-hover:text-brand-accent'} mb-1 transition-colors`} />
            <span className={`text-[8px] font-bold uppercase tracking-widest ${selectedTool === tool.id ? 'text-brand-accent' : 'text-brand-text-dim'}`}>{tool.label}</span>
          </button>
        ))}
        <div className="hidden md:block flex-1" />
        <button className="hidden md:flex flex-col items-center justify-center w-full py-4 border-t border-brand-border text-brand-text-dim hover:text-brand-accent transition-colors">
          <Ruler size={20} />
        </button>
      </aside>

      {/* Main Canvas Area */}
      <main 
        className="flex-1 relative overflow-auto bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:20px_20px] order-1 md:order-2"
        onClick={() => setSelectedItemId(null)}
      >
        {/* Canvas Toolbar */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 pointer-events-none">
          <div className="flex gap-2 pointer-events-auto">
            <button 
              onClick={() => setViewMode('2d')}
              className={`px-4 py-2 border rounded-sm text-[10px] font-bold shadow-xl uppercase tracking-widest backdrop-blur-md transition-all ${
                viewMode === '2d' ? 'bg-brand-accent border-brand-accent text-brand-bg' : 'bg-brand-surface border-brand-border text-brand-text-main hover:bg-brand-surface/80'
              }`}
            >
              แปลน 2D
            </button>
            <button 
              onClick={() => setViewMode('3d')}
              className={`px-4 py-2 border rounded-sm text-[10px] font-bold shadow-xl uppercase tracking-widest backdrop-blur-md transition-all ${
                viewMode === '3d' ? 'bg-brand-accent border-brand-accent text-brand-bg' : 'bg-brand-surface border-brand-border text-brand-text-main hover:bg-brand-surface/80'
              }`}
            >
              มุมมอง 3D
            </button>
            <input 
              type="text" 
              value={projectName} 
              onChange={(e) => setProjectName(e.target.value)}
              className="px-4 py-2 bg-brand-surface border border-brand-border rounded-sm text-[10px] font-bold text-brand-text-main shadow-xl uppercase tracking-widest backdrop-blur-md focus:outline-none focus:border-brand-accent ml-2 pointer-events-auto"
            />
          </div>
          <div className="flex gap-2 pointer-events-auto">
            <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="p-2 bg-brand-surface border border-brand-border rounded-sm text-brand-text-dim hover:text-brand-accent transition-colors">
              <PlusCircle size={16} className="rotate-45" />
            </button>
            <div className="px-3 flex items-center bg-brand-surface border border-brand-border rounded-sm text-[10px] text-brand-text-main tabular-nums shadow-lg">
              {zoom}%
            </div>
            <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="p-2 bg-brand-surface border border-brand-border rounded-sm text-brand-text-dim hover:text-brand-accent transition-colors">
              <PlusCircle size={16} />
            </button>
          </div>
        </div>

        {/* Mock Design Content */}
        <div 
          className="w-full h-full flex items-center justify-center transition-all duration-500 ease-out"
          style={{ 
            transform: `scale(${zoom / 100}) ${viewMode === '3d' ? 'perspective(1000px) rotateX(45deg) rotateZ(-15deg)' : ''}`,
            transformStyle: 'preserve-3d'
          }}
        >
          <div className={`relative w-[300px] h-[400px] md:w-[600px] md:h-[400px] border-2 border-brand-accent/30 bg-brand-surface/40 backdrop-blur-sm shadow-2xl transition-all duration-700 ${viewMode === '3d' ? 'shadow-[0_40px_100px_rgba(0,0,0,0.8)]' : '-rotate-6'}`}>
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]" />
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between p-10 pointer-events-none">
              <div className="h-[1px] w-full bg-brand-accent/20" />
              <div className="h-[1px] w-full bg-brand-accent/20" />
              <div className="h-[1px] w-full bg-brand-accent/20" />
            </div>
            
            {/* Base structures */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1/4 left-1/4 w-32 h-48 border border-brand-accent bg-brand-accent/5 flex items-center justify-center transition-transform"
              style={{ transform: viewMode === '3d' ? 'translateZ(10px)' : '' }}
            >
              <span className="text-[10px] text-brand-accent rotate-90 font-serif italic">Living Room</span>
            </motion.div>
            
            {/* Dynamic Items */}
            {canvasItems.map(item => (
              <motion.div
                key={item.id}
                drag={viewMode === '2d'}
                dragMomentum={false}
                onDragEnd={(e, info) => {
                  setCanvasItems(prev => prev.map(i => 
                    i.id === item.id 
                      ? { ...i, x: i.x + info.offset.x, y: i.y + info.offset.y } 
                      : i
                  ));
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItemId(item.id);
                }}
                style={{ 
                  left: item.x, 
                  top: item.y,
                  transform: viewMode === '3d' ? 'translateZ(20deg)' : '' 
                }}
                className={`absolute w-12 h-12 flex flex-col items-center justify-center bg-brand-accent/10 border transition-all cursor-pointer z-20 ${
                  selectedItemId === item.id ? 'border-brand-accent scale-110 shadow-lg' : 'border-brand-accent/40 rounded-sm hover:border-brand-accent'
                }`}
              >
                {selectedItemId === item.id && (
                  <button 
                    onClick={(e) => removeItem(item.id, e)}
                    className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-30"
                  >
                    <PlusCircle size={14} className="rotate-45" />
                  </button>
                )}
                {item.type === '3d' && viewMode === '3d' && item.url && item.format ? (
                  <div className="w-full h-full pointer-events-auto" style={{ cursor: 'grab' }}>
                    <Canvas>
                      <ambientLight intensity={0.5} />
                      <directionalLight position={[10, 10, 5]} intensity={1} />
                      <Suspense fallback={null}>
                        <Model3DItem url={item.url} format={item.format} />
                      </Suspense>
                      <OrbitControls enableZoom={false} enablePan={false} />
                    </Canvas>
                  </div>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-sm overflow-hidden bg-brand-surface border border-brand-border mb-1 pointer-events-none flex items-center justify-center">
                      {item.img ? (
                        <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-brand-text-dim">3D</span>
                      )}
                    </div>
                    <span className="text-[6px] text-brand-accent uppercase font-bold text-center leading-none pointer-events-none">{item.name}</span>
                  </>
                )}
              </motion.div>
            ))}
            
            <div className={`absolute bottom-4 right-4 text-brand-accent/50 font-serif italic text-xs transition-opacity ${viewMode === '3d' ? 'opacity-0' : 'opacity-100'}`}>
              Project: Obsidian Villa No. 7
            </div>
          </div>
        </div>

        {/* Floating Actions */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-brand-accent text-brand-bg rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all disabled:opacity-50"
          >
            <Save size={14} /> {saving ? 'กำลังบันทึก...' : 'บันทึกแบบ'}
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-brand-surface border border-brand-border text-brand-text-main rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
            <Share2 size={14} /> แชร์
          </button>
        </div>
      </main>

      {/* Right Sidebar - Assets */}
      <aside className="w-full md:w-80 bg-brand-bg border-l border-brand-border flex flex-col order-3">
        <div className="p-6 border-b border-brand-border flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold text-brand-text-main uppercase tracking-[0.2em]">คลังเฟอร์นิเจอร์</h3>
            <p className="text-[8px] text-brand-text-dim uppercase tracking-[0.1em] mt-1 italic">Interior Protocol</p>
          </div>
          {canvasItems.length > 0 && (
            <button 
              onClick={clearCanvas}
              className="p-2 text-red-500 hover:bg-red-500/10 rounded-sm transition-colors active:scale-95" 
              title="Clear Canvas"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        <div className="p-4 border-b border-brand-border">
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 bg-brand-surface border border-brand-accent/50 text-brand-accent rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-brand-accent hover:text-brand-bg transition-colors"
            >
              + Import 3D Model (OBJ/GLTF)
            </button>
            <input 
              type="file" 
              accept=".obj,.glb,.gltf" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <div className="mt-0 flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <button 
                key={cat.id}
                className="whitespace-nowrap px-3 py-1.5 rounded-full border border-brand-border text-[9px] text-brand-text-dim hover:border-brand-accent hover:text-brand-accent transition-colors"
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {[
            { name: 'Sofa Obsidian', price: '$4,200', img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=150&fit=crop' },
            { name: 'Marble Table', price: '$1,850', img: 'https://images.unsplash.com/photo-1581428982868-e410dd047a90?w=200&h=150&fit=crop' },
            { name: 'Gold Sculpture', price: '$940', img: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=200&h=150&fit=crop' },
            { name: 'Modern Chandelier', price: '$3,100', img: 'https://images.unsplash.com/photo-1542728928-1413d1894ed1?w=200&h=150&fit=crop' },
          ].map((item, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="relative aspect-[4/3] rounded-sm overflow-hidden border border-brand-border bg-brand-surface filter grayscale transition-all duration-500 group-hover:grayscale-0">
                <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                <button 
                  onClick={() => addItem(item)}
                  className="absolute inset-0 bg-brand-accent/0 group-hover:bg-brand-accent/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                   <PlusCircle size={24} className="text-white drop-shadow-lg" />
                </button>
              </div>
              <div className="mt-2 flex justify-between items-center px-1">
                <span className="text-[10px] font-medium text-brand-text-main group-hover:text-brand-accent transition-colors">{item.name}</span>
                <span className="text-[9px] text-brand-text-dim tabular-nums tracking-tighter">{item.price}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};

const ExploreView = () => {
  const [tip, setTip] = useState<string>('');
  const [loadingTip, setLoadingTip] = useState(false);

  const getTip = async () => {
    setLoadingTip(true);
    const result = await geminiService.getDesignTip('modern luxury');
    setTip(result);
    setLoadingTip(false);
  };
  
  useEffect(() => {
    getTip();
  }, []);

  const trends = [
// ... rest remains same
    { title: 'ความเรียบหรูแบบนอร์ดิก', designer: 'Erik S.', img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&fit=crop' },
    { title: 'ลอฟท์อุตสาหกรรมสมัยใหม่', designer: 'Maya L.', img: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=600&fit=crop' },
    { title: 'สวนกลางแจ้งแบบเซน', designer: 'Kenji T.', img: 'https://images.unsplash.com/photo-1558603668-6570496b66f8?w=600&fit=crop' },
  ];

  return (
    <div className="pt-20 pb-24 px-6 max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <span className="text-[10px] text-brand-accent font-bold uppercase tracking-[0.4em]">Design Intelligence</span>
        <h2 className="text-5xl font-serif text-brand-text-main italic tracking-tight">ชื่นชมและค้นหาคำนิยาม</h2>
        <p className="text-xs text-brand-text-dim uppercase tracking-[0.2em] max-w-md mx-auto leading-relaxed">
          Discover the forefront of architectural innovation curated by the Aethel network.
        </p>
      </div>

      <div className="space-y-8">
        <h3 className="text-sm font-bold text-brand-text-main uppercase tracking-[0.2em] border-l-2 border-brand-accent pl-4">เทรนด์การออกแบบรายสัปดาห์</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {trends.map((t, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="group cursor-pointer"
            >
              <div className="aspect-[3/4] overflow-hidden rounded-sm border border-brand-border bg-brand-surface filter sepia-[0.3] brightness-75 group-hover:sepia-0 group-hover:brightness-100 transition-all duration-700">
                <img src={t.img} alt={t.title} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-1000" />
              </div>
              <div className="mt-4">
                <h4 className="text-lg font-serif italic text-brand-text-main">{t.title}</h4>
                <p className="text-[9px] text-brand-accent uppercase tracking-widest mt-1">โดย {t.designer}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-brand-surface border border-brand-border p-10 rounded-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl transition-all group-hover:bg-brand-accent/10" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-serif text-brand-accent italic mb-2">แรงบันดาลใจจาก AI</h3>
            <p className="text-xs text-brand-text-dim leading-relaxed max-w-sm italic">
              {tip || 'กำลังประมวลผลแรงบันดาลใจ...'}
            </p>
          </div>
          <button 
            onClick={getTip}
            disabled={loadingTip}
            className="whitespace-nowrap px-8 py-3 border border-brand-accent text-brand-accent text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-brand-bg transition-all disabled:opacity-50"
          >
            {loadingTip ? 'กำลังวิเคราะห์...' : 'ขอคำแนะนำใหม่'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---
class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', background: '#fff', minHeight: '100vh' }}>
          <h2>Something went wrong in React.</h2>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

const App = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!auth) {
      setLoadingAuth(false);
      setActiveTab('login');
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u || { 
        uid: 'guest', 
        displayName: 'Guest Architect', 
        email: 'guest@aethel.gard',
        photoURL: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop'
      } as any);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []); // Remove activeTab from dependencies to avoid re-subscribing on every tab switch

  // Automatic redirect after login
  useEffect(() => {
    if (user && user.uid !== 'guest' && activeTab === 'login') {
      setActiveTab('home');
    }
  }, [user, activeTab]);

  const handleSignOut = async () => {
    if (!auth) {
      setUser({ uid: 'guest', displayName: 'Guest Architect', email: 'guest@aethel.gard' } as any);
      return;
    }
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-brand-bg">
        <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Header title="Aethel Gard" user={user} onMenuClick={() => setIsMenuOpen(true)} />
            <HomeView setTab={setActiveTab} user={user} />
          </motion.div>
        );
      case 'projects':
        return (
          <motion.div key="projects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Header title="Project Archives" user={user} onMenuClick={() => setIsMenuOpen(true)} />
            <ProjectsView onProjectClick={(title) => {
              // Simulating opening a project
              console.log('Opening project:', title);
              setActiveTab('design');
            }} />
          </motion.div>
        );
      case 'design':
        return (
          <motion.div key="design" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Header title="Design Studio" user={user} onMenuClick={() => setIsMenuOpen(true)} />
            <DesignView />
          </motion.div>
        );
      case 'explore':
        return (
          <motion.div key="explore" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Header title="Intelligence Explore" user={user} onMenuClick={() => setIsMenuOpen(true)} />
            <ExploreView />
          </motion.div>
        );
      case 'profile':
        return (
          <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Header title="Portfolio Management" user={user} onMenuClick={() => setIsMenuOpen(true)} />
            <ProfileView setTab={setActiveTab} user={user} />
          </motion.div>
        );
      case 'settings':
        return (
          <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Header 
              title="Registry Settings" 
              user={user}
              leftAction={<button onClick={() => setActiveTab('profile')} className="p-2 -ml-2 text-brand-accent"><ChevronRight size={24} className="rotate-180" /></button>} 
            />
            <SettingsView onSignOut={handleSignOut} />
          </motion.div>
        );
      case 'login':
        return <LoginView />;
      default:
        return (
          <div className="flex items-center justify-center h-screen pt-20">
            <p className="text-brand-text-dim italic">Accessing: {activeTab}</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg">
      <main className="flex-1 overflow-y-auto">
        <div className="pb-24">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </div>
      </main>
      <BottomNav activeTab={activeTab} setTab={setActiveTab} />

      {/* Side Drawer Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 z-[70] bg-brand-surface border-r border-brand-border p-6 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-accent text-brand-bg rounded-sm flex items-center justify-center">
                    <DraftingCompass size={20} />
                  </div>
                  <h2 className="text-xl font-serif text-brand-text-main italic">Aethel Gard</h2>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-brand-text-dim hover:text-brand-accent transition-colors"
                >
                  <PlusCircle size={24} className="rotate-45" />
                </button>
              </div>

              <div className="flex-1 space-y-2">
                {[
                  { icon: LayoutGrid, label: 'Dashboard', tab: 'home' },
                  { icon: FolderOpen, label: 'Projects', tab: 'projects' },
                  { icon: Globe, label: 'Community', tab: 'explore' },
                  { icon: Settings, label: 'Settings', tab: 'settings' },
                  ...(user?.uid === 'guest' ? [{ icon: LogOut, label: 'Sign In', tab: 'login' }] : [])
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setActiveTab(item.tab as Tab);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg transition-all ${
                      activeTab === item.tab 
                        ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20' 
                        : 'text-brand-text-dim hover:bg-brand-border/30 hover:text-brand-text-main border border-transparent'
                    }`}
                  >
                    <item.icon size={20} className={item.tab === 'login' ? 'rotate-180' : ''} />
                    <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="pt-6 border-t border-brand-border space-y-4">
                {user?.uid !== 'guest' && (
                  <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-4 p-4 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors group"
                  >
                    <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">Sign Out Protocol</span>
                  </button>
                )}
                <div className="px-4 py-2">
                  <p className="text-[8px] text-brand-text-dim uppercase tracking-[0.2em] leading-relaxed">
                    Aethel Gard Management System<br />
                    v2.4.0 Secure Instance
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
