import React, { useContext } from 'react';
import { BattleContext } from '../contexts/BattleContext';

function NavigationControls() {
  const { currentScene, setCurrentScene, battleData } = useContext(BattleContext);
  const totalScenes = battleData.scenes.length;

  return (
    <div className="flex justify-between mt-4">
      <button
        onClick={() => setCurrentScene(currentScene - 1)}
        disabled={currentScene === 0}
        className="p-2 bg-blue-600 rounded disabled:opacity-50"
      >
        Previous Scene
      </button>
      <button
        onClick={() => setCurrentScene(currentScene + 1)}
        disabled={currentScene === totalScenes - 1}
        className="p-2 bg-blue-600 rounded disabled:opacity-50"
      >
        Next Scene
      </button>
    </div>
  );
}

export default NavigationControls; 