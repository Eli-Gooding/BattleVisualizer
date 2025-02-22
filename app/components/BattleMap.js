'use client';

import React, { useEffect, useRef, useContext } from 'react';
import { BattleContext } from '../contexts/BattleContext';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet with no SSR
const BattleMapContent = dynamic(
  () => import('./BattleMapContent'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-gray-700 rounded flex items-center justify-center">
        <p className="text-white">Loading map...</p>
      </div>
    )
  }
);

function BattleMap() {
  const { battleData, currentScene } = useContext(BattleContext);

  if (!battleData) {
    return (
      <div className="w-full h-96 bg-gray-700 rounded flex items-center justify-center">
        <p className="text-white">Loading map data...</p>
      </div>
    );
  }

  return <BattleMapContent battleData={battleData} currentScene={currentScene} />;
}

export default BattleMap; 