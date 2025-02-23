Component Breakdown
App.js

    Purpose: Serves as the root component, managing the overall layout and routing (if needed).
    Key Features:
        Renders the SearchBar for user input.
        Conditionally renders BattleVisualizer once a battle is selected.

jsx

import React from 'react';
import SearchBar from './components/SearchBar';
import BattleVisualizer from './components/BattleVisualizer';

function App() {
  const [battleName, setBattleName] = React.useState(null);

  const handleSearch = (name) => {
    setBattleName(name);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {!battleName ? (
        <SearchBar onSearch={handleSearch} />
      ) : (
        <BattleVisualizer battleName={battleName} />
      )}
    </div>
  );
}

export default App;

SearchBar.js

    Purpose: Allows users to input the name of a battle.
    Key Features:
        Text input field and submit button.
        Triggers the search and passes the battle name to App.js.

jsx

import React from 'react';

function SearchBar({ onSearch }) {
  const [input, setInput] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(input);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter battle name (e.g., Battle of Cannae)"
        className="p-2 rounded bg-gray-800 text-white"
      />
      <button type="submit" className="ml-2 p-2 bg-blue-600 rounded">
        Search
      </button>
    </form>
  );
}

export default SearchBar;

BattleVisualizer.js

    Purpose: Main container for displaying battle content, including historical context and the interactive map.
    Key Features:
        Fetches battle data from the backend.
        Manages state for loading, errors, and current scene.
        Renders HistoricalContext, BattleMap, NarrativePanel, etc.

jsx

import React, { useEffect, useContext } from 'react';
import { BattleContext } from '../contexts/BattleContext';
import HistoricalContext from './HistoricalContext';
import BattleMap from './BattleMap';
import NarrativePanel from './NarrativePanel';
import NavigationControls from './NavigationControls';
import ProgressIndicator from './ProgressIndicator';
import NarrationToggle from './NarrationToggle';
import api from '../services/api';

function BattleVisualizer({ battleName }) {
  const { setBattleData, setCurrentScene } = useContext(BattleContext);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [showContext, setShowContext] = React.useState(true);

  useEffect(() => {
    const fetchBattleData = async () => {
      try {
        const data = await api.getBattleData(battleName);
        setBattleData(data);
        setCurrentScene(0);
        setLoading(false);
      } catch (err) {
        setError('Battle not found');
        setLoading(false);
      }
    };
    fetchBattleData();
  }, [battleName, setBattleData, setCurrentScene]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="p-4">
      {showContext ? (
        <HistoricalContext onStart={() => setShowContext(false)} />
      ) : (
        <>
          <BattleMap />
          <NarrativePanel />
          <NavigationControls />
          <ProgressIndicator />
          <NarrationToggle />
        </>
      )}
    </div>
  );
}

export default BattleVisualizer;

HistoricalContext.js

    Purpose: Displays the historical background of the battle.
    Key Features:
        Shows context text fetched from the backend.
        Includes a "Start Battle" button to proceed to the visualization.

jsx

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

BattleMap.js

    Purpose: Renders the interactive map with troop positions and animations.
    Key Features:
        Uses Canvas or SVG to display the map.
        Animates troop movements based on the current scene.
        (Placeholder for now; will require WebGL/Canvas integration.)

jsx

import React, { useContext } from 'react';
import { BattleContext } from '../contexts/BattleContext';

function BattleMap() {
  const { battleData, currentScene } = useContext(BattleContext);
  const scene = battleData.scenes[currentScene];

  // Placeholder for map rendering logic
  return (
    <div className="w-full h-96 bg-gray-700 rounded">
      <p>Interactive Map for Scene {currentScene + 1}</p>
      {/* Implement Canvas or SVG here */}
    </div>
  );
}

export default BattleMap;

NarrativePanel.js

    Purpose: Displays the text description for the current scene.
    Key Features:
        Updates dynamically as the user navigates through scenes.

jsx

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

NavigationControls.js

    Purpose: Provides buttons to navigate between scenes.
    Key Features:
        "Next Scene" and "Previous Scene" buttons.
        Disables buttons when at the first or last scene.

jsx

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

ProgressIndicator.js

    Purpose: Shows the current scene in the context of the entire battle.
    Key Features:
        A series of dots or a slider representing each scene.
        Allows users to jump to a specific scene.

jsx

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

NarrationToggle.js

    Purpose: Allows users to enable or disable voice narration.
    Key Features:
        A toggle switch to turn narration on/off.
        (Will require integration with TTS service.)

jsx

import React, { useContext } from 'react';
import { BattleContext } from '../contexts/BattleContext';

function NarrationToggle() {
  const { isNarrationEnabled, setIsNarrationEnabled } = useContext(BattleContext);

  return (
    <div className="mt-4">
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={isNarrationEnabled}
          onChange={() => setIsNarrationEnabled(!isNarrationEnabled)}
          className="mr-2"
        />
        Enable Voice Narration
      </label>
    </div>
  );
}

export default NarrationToggle;

3. Context Management
BattleContext.js

    Purpose: Manages global state for battle data, current scene, and narration settings.
    Key Features:
        Provides battle data, current scene index, and narration toggle to child components.

jsx

import React, { createContext, useState } from 'react';

export const BattleContext = createContext();

export function BattleProvider({ children }) {
  const [battleData, setBattleData] = useState(null);
  const [currentScene, setCurrentScene] = useState(0);
  const [isNarrationEnabled, setIsNarrationEnabled] = useState(false);

  return (
    <BattleContext.Provider
      value={{
        battleData,
        setBattleData,
        currentScene,
        setCurrentScene,
        isNarrationEnabled,
        setIsNarrationEnabled,
      }}
    >
      {children}
    </BattleContext.Provider>
  );
}

    Usage: Wrap the App component in index.js with BattleProvider.

jsx

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { BattleProvider } from './contexts/BattleContext';

ReactDOM.render(
  <BattleProvider>
    <App />
  </BattleProvider>,
  document.getElementById('root')
);

4. Services
api.js

    Purpose: Handles API calls to the backend for fetching battle data.
    Key Features:
        Placeholder for fetching battle data based on the battle name.

jsx

const api = {
  getBattleData: async (battleName) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          context: 'Historical context for ' + battleName,
          scenes: [
            { description: 'Scene 1 description', mapData: {} },
            { description: 'Scene 2 description', mapData: {} },
          ],
        });
      }, 1000);
    });
  },
};

export default api;

tts.js

    Purpose: Integrates with a text-to-speech service for narration.
    Key Features:
        Placeholder for generating and playing audio for scene descriptions.

jsx

const tts = {
  playNarration: (text) => {
    // Implement TTS logic here
    console.log('Playing narration for:', text);
  },
};

export default tts;

5. Styling

    Tailwind CSS is used for a modern, responsive design.
    Configure Tailwind in tailwind.config.js and import in styles/tailwind.css.