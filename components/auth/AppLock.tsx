'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Unlock, KeyRound, ShieldCheck, ArrowRight } from 'lucide-react';

interface AppLockProps {
  children: React.ReactNode;
}

const CORRECT_PIN = '1234';

export default function AppLock({ children }: AppLockProps) {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [pin, setPin] = useState<string>('');
  const [errorShake, setErrorShake] = useState(false);
  const [expectedPin, setExpectedPin] = useState<string>('1234');

  useEffect(() => {
    // Check sessionStorage (resets on browser refresh as requested)
    const unlocked = sessionStorage.getItem('preston_retro_unlocked');
    if (unlocked === 'true') {
      setIsUnlocked(true);
    } else {
      setIsUnlocked(false);
    }

    // Load expected PIN from localStorage first for instant access
    const savedPin = localStorage.getItem('preston_app_pin');
    if (savedPin) {
      setExpectedPin(String(savedPin).padStart(4, '0'));
    }

    // Fetch latest PIN and company profile from settings in background
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings?.app_pin) {
          const cleanPin = String(data.settings.app_pin).padStart(4, '0');
          setExpectedPin(cleanPin);
          localStorage.setItem('preston_app_pin', cleanPin);
        }
      })
      .catch(console.error);
  }, []);

  const handleDigitPress = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const verifyPin = (inputPin: string) => {
    if (inputPin === expectedPin) {
      sessionStorage.setItem('preston_retro_unlocked', 'true');
      setIsUnlocked(true);
    } else {
      setErrorShake(true);
      setTimeout(() => {
        setPin('');
        setErrorShake(false);
      }, 500);
    }
  };

  // Prevent flash of content during hydration
  if (isUnlocked === null) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Underlying app content with conditional blur */}
      <div className={`transition-all duration-300 ${!isUnlocked ? 'filter blur-md pointer-events-none select-none' : ''}`}>
        {children}
      </div>

      {/* Frosted Glass Lock Screen Overlay */}
      {!isUnlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xl animate-fade-in">
          <div
            className={`w-full max-w-sm bg-white/90 backdrop-blur-2xl border border-white/60 p-8 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col items-center text-center transition-transform duration-200 ${
              errorShake ? 'animate-shake' : ''
            }`}
          >
            {/* Pristine Retro Enterprise Seal Icon */}
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-neutral-900 shadow-md mb-4 flex items-center justify-center bg-black">
              <img
                src="/logo.jpg"
                alt="Pristine Retro Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>

            <h2 className="text-xl font-bold tracking-tight text-neutral-900">
              Pristine Retro Enterprise
            </h2>
            <p className="text-xs text-neutral-500 mt-1 mb-6">
              Enter 4-digit PIN to access Factory OS
            </p>

            {/* 4 PIN Circles */}
            <div className="flex items-center gap-4 mb-8">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    pin.length > index
                      ? 'bg-neutral-900 border-neutral-900 scale-110 shadow-sm'
                      : 'border-neutral-300 bg-transparent'
                  }`}
                />
              ))}
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[260px] mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitPress(digit)}
                  className="h-14 rounded-2xl bg-neutral-100/80 hover:bg-neutral-200/90 active:scale-95 text-lg font-semibold text-neutral-900 transition-all shadow-sm flex items-center justify-center"
                >
                  {digit}
                </button>
              ))}
              <div />
              <button
                type="button"
                onClick={() => handleDigitPress('0')}
                className="h-14 rounded-2xl bg-neutral-100/80 hover:bg-neutral-200/90 active:scale-95 text-lg font-semibold text-neutral-900 transition-all shadow-sm flex items-center justify-center"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-14 rounded-2xl bg-neutral-100/80 hover:bg-neutral-200/90 active:scale-95 text-xs font-semibold text-neutral-600 transition-all shadow-sm flex items-center justify-center"
              >
                DEL
              </button>
            </div>

            <p className="text-[11px] text-neutral-400 font-mono mt-2">
              Default factory PIN: <span className="font-bold text-neutral-700">1234</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
