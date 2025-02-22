import React, { useEffect, useContext } from 'react';
import { BattleContext } from '../contexts/BattleContext';
import HistoricalContext from './HistoricalContext';
import BattleMap from './BattleMap';
import NarrativePanel from './NarrativePanel';
import NavigationControls from './NavigationControls';
import ProgressIndicator from './ProgressIndicator';
import api from '../services/api';

function BattleVisualizer({ battleName, onReset }) {
  const { setBattleData, setCurrentScene } = useContext(BattleContext);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [showContext, setShowContext] = React.useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchBattleData = async () => {
      try {
        const data = await api.getBattleData(battleName);
        if (mounted) {
          setBattleData(data);
          setCurrentScene(0);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching battle data:', err);
        if (mounted) {
          setError(err.message || 'Failed to load battle data');
          setLoading(false);
        }
      }
    };

    fetchBattleData();

    return () => {
      mounted = false;
    };
  }, [battleName, setBattleData, setCurrentScene]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading battle data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <button
          onClick={onReset}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Return to Search
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      {showContext ? (
        <HistoricalContext onStart={() => setShowContext(false)} />
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={onReset}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
            >
              New Battle
            </button>
          </div>
          <BattleMap />
          <NarrativePanel />
          <NavigationControls />
          <ProgressIndicator />
        </>
      )}
    </div>
  );
}

export default BattleVisualizer; 