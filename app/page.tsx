'use client';

import React from 'react';
import { BattleProvider } from './contexts/BattleContext';
import App from './App';

export default function Home() {
  return (
    <BattleProvider>
      <App />
    </BattleProvider>
  );
} 