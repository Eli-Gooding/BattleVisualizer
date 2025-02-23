import React from 'react';

function LoadingIndicator({ type, progress }) {
  const getLoadingMessage = () => {
    switch (type) {
      case 'wikipedia':
        return {
          message: 'Researching historical records...',
          details: 'Gathering information from Wikipedia'
        };
      case 'battle_scene':
        return {
          message: 'Creating battle scenes...',
          details: 'Analyzing troop movements and positions'
        };
      case 'narration':
        return {
          message: 'Generating narration...',
          details: 'Converting battle description to speech'
        };
      default:
        return {
          message: 'Loading...',
          details: 'Please wait'
        };
    }
  };

  const { message, details } = getLoadingMessage();

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-800 rounded-lg shadow-lg">
      {/* Animated dots */}
      <div className="flex space-x-2 mb-4">
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
      </div>
      
      {/* Message */}
      <h3 className="text-xl font-semibold text-white mb-2">{message}</h3>
      <p className="text-gray-400 text-sm">{details}</p>
      
      {/* Progress bar if progress is provided */}
      {progress !== undefined && (
        <div className="w-full mt-4">
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-gray-400 text-sm mt-2 text-center">{progress}% complete</p>
        </div>
      )}
    </div>
  );
}

export default LoadingIndicator; 