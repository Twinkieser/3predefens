/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, collection, query, orderBy, limit, getDocs, setDoc, updateDoc, increment, where, serverTimestamp, Timestamp } from 'firebase/firestore';
import { UserProfile, ScanRecord, getLevel, getNextLevel } from '../types';
import { generateAvatar } from '../services/ai';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Settings, LogOut, Award, Clock, History, Search, ChevronRight, Recycle, Loader2, TrendingUp, User as UserIcon, RefreshCw, Sparkles, Camera, X } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';

interface ProfileProps {
  user: FirebaseUser | null;
  onLogin: () => void;
  onLogout: () => void;
  onNavigate: (tab: any) => void;
}

export default function Profile({ user, onLogin, onLogout, onNavigate }: ProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingName, setEditingName] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadScans();
      setEditingName(user.displayName || '');
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleUpdateDisplayName = async () => {
    if (!user || !editingName.trim()) return;
    const toastId = toast.loading('Updating name...');
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: editingName.trim()
      });
      setProfile(prev => prev ? { ...prev, displayName: editingName.trim() } : null);
      toast.success('Display name updated!', { id: toastId });
      setIsSettingsOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      toast.error('Failed to update name', { id: toastId });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 1024 * 1024) {
      toast.error('Image is too large (max 1MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const toastId = toast.loading('Uploading picture...');
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          photoURL: base64
        });
        setProfile(prev => prev ? { ...prev, photoURL: base64 } : null);
        toast.success('Profile picture updated!', { id: toastId });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        toast.error('Failed to update picture', { id: toastId });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateAvatar = async (name: string) => {
    if (generatingAvatar || !user) return;
    setGeneratingAvatar(true);
    const toastId = toast.loading('Creating your unique AI avatar...');
    try {
      const avatarUrl = await generateAvatar(name);
      if (avatarUrl) {
        await updateDoc(doc(db, 'users', user.uid), {
          photoURL: avatarUrl
        });
        setProfile(prev => prev ? { ...prev, photoURL: avatarUrl } : null);
        toast.success('Your unique avatar is ready!', { id: toastId });
      } else {
        toast.error('Failed to create avatar. Please try again.', { id: toastId });
      }
    } catch (error) {
      console.error('Avatar generation error:', error);
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      toast.error('Failed to update profile with new avatar.', { id: toastId });
    } finally {
      setGeneratingAvatar(false);
    }
  };

  const loadProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user!.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        
        // Auto-generate if missing
        if (!data.photoURL && !user?.photoURL) {
          handleGenerateAvatar(data.displayName || user?.displayName || 'Eco Explorer');
        }
        
        // Streak Logic
        const lastActiveDate = (data.lastActive as any) instanceof Timestamp 
          ? (data.lastActive as any).toDate() 
          : new Date(data.lastActive);
        
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Increment streak
          const updatedProfile = {
            ...data,
            streak: data.streak + 1,
            points: data.points + 5, // Daily bonus
            lastActive: Date.now() // For local state
          };
          try {
            await updateDoc(doc(db, 'users', user!.uid), {
              streak: increment(1),
              points: increment(5),
              lastActive: serverTimestamp()
            });
            setProfile(updatedProfile);
            toast.success('Daily streak! +5 points');
          } catch (writeError) {
            handleFirestoreError(writeError, OperationType.WRITE, `users/${user!.uid}`);
            setProfile(data); // Fallback to existing data
          }
        } else if (diffDays > 1) {
          // Reset streak
          try {
            await updateDoc(doc(db, 'users', user!.uid), {
              streak: 1,
              lastActive: serverTimestamp()
            });
            setProfile({ ...data, streak: 1, lastActive: Date.now() });
          } catch (writeError) {
            handleFirestoreError(writeError, OperationType.WRITE, `users/${user!.uid}`);
            setProfile(data);
          }
        } else {
          setProfile(data);
        }
      } else {
        // Init profile
        const newProfile: any = {
          uid: user!.uid,
          email: user!.email || '',
          displayName: user!.displayName || 'Eco User',
          photoURL: user!.photoURL || '',
          points: 50, // Welcome bonus
          level: 'Beginner',
          badges: ['First Step'],
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
          streak: 1
        };
        try {
          await setDoc(doc(db, 'users', user!.uid), newProfile);
          setProfile({ ...newProfile, createdAt: Date.now(), lastActive: Date.now() });
          toast.success('Welcome! +50 points bonus earned.');
          
          // Auto-generate if missing
          if (!newProfile.photoURL && !user?.photoURL) {
            handleGenerateAvatar(newProfile.displayName);
          }
        } catch (writeError) {
          handleFirestoreError(writeError, OperationType.WRITE, `users/${user!.uid}`);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${user!.uid}`);
    }
  };

  const loadScans = async () => {
    try {
      const scansQuery = query(
        collection(db, `users/${user!.uid}/scans`),
        where('uid', '==', user!.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const snapshot = await getDocs(scansQuery);
      setScans(snapshot.docs.map(d => d.data() as ScanRecord));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${user!.uid}/scans`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="h-full bg-accent flex flex-col items-center justify-center p-8 space-y-10 text-center">
        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-primary shadow-xl animate-float">
          <Recycle size={48} />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-black text-primary-dark tracking-tighter italic">Eco Profile</h1>
          <p className="text-primary-dark/60 text-sm font-medium leading-relaxed max-w-[240px]">Join EcoSort AI to track your impact and compete with others.</p>
        </div>
        <button
          onClick={onLogin}
          className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-2xl shadow-primary/30 active:scale-95 transition-all"
        >
          Login with Google
        </button>
      </div>
    );
  }

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-accent">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  const nextLevel = profile ? getNextLevel(profile.points) : null;
  const progress = profile && nextLevel 
    ? ((profile.points - 100) / (nextLevel.minPoints - 100)) * 100 
    : 100;

  const filteredScans = scans.filter(s => s.category.includes(search.toLowerCase()));

  return (
    <div className="bg-accent min-h-full p-6 space-y-6 font-sans">
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-primary-dark italic tracking-tighter">My Progress</h1>
          <p className="label-caps font-black uppercase text-primary/40">Sustainability Journey</p>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="w-10 h-10 bg-white rounded-2xl border border-primary-light flex items-center justify-center text-primary-dark shadow-sm hover:bg-primary-light transition-colors"
        >
          <Settings size={18} />
        </button>
      </div>

      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-primary-dark/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-primary-dark italic tracking-tighter">Settings</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="text-primary-dark/20 hover:text-primary-dark">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary-dark/40 px-1">Display Name</label>
                  <input 
                    type="text" 
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="w-full bg-accent border border-primary-light rounded-2xl px-4 py-3 text-sm font-bold text-primary-dark outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Your display name"
                  />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-primary-dark/40 px-1">Your ID</label>
                   <div className="w-full bg-accent/50 border border-dashed border-primary-light rounded-2xl px-4 py-3 text-[10px] font-mono text-primary-dark/40 truncate">
                     {user?.uid}
                   </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <button 
                  onClick={handleUpdateDisplayName}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all"
                >
                  Save Changes
                </button>
                <button 
                  onClick={onLogout}
                  className="w-full bg-red-50 text-red-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Avatar Section */}
      <div className="flex flex-col items-center py-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative group"
        >
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-primary to-primary-light shadow-2xl shadow-primary/20">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white relative">
              {generatingAvatar && (
                <div className="absolute inset-0 z-20 bg-primary/20 backdrop-blur-sm flex items-center justify-center">
                  <Sparkles size={24} className="text-primary animate-pulse" />
                </div>
              )}
              {profile?.photoURL || user?.photoURL ? (
                <img 
                  src={profile?.photoURL || user?.photoURL || ''} 
                  alt={profile?.displayName || 'User'} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserIcon size={40} className="text-primary-dark/20" />
              )}
            </div>
          </div>
          <div className="absolute -bottom-1 -left-1 w-8 h-8 bg-primary rounded-xl border-4 border-white flex items-center justify-center text-white shadow-lg">
            <Award size={14} />
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-dark rounded-xl border-4 border-white flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-all"
            title="Upload Profile Picture"
          >
            <Camera size={14} />
          </button>
          {!user?.photoURL && (
            <button 
              disabled={generatingAvatar}
              onClick={() => handleGenerateAvatar(profile?.displayName || user?.displayName || 'Eco Explorer')}
              className="absolute -top-1 -right-1 w-8 h-8 bg-black/80 backdrop-blur-md rounded-xl border-4 border-white flex items-center justify-center text-white shadow-lg hover:bg-black transition-colors disabled:opacity-50"
              title={profile?.photoURL ? "Regenerate AI Avatar" : "Generate AI Avatar"}
            >
              {generatingAvatar ? <Loader2 size={12} className="animate-spin text-primary" /> : profile?.photoURL ? <RefreshCw size={12} /> : <Sparkles size={12} />}
            </button>
          )}
        </motion.div>
        <div className="mt-4 text-center">
          <h2 className="text-xl font-black text-primary-dark tracking-tight">{profile?.displayName || user?.displayName || 'Eco Explorer'}</h2>
          <p className="text-[10px] font-bold text-primary-dark/40 uppercase tracking-[0.2em]">{profile?.email || user?.email}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Rank & Stats Bento */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             className="bento-card p-6 flex flex-col justify-between"
          >
             <div className="label-caps mb-2">Current Rank</div>
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                   <Award size={18} />
                </div>
                <span className="text-lg font-black text-primary-dark italic">{profile?.level}</span>
             </div>
             <div className="mt-4 w-full h-1 bg-accent rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
             </div>
          </motion.div>

          <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             className="bento-card bg-primary-dark p-6 flex flex-col justify-between text-white"
          >
             <div className="text-[9px] font-bold uppercase tracking-widest text-black mb-2">Streak</div>
             <div className="flex items-end gap-1">
                <span className="text-3xl font-black text-black">{profile?.streak || 0}</span>
                <span className="text-xs font-bold text-black mb-1 italic">Days</span>
             </div>
             <div className="mt-4 flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={cn("flex-1 h-1 rounded-full", i <= (profile?.streak || 0) ? "bg-primary" : "bg-white/10")} />
                ))}
             </div>
          </motion.div>
        </div>

        {/* Points Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-card p-8 flex items-center justify-between relative overflow-hidden"
        >
          <div className="relative z-10">
             <p className="label-caps mb-1">Total Points</p>
             <h3 className="text-5xl font-black text-primary-dark tracking-tighter">
               {profile?.points || 0}
             </h3>
          </div>
          <div className="relative z-10 text-right">
             <p className="label-caps mb-1">Impact</p>
             <p className="text-sm font-black text-primary italic">~{Math.round((profile?.points || 0) * 0.2)}kg CO₂ saved</p>
          </div>
          {/* Decal */}
          <div className="absolute -bottom-10 -right-10 opacity-5 rotate-12">
             <Recycle size={180} />
          </div>
        </motion.div>

        {/* Analytics Entry */}
        <button 
          onClick={() => onNavigate('reports')}
          className="w-full bento-card p-5 flex items-center justify-between border-primary-light hover:bg-primary-light/10 transition-colors"
        >
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                 <TrendingUp size={20} />
              </div>
              <div className="text-left">
                 <h4 className="text-xs font-black text-primary-dark uppercase tracking-tight">Full Insights</h4>
                 <p className="text-[9px] text-primary-dark/40 font-bold uppercase tracking-widest">Sustainability Analytics</p>
              </div>
           </div>
           <ChevronRight size={16} className="text-primary" />
        </button>

        {/* Activity Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black text-primary-dark flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              <span>Recent History</span>
            </h2>
            <div className="relative">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Find..."
                className="bg-white border border-primary-light rounded-xl py-1.5 px-3 pl-8 text-[10px] font-bold outline-none focus:ring-2 focus:ring-primary/20 w-24 focus:w-32 transition-all"
              />
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40" />
            </div>
          </div>

          <div className="space-y-3">
            {filteredScans.length > 0 ? filteredScans.map((scan) => (
              <motion.div
                key={scan.id}
                className="bento-card p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-xl shadow-inner relative overflow-hidden">
                    <img src={scan.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-20" />
                    <span className="relative z-10">
                      {scan.category === 'plastic' ? '🧴' : 
                       scan.category === 'glass' ? '🍾' : 
                       scan.category === 'paper' ? '📰' : 
                       scan.category === 'metal' ? '🥫' : '🗑️'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-primary-dark capitalize italic tracking-tight">{scan.category}</h4>
                    <p className="text-[9px] text-primary-dark/40 font-bold uppercase tracking-widest">{formatDate(scan.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-primary">+{scan.pointsEarned} <span className="text-[9px] font-normal italic">pts</span></span>
                  <p className="text-[8px] font-bold text-primary-dark/30 uppercase tracking-tighter">{Math.round(scan.confidence * 100)}% Match</p>
                </div>
              </motion.div>
            )) : (
              <div className="bento-card p-10 text-center space-y-3">
                 <p className="text-xs text-primary-dark/30 font-medium italic">No recycling history yet.</p>
              </div>
            )}
          </div>
        </section>

        <button
          onClick={onLogout}
          className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-red-500/40 hover:text-red-500 transition-colors"
        >
          Logout session
        </button>
      </div>
    </div>
  );
}
