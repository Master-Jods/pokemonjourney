import { useState } from 'react';
import { NameEntry } from './components/NameEntry';
import { GameMenu } from './components/GameMenu';
import { PokeReflex } from './components/PokeReflex';
import { PokeGuess } from './components/PokeGuess';
import { ThrowPokeball } from './components/ThrowPokeball';
import { ResultScreen } from './components/ResultScreen';
import { generateWildPokemon, type WildPokemon } from './lib/wildPokemon';
import { sendResultToMainSystem, type CatchResult } from './lib/mainSystem';
import { findPlayerByName, type PlayerRecord } from './lib/playerLookup';
import { startBackgroundMusic } from './lib/soundEffects';

type Screen = 'name' | 'menu' | 'reflex' | 'guess' | 'throw' | 'result';

export default function App() {
  const [screen, setScreen] = useState<Screen>('name');
  const [playerName, setPlayerName] = useState('');
  const [playerData, setPlayerData] = useState<PlayerRecord | null>(null);
  const [wild, setWild] = useState<WildPokemon | null>(null);
  const [activeGame, setActiveGame] = useState<'PokeReflex' | 'PokeGuess' | 'ThrowThatPokeball' | null>(null);
  const [lastResult, setLastResult] = useState<CatchResult | null>(null);
  const [isPreparingGame, setIsPreparingGame] = useState(false);
  const [prepareError, setPrepareError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSavingResult, setIsSavingResult] = useState(false);

  const handleSelectGame = async (game: 'reflex' | 'guess' | 'throw') => {
    if (isPreparingGame) return;
    setPrepareError('');
    setIsPreparingGame(true);
    try {
      const generatedWildPokemon = await generateWildPokemon();
      setWild(generatedWildPokemon);
      setActiveGame(game === 'reflex' ? 'PokeReflex' : game === 'guess' ? 'PokeGuess' : 'ThrowThatPokeball');
      setScreen(game);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to generate wild Pokémon right now.';
      setPrepareError(message);
    } finally {
      setIsPreparingGame(false);
    }
  };

  const handleFinish = (result: 'caught' | 'fled') => {
    if (!wild || !activeGame || isSavingResult) return;
    setIsSavingResult(true);
    const payload: CatchResult = {
      playerName,
      pokemonName: wild.pokemon_name,
      gameName: activeGame,
      result,
      levelGain: 0,
      coinsEarned: result === 'caught' ? 20 : 0,
      sourceSystem: 'catching_subsystem',
      wildPokemon: wild,
    };
    setSaveError('');
    setLastResult(payload);
    setScreen('result');

    void (async () => {
      try {
        await sendResultToMainSystem(payload);
        if (payload.coinsEarned > 0) {
          setPlayerData((current) =>
            current
              ? { ...current, coin_balance: Number(current.coin_balance ?? 0) + payload.coinsEarned }
              : current,
          );
        }
        setSaveError('');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save game result.';
        setSaveError(message);
      } finally {
        setIsSavingResult(false);
      }
    })();
  };

  const playAgain = () => {
    setLastResult(null);
    setWild(null);
    setActiveGame(null);
    setPrepareError('');
    setSaveError('');
    setIsSavingResult(false);
    setScreen('menu');
  };

  const logout = () => {
    setPlayerName('');
    setPlayerData(null);
    setLastResult(null);
    setWild(null);
    setActiveGame(null);
    setPrepareError('');
    setIsPreparingGame(false);
    setSaveError('');
    setIsSavingResult(false);
    setScreen('name');
  };

  return (
    <div className="size-full min-h-screen">
      {screen === 'name' && (
        <NameEntry
          onConfirm={async (name) => {
            startBackgroundMusic();
            const player = await findPlayerByName(name);
            setPlayerData(player);
            setPlayerName(player.player_name);
            setScreen('menu');
          }}
        />
      )}
      {screen === 'menu' && (
        <GameMenu
          playerName={playerName}
          playerData={playerData}
          onSelectGame={handleSelectGame}
          isPreparingGame={isPreparingGame}
          prepareError={prepareError}
          onLogout={logout}
        />
      )}
      {screen === 'reflex' && wild && (
        <PokeReflex
          wild={wild}
          playerName={playerName}
          isSavingResult={isSavingResult}
          onFinish={handleFinish}
          onBack={() => setScreen('menu')}
        />
      )}
      {screen === 'guess' && wild && (
        <PokeGuess
          wild={wild}
          playerName={playerName}
          isSavingResult={isSavingResult}
          onFinish={handleFinish}
          onBack={() => setScreen('menu')}
        />
      )}
      {screen === 'throw' && wild && (
        <ThrowPokeball
          wild={wild}
          playerName={playerName}
          isSavingResult={isSavingResult}
          onFinish={handleFinish}
          onBack={() => setScreen('menu')}
        />
      )}
      {screen === 'result' && lastResult && wild && (
        <ResultScreen
          result={lastResult}
          wild={wild}
          isSavingResult={isSavingResult}
          saveError={saveError}
          onPlayAgain={playAgain}
          onMenu={() => setScreen('menu')}
        />
      )}
    </div>
  );
}
