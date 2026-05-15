/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Trophy, Medal, ChevronUp, Star } from 'lucide-react';
import { cn } from '../lib/utils';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaders();
  }, []);

  const loadLeaders = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        where('points', '>', 0),
        orderBy('points', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      setLeaders(snapshot.docs.map((d, index) => ({
        ...d.data(),
        rank: index + 1
      })));
    } catch (error) {
      console.error(error);
      // Fallback/Mock data if fetch fails
      setLeaders([
        { rank: 1, displayName: 'Arman T.', points: 1240, photoURL: '' },
        { rank: 2, displayName: 'Aruzhan K.', points: 1105, photoURL: '' },
        { rank: 3, displayName: 'Sultana B.', points: 980, photoURL: '' },
        { rank: 4, displayName: 'Daniyar M.', points: 850, photoURL: '' },
        { rank: 5, displayName: 'Yersultan O.', points: 720, photoURL: '' },
      ]);
      handleFirestoreError(error, OperationType.LIST, 'users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-accent flex flex-col font-sans">
      {/* Top Header Bento */}
      <div className="bg-primary-dark p-8 rounded-b-[3rem] text-white flex flex-col items-center space-y-12 shadow-2xl pt-16 relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full translate-x-1/4 translate-y-1/4 blur-3xl" />

        <div className="flex flex-col items-center space-y-2 z-10">
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Global Rankings</p>
           <h1 className="text-3xl font-black italic tracking-tighter">Hall of Green</h1>
        </div>

        <div className="flex items-end justify-center space-x-4 w-full z-10">
           {/* Rank 2 */}
           {leaders[1] && (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="flex flex-col items-center space-y-3"
             >
                <div className="relative">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 border-2 border-slate-300/30 overflow-hidden shadow-lg backdrop-blur-md">
                    {leaders[1].photoURL ? <img src={leaders[1].photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-white/20 text-xl">{leaders[1].displayName[0]}</div>}
                  </div>
                  <div className="absolute -bottom-2 translate-y-1/4 left-1/2 -translate-x-1/2 bg-slate-400 text-primary-dark text-[9px] font-black w-6 h-6 rounded-lg flex items-center justify-center border-4 border-primary-dark shadow-lg">2</div>
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 w-16 truncate text-center">{leaders[1].displayName.split(' ')[0]}</p>
                <div className="h-20 w-12 bg-white/5 rounded-t-[1.5rem] border-x border-t border-white/5 flex items-end justify-center pb-3">
                  <p className="text-[10px] font-black tracking-tighter">{leaders[1].points}</p>
                </div>
             </motion.div>
           )}

           {/* Rank 1 */}
           {leaders[0] && (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex flex-col items-center space-y-4 -mb-4"
             >
                <div className="relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                    <Medal size={28} className="text-amber-400 animate-float" />
                  </div>
                  <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-amber-500/20 to-amber-200/20 border-4 border-amber-400 overflow-hidden shadow-2xl backdrop-blur-xl">
                    {leaders[0].photoURL ? <img src={leaders[0].photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-amber-400/30 text-3xl">{leaders[0].displayName[0]}</div>}
                  </div>
                  <div className="absolute -bottom-3 translate-y-1/2 left-1/2 -translate-x-1/2 bg-amber-400 text-primary-dark text-xs font-black w-8 h-8 rounded-xl flex items-center justify-center border-4 border-primary-dark shadow-2xl">1</div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-200 w-20 truncate text-center">{leaders[0].displayName.split(' ')[0]}</p>
                <div className="h-32 w-16 bg-white/10 rounded-t-[2rem] border-x border-t border-white/10 flex items-end justify-center pb-6 shadow-2xl">
                   <p className="text-xs font-black">{leaders[0].points}</p>
                </div>
             </motion.div>
           )}

           {/* Rank 3 */}
           {leaders[2] && (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="flex flex-col items-center space-y-3"
             >
                <div className="relative">
                  <div className="w-16 h-16 rounded-[1.2rem] bg-white/10 border-2 border-amber-800/30 overflow-hidden shadow-lg backdrop-blur-md">
                    {leaders[2].photoURL ? <img src={leaders[2].photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-white/20 text-xl">{leaders[2].displayName[0]}</div>}
                  </div>
                  <div className="absolute -bottom-2 translate-y-1/4 left-1/2 -translate-x-1/2 bg-amber-800 text-white text-[9px] font-black w-6 h-6 rounded-lg flex items-center justify-center border-4 border-primary-dark shadow-lg">3</div>
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 w-16 truncate text-center">{leaders[2].displayName.split(' ')[0]}</p>
                <div className="h-16 w-12 bg-white/5 rounded-t-[1.2rem] border-x border-t border-white/5 flex items-end justify-center pb-3">
                  <p className="text-[10px] font-black tracking-tighter">{leaders[2].points}</p>
                </div>
             </motion.div>
           )}
        </div>
      </div>

      {/* List Bento */}
      <div className="flex-1 p-6 space-y-4">
         {leaders.slice(3).map((leader, i) => (
           <motion.div
             key={leader.uid || leader.rank}
             initial={{ opacity: 0, x: -10 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: i * 0.05 }}
             className="bento-card p-4 flex items-center justify-between"
           >
             <div className="flex items-center space-x-4">
                <span className="w-6 text-[10px] font-black text-primary/30 text-center tracking-tighter italic">#{leader.rank}</span>
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center font-black text-primary-dark/20 text-lg overflow-hidden relative">
                  {leader.photoURL ? (
                    <img src={leader.photoURL} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    leader.displayName[0]
                  )}
                </div>
                <div>
                   <h3 className="text-xs font-black text-primary-dark italic tracking-tight leading-none pb-1">{leader.displayName}</h3>
                   <div className="flex items-center space-x-1 text-[8px] font-black text-primary uppercase tracking-widest">
                     <Star size={8} className="fill-primary" />
                     <span>Eco Warrior</span>
                   </div>
                </div>
             </div>
             <div className="flex items-center space-x-3">
                <span className="text-xs font-black text-primary-dark italic">{leader.points.toLocaleString()}</span>
                <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <ChevronUp size={14} />
                </div>
             </div>
           </motion.div>
         ))}

         {loading && (
           <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Loading Top Recyclers</p>
           </div>
         )}
      </div>
    </div>
  );
}
