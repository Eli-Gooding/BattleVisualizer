import React, { useContext } from 'react';
import { BattleContext } from '../contexts/BattleContext';
import SpeechButton from './SpeechButton';

function HistoricalContext({ onStart }) {
  const { battleData } = useContext(BattleContext);

  if (!battleData) return null;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-white mb-6">{battleData.battleInfo.location.name}</h1>
      
      <div className="bg-gray-800 rounded p-4 mb-8">
        <h2 className="text-xl font-semibold text-white mb-2">Historical Context</h2>
        <p className="text-gray-300 mb-3">{battleData.historicalContext}</p>
        <SpeechButton audioUrl={battleData.audio.contextAudio} />
      </div>

      <div className="bg-gray-800 rounded p-4 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Battle Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-white mb-2">Date</h3>
            <p className="text-gray-300">{battleData.battleInfo.date}</p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">Location</h3>
            <p className="text-gray-300">{battleData.battleInfo.location.name}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onStart}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
        >
          Start Battle Visualization
        </button>
      </div>
    </div>
  );
}

export default HistoricalContext; 