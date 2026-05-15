/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { ScanRecord, WasteCategory } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { motion } from 'motion/react';
import { ChevronLeft, Info, Download, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';

interface ReportsProps {
  user: User | null;
  onBack: () => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

export default function Reports({ user, onBack }: ReportsProps) {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchScans = async () => {
      try {
        const q = query(
          collection(db, `users/${user.uid}/scans`),
          where('uid', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        setScans(snapshot.docs.map(d => d.data() as ScanRecord));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/scans`);
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
  }, [user]);

  // Data processing for charts
  const categoryData = scans.reduce((acc: any[], scan) => {
    const existing = acc.find(item => item.name === scan.category);
    if (existing) {
      existing.value += 1;
      existing.points += scan.pointsEarned;
    } else {
      acc.push({ name: scan.category, value: 1, points: scan.pointsEarned });
    }
    return acc;
  }, []);

  const timeData = scans.slice(0, 10).reverse().map(s => ({
    date: new Date(s.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    points: s.pointsEarned,
  }));

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40">Generating Report</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-accent overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="px-6 py-8 space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-primary-light">
            <ChevronLeft size={20} />
          </button>
          <div className="text-right">
             <p className="label-caps">Dashboard</p>
             <h1 className="text-2xl font-black text-primary-dark italic tracking-tighter">Impact Report</h1>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Composition Pie */}
        <section className="bento-card p-6 space-y-4">
          <div className="flex items-center justify-between">
             <h2 className="text-xs font-black uppercase tracking-widest text-primary-dark">Waste Composition</h2>
             <Trash2 size={14} className="text-primary" />
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {categoryData.slice(0, 3).map((item, i) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center gap-1.5">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                   <span className="text-[8px] font-black uppercase text-primary-dark/40 truncate">{item.name}</span>
                </div>
                <p className="text-xs font-black text-primary-dark">{Math.round((item.value / scans.length) * 100)}%</p>
              </div>
            ))}
          </div>
        </section>

        {/* Activity Trend */}
        <section className="bento-card p-6 space-y-4">
           <div className="flex items-center justify-between">
             <h2 className="text-xs font-black uppercase tracking-widest text-primary-dark">Activity Trend</h2>
             <Calendar size={14} className="text-primary" />
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeData}>
                <defs>
                  <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fontWeight: 900, fill: '#064e3b', opacity: 0.3 }} 
                />
                <YAxis hide />
                <Tooltip 
                   cursor={{ stroke: '#10b981', strokeWidth: 1 }}
                   contentStyle={{ 
                     borderRadius: '16px', 
                     border: 'none', 
                     boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                     fontSize: '10px',
                     fontWeight: 'bold'
                   }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="points" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorPoints)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Eco Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bento-card p-4 space-y-1">
             <TrendingUp size={14} className="text-primary" />
             <p className="label-caps">Total Savings</p>
             <p className="text-lg font-black text-primary-dark tracking-tighter">
               {Math.round(scans.length * 0.45)} <span className="text-[10px] font-normal italic">kg CO₂</span>
             </p>
          </div>
          <div className="bento-card p-4 space-y-1">
             <Info size={14} className="text-blue-500" />
             <p className="label-caps">Accuracy</p>
             <p className="text-lg font-black text-primary-dark tracking-tighter">
               {Math.round(scans.reduce((a, b) => a + b.confidence, 0) / (scans.length || 1) * 100)}<span className="text-[10px] font-normal">%</span>
             </p>
          </div>
        </div>

        <button className="w-full py-5 bg-primary-dark text-white rounded-2xl font-black shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
          <Download size={18} />
          <span>Export Analytics (PDF)</span>
        </button>

        <p className="text-center text-[9px] font-bold text-primary-dark/20 uppercase tracking-[0.2em] pb-10">
          Generated via EcoSort Intelligence SDK
        </p>
      </div>
    </div>
  );
}
