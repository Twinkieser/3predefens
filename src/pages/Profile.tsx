/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, collection, query, orderBy, limit, getDocs, setDoc, updateDoc, increment } from 'firebase/firestore';
import { UserProfile, ScanRecord, getLevel, getNextLevel } from '../types';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Settings, LogOut, Award, Clock, History, Search, ChevronRight, Recycle } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';

interface ProfileProps {
  user: FirebaseUser | null;
  onLogin: () => void;
  onLogout: () => void;
}

export default function Profile({ user, onLogin, onLogout }: ProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
      loadScans();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user!.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        
        // Streak Logic
        const lastActive = new Date(data.lastActive);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Increment streak
          const updatedProfile = {
            ...data,
            streak: data.streak + 1,
            points: data.points + 5, // Daily bonus
            lastActive: Date.now()
          };
          await updateDoc(doc(db, 'users', user!.uid), {
            streak: increment(1),
            points: increment(5),
            lastActive: Date.now()
          });
          setProfile(updatedProfile);
          toast.success('Daily streak! +5 points');
        } else if (diffDays > 1) {
          // Reset streak
          await updateDoc(doc(db, 'users', user!.uid), {
            streak: 1,
            lastActive: Date.now()
          });
          setProfile({ ...data, streak: 1, lastActive: Date.now() });
        } else {
          setProfile(data);
        }
      } else {
        // Init profile
        const newProfile: UserProfile = {
          uid: user!.uid,
          email: user!.email || '',
          displayName: user!.displayName || 'Eco User',
          photoURL: user!.photoURL || '',
          points: 50, // Welcome bonus
          level: 'Beginner',
          badges: ['First Step'],
          createdAt: Date.now(),
          lastActive: Date.now(),
          streak: 1
        };
        await setDoc(doc(db, 'users', user!.uid), newProfile);
        setProfile(newProfile);
        toast.success('Welcome! +50 points bonus earned.');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${user!.uid}`);
    }
  };

  const loadScans = async () => {
    try {
      const scansQuery = query(
        collection(db, `users/${user!.uid}/scans`),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const snapshot = await getDocs(scansQuery);
      setScans(snapshot.docs.map(d => d.data() as ScanRecord));
    } catch (error) {
       console.error("Failed to load scans", error);
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
    <div className="bg-accent min-h-full p-6 space-y-6 pb-24 font-sans">
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-primary-dark italic tracking-tighter">My Progress</h1>
          <p className="label-caps font-black uppercase text-primary/40">Sustainability Journey</p>
        </div>
        <button className="w-10 h-10 bg-white rounded-2xl border border-primary-light flex items-center justify-center text-primary-dark shadow-sm">
          <Settings size={18} />
        </button>
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
             <div className="text-[9px] font-bold uppercase tracking-widest text-primary-light/40 mb-2">Streak</div>
             <div className="flex items-end gap-1">
                <span className="text-3xl font-black">{profile?.streak || 0}</span>
                <span className="text-xs font-bold text-primary mb-1 italic">Days</span>
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
