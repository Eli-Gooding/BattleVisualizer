import React, { useState, useEffect } from 'react';
import { FaVolumeUp, FaPause } from 'react-icons/fa';

function SpeechButton({ audioUrl }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState(null);

  useEffect(() => {
    // Initialize audio when URL is provided
    if (audioUrl && !audio) {
      const newAudio = new Audio(audioUrl);
      newAudio.onended = () => setIsPlaying(false);
      setAudio(newAudio);
    }

    // Cleanup on unmount
    return () => {
      if (audio) {
        audio.pause();
        setIsPlaying(false);
      }
    };
  }, [audioUrl]);

  const handleClick = async () => {
    try {
      if (!audio) return;

      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!audio}
      className={`flex items-center justify-center px-4 py-2 mt-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
    >
      {isPlaying ? <FaPause className="mr-2" /> : <FaVolumeUp className="mr-2" />}
      {isPlaying ? 'Stop Narration' : 'Play Narration'}
    </button>
  );
}

export default SpeechButton; 