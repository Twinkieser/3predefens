/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from './lib/firebase';
import { signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { Home, Map as MapIcon, Camera, MessageSquare, User as UserIcon, Trophy, LogOut, Zap } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';

// Components (to be created)
import HomePage from './pages/Home';
import ClassifyPage from './pages/Classify';
import MapPage from './pages/Map';
import ChatPage from './pages/Chat';
import ProfilePage from './pages/Profile';
import LeaderboardPage from './pages/Leaderboard';
import ReportsPage from './pages/Reports';
import OnboardingTour from './components/OnboardingTour';

type Tab = 'home' | 'classify' | 'map' | 'chat' | 'profile' | 'leaderboard' | 'reports';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('home');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Successfully logged in!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to log in with Google.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast.info('Logged out.');
    setActiveTab('home');
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-accent">
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-primary/20">
            E
          </div>
          <div className="text-primary-dark font-black tracking-tighter text-xl italic">
            EcoSort <span className="text-primary not-italic font-normal">AI</span>
          </div>
        </motion.div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <HomePage onNavigate={(t: Tab) => setActiveTab(t)} user={user} />;
      case 'classify': return <ClassifyPage user={user} onLogin={handleLogin} />;
      case 'map': return <MapPage />;
      case 'chat': return <ChatPage user={user} />;
      case 'profile': return <ProfilePage user={user} onLogin={handleLogin} onLogout={handleLogout} onNavigate={(t: Tab) => setActiveTab(t)} />;
      case 'leaderboard': return <LeaderboardPage />;
      case 'reports': return <ReportsPage user={user} onBack={() => setActiveTab('profile')} />;
      default: return <HomePage onNavigate={(t: Tab) => setActiveTab(t)} user={user} />;
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-accent relative font-sans">
      <Toaster position="top-center" expand={true} richColors />
      <OnboardingTour />
      
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between shrink-0 bg-accent/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">
            E
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tighter text-primary-dark italic leading-none">EcoSort <span className="text-primary not-italic font-normal">AI</span></span>
            <span className="text-[10px] font-bold text-primary-dark/40 uppercase tracking-tighter">Astana</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
              <Zap size={14} className="text-primary fill-primary" />
              <span className="text-xs font-black text-primary-dark">3 Days</span>
           </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="shrink-0 h-20 bg-white border-t border-primary-light flex items-center justify-around px-2 z-50">
        <NavButton 
          id="nav-home"
          active={activeTab === 'home'} 
          onClick={() => setActiveTab('home')} 
          icon={<Home size={18} />} 
          label="Home" 
        />
        <NavButton 
          id="nav-map"
          active={activeTab === 'map'} 
          onClick={() => setActiveTab('map')} 
          icon={<MapIcon size={18} />} 
          label="Map" 
        />
        <div className="relative -top-3">
          <button
            id="nav-classify"
            onClick={() => setActiveTab('classify')}
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95",
              "bg-primary text-white shadow-primary/30"
            )}
          >
            <Camera size={28} />
          </button>
        </div>
        <NavButton 
          id="nav-chat"
          active={activeTab === 'chat'} 
          onClick={() => setActiveTab('chat')} 
          icon={<MessageSquare size={18} />} 
          label="Bot" 
        />
        <NavButton 
          id="nav-profile"
          active={activeTab === 'profile'} 
          onClick={() => setActiveTab('profile')} 
          icon={<UserIcon size={18} />} 
          label="Me" 
        />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label, id }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; id?: string }) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center space-y-1 transition-all w-12 rounded-xl py-1",
        active ? "text-primary scale-110" : "text-slate-400 grayscale"
      )}
    >
      {icon}
      <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

import { cn } from './lib/utils';
