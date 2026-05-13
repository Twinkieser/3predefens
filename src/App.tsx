/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from './lib/firebase';
import { signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { Home, Map as MapIcon, Camera, MessageSquare, User as UserIcon, Trophy, LogOut } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';

// Components (to be created)
import HomePage from './pages/Home';
import ClassifyPage from './pages/Classify';
import MapPage from './pages/Map';
import ChatPage from './pages/Chat';
import ProfilePage from './pages/Profile';
import LeaderboardPage from './pages/Leaderboard';

type Tab = 'home' | 'classify' | 'map' | 'chat' | 'profile' | 'leaderboard';

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
      case 'profile': return <ProfilePage user={user} onLogin={handleLogin} onLogout={handleLogout} />;
      case 'leaderboard': return <LeaderboardPage />;
      default: return <HomePage onNavigate={(t: Tab) => setActiveTab(t)} user={user} />;
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-accent relative overflow-hidden font-sans">
      <Toaster position="top-center" expand={true} richColors />
      
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between shrink-0 bg-accent/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">
            E
          </div>
          <span className="text-lg font-black tracking-tighter text-primary-dark italic">EcoSort <span className="text-primary not-italic font-normal">AI</span></span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-primary-light/50 px-2.5 py-1 rounded-full border border-primary-light">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-primary-dark">Astana</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
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
      <nav className="absolute bottom-6 left-6 right-6 h-16 bg-white/90 backdrop-blur-lg rounded-3xl border border-primary-light flex items-center justify-around px-2 z-50 shadow-2xl shadow-primary/10">
        <NavButton 
          active={activeTab === 'home'} 
          onClick={() => setActiveTab('home')} 
          icon={<Home size={18} />} 
          label="Home" 
        />
        <NavButton 
          active={activeTab === 'map'} 
          onClick={() => setActiveTab('map')} 
          icon={<MapIcon size={18} />} 
          label="Map" 
        />
        <div className="relative -top-6">
          <button
            onClick={() => setActiveTab('classify')}
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95",
              "bg-primary text-white shadow-primary/30"
            )}
          >
            <Camera size={32} />
          </button>
        </div>
        <NavButton 
          active={activeTab === 'chat'} 
          onClick={() => setActiveTab('chat')} 
          icon={<MessageSquare size={18} />} 
          label="Bot" 
        />
        <NavButton 
          active={activeTab === 'profile'} 
          onClick={() => setActiveTab('profile')} 
          icon={<UserIcon size={18} />} 
          label="Me" 
        />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
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
