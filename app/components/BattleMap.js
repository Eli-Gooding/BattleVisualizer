'use client';

import React, { useContext } from 'react';
import { BattleContext } from '../contexts/BattleContext';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamically import BattleMapContent without SSR
const BattleMapContent = dynamic(
  () => import('./BattleMapContent').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => null // Remove loading indicator since parent already handles loading state
  }
);

function BattleMap() {
  const { battleData, currentScene } = useContext(BattleContext);

  if (!battleData) {
    return null; // Return null since parent already handles loading state
  }

  return <BattleMapContent battleData={battleData} currentScene={currentScene} />;
}

export default BattleMap; 