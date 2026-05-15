import React, { useState, useEffect } from 'react';
import * as ReactJoyride from 'react-joyride';
import type { Step } from 'react-joyride';

const Joyride = (ReactJoyride as any).default || (ReactJoyride as any).Joyride || ReactJoyride;
const STATUS = (ReactJoyride as any).STATUS;

interface OnboardingTourProps {
  onComplete?: () => void;
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Only run if the user hasn't seen it yet
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      setRun(true);
    }
  }, []);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="text-left">
          <h3 className="text-lg font-black text-primary-dark mb-2">Welcome to EcoSort AI! 🌿</h3>
          <p className="text-sm text-slate-600">Let's show you how to start your recycling journey in Astana.</p>
        </div>
      ),
      placement: 'center',
    },
    {
      target: '#nav-classify',
      content: (
        <div className="text-left">
          <h3 className="text-md font-bold text-primary-dark mb-1">Waste Classification</h3>
          <p className="text-xs text-slate-600">Use your camera to identify materials and learn how to recycle them properly.</p>
        </div>
      ),
      spotlightPadding: 20,
    },
    {
      target: '#nav-map',
      content: (
        <div className="text-left">
          <h3 className="text-md font-bold text-primary-dark mb-1">Recycling Points</h3>
          <p className="text-xs text-slate-600">Find the nearest recycling bins and collection centers on our interactive map.</p>
        </div>
      ),
    },
    {
      target: '#nav-profile',
      content: (
        <div className="text-left">
          <h3 className="text-md font-bold text-primary-dark mb-1">Earn Rewards</h3>
          <p className="text-xs text-slate-600">Collect points for every scan, level up your profile, and compete on the leaderboard!</p>
        </div>
      ),
    },
  ];

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('hasSeenTour', 'true');
      if (onComplete) onComplete();
    }
  };

  const JoyrideComponent = Joyride as any;

  return (
    <JoyrideComponent
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#22c55e',
          textColor: '#0f172a',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '1.5rem',
          padding: '1.5rem',
          fontFamily: 'Inter, sans-serif',
        },
        buttonNext: {
          borderRadius: '0.75rem',
          backgroundColor: '#22c55e',
          fontWeight: 800,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
        buttonBack: {
          marginRight: '0.5rem',
          fontWeight: 700,
          fontSize: '0.75rem',
          color: '#64748b',
        },
        buttonSkip: {
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#94a3b8',
        }
      } as any}
    />
  );
}
