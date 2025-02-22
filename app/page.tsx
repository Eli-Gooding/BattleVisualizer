'use client';

import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { BattleProvider } from './contexts/BattleContext';
import App from './App';

export default function Home() {
  return (
    <BattleProvider>
      <App />
      <Analytics />
    </BattleProvider>
  );
} 