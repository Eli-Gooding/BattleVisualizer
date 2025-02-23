'use client';

import React, { useEffect, useRef, useContext } from 'react';
import { BattleContext } from '../contexts/BattleContext';
import dynamic from 'next/dynamic';
import LoadingIndicator from './LoadingIndicator';

// Dynamically import Leaflet with no SSR
const BattleMapContent = dynamic(
  () => import('./BattleMapContent'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-gray-700 rounded flex items-center justify-center">
        <LoadingIndicator type="battle_scene" />
      </div>
    )
  }
);

function BattleMap() {
  const { battleData, currentScene } = useContext(BattleContext);

  if (!battleData) {
    return (
      <div className="w-full h-96 bg-gray-700 rounded flex items-center justify-center">
        <LoadingIndicator type="battle_scene" />
      </div>
    );
  }

  return <BattleMapContent battleData={battleData} currentScene={currentScene} />;
}

export default BattleMap; 