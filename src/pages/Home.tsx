/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Camera, Map as MapIcon, ChevronRight, Share2, Award, Zap } from 'lucide-react';
import { User } from 'firebase/auth';

interface HomeProps {
  user: User | null;
  onNavigate: (tab: any) => void;
}

export default function Home({ user, onNavigate }: HomeProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Hero Bento (Scan Area) */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-card p-10 relative group"
        >
          <div className="absolute top-4 right-4">
             <span className="px-3 py-1 bg-primary text-white text-[9px] font-black uppercase rounded-full tracking-widest shadow-lg shadow-primary/20">Ready to Scan</span>
          </div>
          
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <Camera size={36} className="text-primary" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-primary-dark tracking-tight">
                Identify Waste
              </h1>
              <p className="text-primary-dark/60 text-xs max-w-[220px] font-medium leading-relaxed">
                Unlock instant AI classification and earn points for recycling.
              </p>
            </div>
            <button
              onClick={() => onNavigate('classify')}
              className="bg-primary text-white px-8 py-3.4 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all w-full flex items-center justify-center gap-2"
            >
              <span>Launch AI Camera</span>
              <ChevronRight size={18} />
            </button>
          </div>
          
          {/* Subtle Background Icon */}
          <div className="absolute -bottom-6 -right-6 opacity-5 pointer-events-none">
             <Zap size={140} />
          </div>
        </motion.div>
      </section>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Points Balance */}
        <motion.div 
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.1 }}
           className="bento-card p-6 flex flex-col justify-between relative"
           onClick={() => onNavigate('profile')}
        >
          <div className="absolute -right-2 -top-2 w-16 h-16 bg-accent rounded-full opacity-50" />
          <div className="relative">
            <p className="label-caps mb-1">Points</p>
            <h3 className="text-3xl font-black text-primary-dark">750</h3>
          </div>
          <div className="mt-4 pt-4 border-t border-primary-light/30">
            <p className="text-[9px] font-bold text-primary uppercase">Explorer Rank</p>
          </div>
        </motion.div>

        {/* Streak/Status */}
        <motion.div 
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.2 }}
           className="bento-card bg-primary p-6 flex flex-col justify-between text-white shadow-lg shadow-primary/20 border-none"
        >
           <div>
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-black">Streak</p>
                <Zap size={14} className="text-black fill-black" />
              </div>
              <div className="flex gap-1">
                 <div className="w-full h-1 bg-black/20 rounded-full"></div>
                 <div className="w-full h-1 bg-black/20 rounded-full"></div>
                 <div className="w-full h-1 bg-black/10 rounded-full"></div>
              </div>
           </div>
           <div className="mt-4">
              <h3 className="text-3xl font-black drop-shadow-sm text-black">3 Days</h3>
              <p className="text-[10px] text-black/60 font-black uppercase tracking-tight mt-0.5">Keep it up!</p>
           </div>
        </motion.div>
      </div>

      {/* Map Bento */}
      <section>
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="bento-card p-6 flex flex-col gap-4"
           onClick={() => onNavigate('map')}
        >
           <div className="flex justify-between items-center">
              <h4 className="font-black text-sm text-primary-dark italic">Astana Map</h4>
              <MapIcon size={16} className="text-primary" />
           </div>
           
           <div className="h-24 bg-primary-light/40 rounded-2xl relative overflow-hidden flex items-center justify-center border border-primary-light">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#16a34a 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
              <div className="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg animate-pulse" />
              <div className="absolute bottom-2 left-2 right-2 bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-sm border border-white">
                 <p className="text-[10px] font-black tracking-tight text-primary-dark truncate">EcoCenter, Turan Ave 24</p>
              </div>
           </div>
        </motion.div>
      </section>

      {/* Feed/History Bento */}
      <section className="bento-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-black text-primary-dark">Recent Activity</h2>
          <button onClick={() => onNavigate('profile')} className="text-[9px] font-black text-primary uppercase tracking-widest">History</button>
        </div>
        <div className="space-y-4">
          <ActivityItem icon="🧴" name="PET Bottle" category="Plastic" points="+10" />
          <ActivityItem icon="🗞️" name="News Paper" category="Paper" points="+10" />
        </div>
      </section>
    </div>
  );
}

function ActivityItem({ icon, name, category, points }: any) {
  return (
    <div className="flex items-center justify-between p-3 bg-accent/50 rounded-2xl border border-primary-light/20">
       <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <div>
             <p className="text-xs font-black text-primary-dark leading-none pb-0.5">{name}</p>
             <p className="text-[9px] text-primary-dark/60 font-bold uppercase">{category}</p>
          </div>
       </div>
       <span className="text-xs font-black text-primary">{points} <span className="text-[10px] font-normal italic">pts</span></span>
    </div>
  );
}

function StatCard({ icon, label, value, onClick }: any) {
  return (
    <button onClick={onClick} className="flex flex-col p-4 bg-white border border-slate-100 rounded-2xl transition-transform active:scale-95 space-y-2 text-left">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{label}</p>
        <p className="text-lg font-bold text-slate-900">{value}</p>
      </div>
    </button>
  );
}

function LocationSmallCard({ name, materials, dist }: any) {
  return (
    <div className="min-w-[140px] p-4 bg-white border border-slate-100 rounded-2xl space-y-1">
      <h3 className="font-bold text-sm truncate">{name}</h3>
      <p className="text-[10px] text-slate-400 font-medium">{materials}</p>
      <p className="text-[10px] text-primary font-bold">{dist}</p>
    </div>
  );
}
