import React, { useContext } from 'react';
import { BattleContext } from '../contexts/BattleContext';
import SpeechButton from './SpeechButton';

function BattleVisualization() {
  const { 
    battleData, 
    currentScene,
    isLoading,
    error 
  } = useContext(BattleContext);

  if (isLoading) {
    return <div className="text-center py-8">Loading battle data...</div>;
  }

  if (error) {
    return <div className="text-red-600 py-8">{error}</div>;
  }

  if (!battleData) {
    return <div className="text-center py-8">No battle data available</div>;
  }

  const scene = battleData.scenes[currentScene];

  return (
    <div className="p-4">
      {/* Historical Context Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2">Historical Context</h2>
        <p className="text-gray-700">{battleData.historicalContext}</p>
        <SpeechButton audioUrl={battleData.audio.contextAudio} />
      </div>

      {/* Battle Info Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2">Battle Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold">Date</h3>
            <p>{battleData.battleInfo.date}</p>
          </div>
          <div>
            <h3 className="font-semibold">Location</h3>
            <p>{battleData.battleInfo.location.name}</p>
          </div>
        </div>
      </div>

      {/* Current Scene Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2">Scene {scene.id}: {scene.title}</h2>
        <p className="text-gray-700">{scene.description}</p>
        <SpeechButton audioUrl={battleData.audio.sceneAudios[currentScene]} />
      </div>

      {/* Troops Display Section */}
      <div>
        <h2 className="text-xl font-bold mb-4">Troop Positions</h2>
        <div className="grid grid-cols-2 gap-4">
          {scene.troops.map((troop) => (
            <div 
              key={troop.id} 
              className="p-4 border rounded-lg"
              style={{ borderColor: battleData.battleInfo.armies[troop.side].color }}
            >
              <h3 className="font-semibold">{troop.name}</h3>
              <p>Type: {troop.type}</p>
              <p>Size: {troop.size}</p>
              <p>Status: {troop.status}</p>
              <p>Movement: {troop.movement.type}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BattleVisualization; 