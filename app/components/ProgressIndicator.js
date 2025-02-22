import React, { useContext } from 'react';
import { BattleContext } from '../contexts/BattleContext';

function ProgressIndicator() {
  const { battleData, currentScene, setCurrentScene } = useContext(BattleContext);
  const totalScenes = battleData.scenes.length;

  return (
    <div className="flex justify-center mt-4">
      {Array.from({ length: totalScenes }).map((_, index) => (
        <button
          key={index}
          onClick={() => setCurrentScene(index)}
          className={`w-4 h-4 mx-1 rounded-full ${
            index === currentScene ? 'bg-blue-600' : 'bg-gray-600'
          }`}
        />
      ))}
    </div>
  );
}

export default ProgressIndicator; 