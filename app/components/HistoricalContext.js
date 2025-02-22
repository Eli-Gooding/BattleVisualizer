import React, { useContext } from 'react';
import { BattleContext } from '../contexts/BattleContext';

function HistoricalContext({ onStart }) {
  const { battleData } = useContext(BattleContext);

  return (
    <div className="p-8 bg-gray-800 rounded max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">Historical Context</h2>
      <div className="prose prose-invert">
        <p className="text-lg leading-relaxed mb-6">{battleData.historicalContext}</p>
      </div>
      <button 
        onClick={onStart} 
        className="mt-6 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
      >
        Start Battle Visualization
      </button>
    </div>
  );
}

export default HistoricalContext; 