import React, { createContext, useState } from 'react';
import api from '../services/api';

export const BattleContext = createContext();

export function BattleProvider({ children }) {
  const [battleData, setBattleData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentScene, setCurrentScene] = useState(0);
  const [error, setError] = useState(null);

  const loadBattle = async (battleName) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getBattleData(battleName);
      setBattleData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading battle:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    battleData,
    setBattleData,
    isLoading,
    error,
    currentScene,
    setCurrentScene,
    loadBattle
  };

  return (
    <BattleContext.Provider value={value}>
      {children}
    </BattleContext.Provider>
  );
} 