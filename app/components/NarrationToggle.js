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