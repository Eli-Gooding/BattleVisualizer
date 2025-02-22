import React, { useContext } from 'react';
import { BattleContext } from '../contexts/BattleContext';
import SpeechButton from './SpeechButton';

function NarrativePanel() {
  const { battleData, currentScene } = useContext(BattleContext);
  const scene = battleData.scenes[currentScene];

  return (
    <div className="p-4 bg-gray-800 rounded mt-4">
      <h3 className="text-xl font-semibold text-white mb-2">Scene {currentScene + 1}</h3>
      <p className="text-gray-300 mb-3">{scene.description}</p>
      <SpeechButton audioUrl={battleData.audio.sceneAudios[currentScene]} />
    </div>
  );
}

export default NarrativePanel; 