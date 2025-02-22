import React, { useContext } from 'react';
import { BattleContext } from '../contexts/BattleContext';

function HistoricalContext({ onStart }) {
  const { battleData } = useContext(BattleContext);

  return (
    <div className="p-4 bg-gray-800 rounded">
      <h2 className="text-2xl font-bold">Historical Context</h2>
      <p>{battleData.context}</p>
      <button onClick={onStart} className="mt-4 p-2 bg-green-600 rounded">
        Start Battle Visualization
      </button>
    </div>
  );
}

export default HistoricalContext; 