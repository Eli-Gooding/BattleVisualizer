import React, { createContext, useState } from 'react';

export const BattleContext = createContext();

export function BattleProvider({ children }) {
  const [battleData, setBattleData] = useState(null);
  const [currentScene, setCurrentScene] = useState(0);
  const [isNarrationEnabled, setIsNarrationEnabled] = useState(false);

  return (
    <BattleContext.Provider
      value={{
        battleData,
        setBattleData,
        currentScene,
        setCurrentScene,
        isNarrationEnabled,
        setIsNarrationEnabled,
      }}
    >
      {children}
    </BattleContext.Provider>
  );
} 