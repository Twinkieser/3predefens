/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, RefreshCcw, Info, Share2 } from 'lucide-react';
import { User } from 'firebase/auth';
import { classifyWaste } from '../services/ai';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, updateDoc, increment, collection } from 'firebase/firestore';
import { toast } from 'sonner';
import { WasteCategory, getLevel } from '../types';
import confetti from 'canvas-confetti';

interface ClassifyProps {
  user: User | null;
  onLogin: () => void;
}

export default function Classify({ user, onLogin }: ClassifyProps) {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        handleAnalyze(reader.result as string, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (base64: string, mimeType: string) => {
    if (!user) {
      toast.error('Please login to save your points!');
      // We still allow analysis for guests but don't save points
    }

    setAnalyzing(true);
    setResult(null);
    try {
      const pureBase64 = base64.split(',')[1];
      const analysis = await classifyWaste(pureBase64, mimeType);
      setResult(analysis);
      
      if (user && analysis.confidence >= 0.7) {
        await saveClassification(analysis, base64);
      }
      
      if (analysis.confidence >= 0.7) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#16a34a', '#dcfce7', '#ffffff']
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const saveClassification = async (analysis: any, imageUrl: string) => {
    try {
      const points = 10; // Standard points
      const scanRef = doc(collection(db, `users/${user!.uid}/scans`));
      
      await setDoc(scanRef, {
        id: scanRef.id,
        uid: user!.uid,
        imageUrl,
        category: analysis.category,
        confidence: analysis.confidence,
        instructions: analysis.instructions,
        tips: analysis.tips,
        pointsEarned: points,
        createdAt: Date.now()
      });

      // Update user points
      const userRef = doc(db, 'users', user!.uid);
      await updateDoc(userRef, {
        points: increment(points),
        lastActive: Date.now()
      });

      toast.success(`+${points} points earned!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user!.uid}/scans`);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setAnalyzing(false);
  };

  const shareResult = () => {
    if (navigator.share) {
      navigator.share({
        title: 'EcoSort AI Classification',
        text: `I just recycled a ${result.category} item and earned points! Check it out.`,
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-full bg-accent p-6 flex flex-col space-y-6 pb-24">
      <div className="text-left space-y-1 px-2">
        <h1 className="text-2xl font-black text-primary-dark italic tracking-tighter">AI Classification</h1>
        <p className="text-primary-dark/50 text-xs font-bold uppercase tracking-widest">Environment First</p>
      </div>

      {!image && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 bento-card flex flex-col items-center justify-center p-8 space-y-8"
        >
          <div className="w-24 h-24 bg-primary-light/50 border-4 border-dashed border-primary-light rounded-3xl flex items-center justify-center text-primary group-hover:rotate-6 transition-transform">
            <Camera size={48} />
          </div>
          <div className="text-center space-y-3">
            <p className="font-black text-xl text-primary-dark tracking-tight">Identify Waste</p>
            <p className="text-primary-dark/60 text-sm max-w-xs px-4 leading-relaxed font-medium">
              Upload a photo or drop an item here for instant AI classification.
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-primary text-white px-10 py-4 rounded-2xl font-black shadow-2xl shadow-primary/30 flex items-center space-x-2 active:scale-95 transition-all"
          >
            <Upload size={20} />
            <span>Select Image</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
        </motion.div>
      )}

      {image && (
        <div className="space-y-6">
          <div className="relative bento-card aspect-square border-4 border-white shadow-2xl">
            <img src={image} alt="Taken" className="w-full h-full object-cover" />
            <AnimatePresence>
              {analyzing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-primary-dark/60 backdrop-blur-md flex flex-col items-center justify-center text-white space-y-6"
                >
                  <div className="relative">
                    <Loader2 size={64} className="animate-spin text-primary-light" />
                    <Sparkles size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
                  </div>
                  <p className="font-black tracking-[0.2em] text-[10px] uppercase">Processing with Gemini AI</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bento-card p-8 space-y-8"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="label-caps">Category</span>
                    {result.confidence < 0.7 && (
                       <span className="px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded-full uppercase tracking-tighter shadow-sm">Uncertain</span>
                    )}
                  </div>
                  <h2 className="text-4xl font-black italic tracking-tighter text-primary-dark capitalize leading-none">{result.category}</h2>
                </div>
                <div className="text-right">
                  <p className="label-caps mb-1">Confidence</p>
                  <p className="text-2xl font-black text-primary tracking-tighter italic">{Math.round(result.confidence * 100)}%</p>
                </div>
              </div>

              {/* Confidence Bar */}
              <div className="w-full h-4 bg-accent rounded-full overflow-hidden p-1 border border-primary-light">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.confidence * 100}%` }}
                  className={cn(
                    "h-full rounded-full shadow-lg",
                    result.confidence > 0.7 ? "bg-primary" : "bg-amber-500"
                  )}
                />
              </div>

              <div className="space-y-6">
                 <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-primary-dark/40 border-b border-primary-light pb-2">
                       <CheckCircle2 size={16} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Recycling Guide</span>
                    </div>
                    <p className="text-sm text-primary-dark/80 font-medium leading-relaxed italic border-l-4 border-primary pl-4 py-1">
                      {result.instructions}
                    </p>
                 </div>
                 
                 <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-primary-dark/40 border-b border-primary-light pb-2">
                       <Info size={16} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Eco Insights</span>
                    </div>
                    <div className="bg-primary shadow-inner p-5 rounded-3xl text-white font-bold italic tracking-tight text-sm">
                      "{result.tips}"
                    </div>
                 </div>
              </div>

              <div className="flex space-x-4">
                 <button
                   onClick={reset}
                   className="flex-1 bg-accent/50 text-primary-dark py-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 border border-primary-light hover:bg-accent transition-all"
                 >
                   <RefreshCcw size={18} />
                   <span>New Scan</span>
                 </button>
                 <button
                   onClick={shareResult}
                   className="w-16 bento-card flex items-center justify-center text-primary active:bg-primary active:text-white transition-all shadow-md active:shadow-none"
                 >
                   <Share2 size={20} />
                 </button>
              </div>
            </motion.div>
          )}

          {!result && !analyzing && (
            <button
               onClick={reset}
               className="w-full text-primary-dark/30 py-4 font-black text-[10px] uppercase tracking-widest"
            >
               Cancel & Reset
            </button>
          )}
        </div>
      )}

      {/* Guest Login Hint */}
      {!user && (
        <div className="mt-auto pt-6 text-center">
           <button
             onClick={onLogin}
             className="text-primary text-sm font-bold underline"
           >
             Log in to save history & earn levels
           </button>
        </div>
      )}
    </div>
  );
}

import { cn } from '../lib/utils';
