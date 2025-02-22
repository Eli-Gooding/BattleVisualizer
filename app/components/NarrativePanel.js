import React, { useContext } from 'react';
import { BattleContext } from '../contexts/BattleContext';

function NarrativePanel() {
  const { battleData, currentScene } = useContext(BattleContext);
  const scene = battleData.scenes[currentScene];

  return (
    <div className="p-4 bg-gray-800 rounded mt-4">
      <h3 className="text-xl font-semibold">Scene {currentScene + 1}</h3>
      <p>{scene.description}</p>
    </div>
  );
}

export default NarrativePanel; 