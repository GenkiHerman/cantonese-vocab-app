import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import Flashcard from './components/Flashcard';

const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx83HvV7KZd9yX3FagQ8EAKs88iGvgg4otijYr14CAyrqnNoj2SRWwgjqDImhTIiar8/exec";

function App() {
  // --- State Management ---
  // `vocabCards` stores all vocabulary items that are currently due for review.
  const [vocabCards, setVocabCards] = useState([]);
  // `currentCardIndex` tracks which card from `vocabCards` is currently displayed.
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  // `loading` indicates if data is being fetched (for showing a loading spinner).
  const [loading, setLoading] = useState(true);
  // `error` stores any error messages encountered during data fetching or updating.
  const [error, setError] = useState(null);

  // --- Data Fetching Logic (from Google Sheet) ---
  // `fetchVocabCards` is responsible for getting the latest vocabulary data from your Google Sheet.
  // `useCallback` memoizes the function, preventing unnecessary re-creations.
  const fetchVocabCards = useCallback(async () => {
    setLoading(true); // Set loading state to true before starting fetch
    setError(null);   // Clear any previous errors
    try {
      // Make a GET request to your Google Apps Script Web App URL with action 'getVocabs'.
      const response = await fetch(`${GAS_WEB_APP_URL}?action=getVocabs`);
      // Check if the network request was successful.
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Parse the JSON response from the Apps Script.
      const data = await response.json();

      // --- Filtering and Sorting Due Cards ---
      const now = new Date(); // Get current time
      const dueCards = data
        .filter(card => {
          // Convert the `NextReviewTime` from the sheet (ISO string) back to a Date object.
          const nextReview = new Date(card.NextReviewTime);
          // Only include cards whose `NextReviewTime` is in the past or current.
          return nextReview <= now;
        })
        .sort((a, b) => new Date(a.NextReviewTime) - new Date(b.NextReviewTime)); // Sort by oldest due first

      setVocabCards(dueCards); // Update the state with the filtered and sorted cards
      setCurrentCardIndex(0); // Always start with the first card in the new list
    } catch (e) {
      // Catch any errors during the fetch process.
      setError(`Failed to fetch vocabulary: ${e.message}`);
      console.error('Fetch error:', e);
    } finally {
      setLoading(false); // Set loading state to false after fetch completes (or errors)
    }
  }, []); // Empty dependency array means this function is created once.

  // --- Data Update Logic (to Google Sheet) ---
  // `updateCardState` sends updates for a specific card back to the Google Sheet.
  const updateCardState = useCallback(async (cardId, proficiencyLevel) => {
    try {
      // Calculate the `NextReviewTime`: 90 minutes from the current time.
      const nextReviewTime = new Date(new Date().getTime() + 90 * 60 * 1000); // 90 minutes in milliseconds

      // Prepare URL parameters for the POST request to Apps Script.
      const params = new URLSearchParams({
        action: 'updateVocab',
        id: cardId,
        proficiencyLevel: proficiencyLevel,
        nextReviewTime: nextReviewTime.toISOString(), // Convert Date to ISO string for transmission
      });

      // Make a GET request to your Apps Script (GAS `doGet` handles both getVocabs and updateVocab based on `action` param).
      const response = await fetch(`${GAS_WEB_APP_URL}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json(); // Get the success/error message from Apps Script
      if (!result.success) {
        throw new Error(result.message || 'Failed to update card.');
      }
      console.log(`Card ${cardId} updated successfully.`);

      // After a successful update, re-fetch all cards. This ensures the UI is up-to-date
      // and the just-updated card is removed from the "due" list, and the next due card appears.
      await fetchVocabCards();

    } catch (e) {
      setError(`Failed to update card: ${e.message}`);
      console.error('Update error:', e);
    }
  }, [fetchVocabCards]); // Dependency on `fetchVocabCards` as it's called inside.

  // --- Lifecycle Hook ---
  // `useEffect` runs `fetchVocabCards` once when the component mounts.
  useEffect(() => {
    fetchVocabCards();
  }, [fetchVocabCards]); // Dependency on `fetchVocabCards` to satisfy linter, though it's stable due to `useCallback`.

  // --- User Interaction Handlers ---
  // `handleNextCard` is called when a user clicks a "Mark" button.
  // `proficiencyIncrease` determines how the proficiency level changes (-1, 0, or +1).
  const handleNextCard = (proficiencyIncrease = 1) => {
    if (vocabCards.length === 0) return; // Do nothing if no cards are available

    const currentCard = vocabCards[currentCardIndex]; // Get the currently displayed card
    let newProficiency = currentCard.ProficiencyLevel + proficiencyIncrease;

    // Ensure proficiency stays within 1-5 range.
    if (newProficiency > 5) newProficiency = 5;
    if (newProficiency < 1) newProficiency = 1;

    // Call the function to update the card's state in the Google Sheet.
    updateCardState(currentCard.ID, newProficiency);
  };

  // --- Conditional Rendering ---
  // Display different messages based on loading, error, or no due cards.
  if (loading) return <div className="flex justify-center items-center h-screen text-xl">Loading vocabulary...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500 text-lg">Error: {error}</div>;
  if (vocabCards.length === 0) return <div className="flex justify-center items-center h-screen text-xl text-gray-600">No cards due for review! Enjoy your break. 🎉</div>;

  // Get the current card to display.
  const currentCard = vocabCards[currentCardIndex];

  // --- UI Structure ---
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Cantonese Vocab Trainer</h1>

      {/* Render the Flashcard component if a current card exists */}
      {currentCard ? (
        <Flashcard
          english={currentCard.English}
          cantonese={currentCard.Cantonese}
          jyutping={currentCard.Jyutping}
          proficiency={currentCard.ProficiencyLevel}
        />
      ) : (
        <div className="text-xl text-gray-600">No more cards for now!</div>
      )}

      {/* Buttons for user interaction */}
      <div className="mt-8 space-y-4 w-full max-w-sm">
        <button
          onClick={() => handleNextCard(-1)} // Decrease proficiency by 1
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-200"
        >
          Mark Difficult (Proficiency -1)
        </button>
        <button
          onClick={() => handleNextCard(0)} // Keep proficiency same, just update review time
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-200"
        >
          Review Again (Same Proficiency)
        </button>
        <button
          onClick={() => handleNextCard(1)} // Increase proficiency by 1
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-200"
        >
          Mark Easy (Proficiency +1)
        </button>
      </div>

      {/* Display current card proficiency and total cards due */}
      <div className="mt-6 text-gray-600 text-sm">
        Proficiency: {currentCard?.ProficiencyLevel || '-'} / 5
        <br/>
        Cards Due: {vocabCards.length}
      </div>
    </div>
  );
}

export default App;