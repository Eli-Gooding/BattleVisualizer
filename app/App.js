import React from 'react';
import SearchBar from './components/SearchBar';
import BattleVisualizer from './components/BattleVisualizer';

function App() {
  const [battleName, setBattleName] = React.useState(null);

  const handleSearch = (name) => {
    setBattleName(name);
  };

  const handleReset = () => {
    setBattleName(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {!battleName ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-4xl font-bold mb-8">Battle Visualizer</h1>
          <SearchBar onSearch={handleSearch} />
        </div>
      ) : (
        <BattleVisualizer battleName={battleName} onReset={handleReset} />
      )}
    </div>
  );
}

export default App; 