import React, { useState } from 'react';

function Flashcard({ english, cantonese, jyutping, proficiency }) {
  // `showCantonese` controls which side of the card is visible.
  const [showCantonese, setShowCantonese] = useState(false);

  // `flipCard` toggles the `showCantonese` state.
  const flipCard = () => {
    setShowCantonese(!showCantonese);
  };

  return (
    <div
      onClick={flipCard} // Card flips when clicked
      className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm h-64 flex flex-col items-center justify-center cursor-pointer transform hover:scale-105 transition-transform duration-200 relative overflow-hidden"
    >
      {/* Displays the proficiency level at the top right corner */}
      <div className="absolute top-4 right-4 text-gray-400 text-sm">
        Level: {proficiency}
      </div>
      {showCantonese ? (
        // Render Cantonese side if `showCantonese` is true
        <div className="text-center">
          <p className="text-4xl font-bold text-gray-800 mb-2">{cantonese}</p>
          <p className="text-xl text-gray-600 font-mono">{jyutping}</p>
        </div>
      ) : (
        // Render English side if `showCantonese` is false
        <div className="text-center">
          <p className="text-3xl font-semibold text-gray-700">{english}</p>
        </div>
      )}
    </div>
  );
}

export default Flashcard;