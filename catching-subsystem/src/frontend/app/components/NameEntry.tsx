import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PageFrame, PokeballCorner } from './PageFrame';

type NameEntryProps = {
  onConfirm: (name: string) => Promise<void> | void;
};

export function NameEntry({ onConfirm }: NameEntryProps) {
  const [name, setName] = useState('');
  const [stage, setStage] = useState<'entry' | 'confirm'>('entry');
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const trimmed = name.trim();

  const handleLookup = async () => {
    if (!trimmed || isChecking) return;
    setErrorMessage('');
    setIsChecking(true);
    try {
      await onConfirm(trimmed);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to verify player right now.';
      setErrorMessage(message);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <PageFrame>
      <div className="relative bg-white rounded-3xl shadow-xl px-12 py-6 border-2 border-blue-400">
        <PokeballCorner side="left" />
        <PokeballCorner side="right" />
        <h1 className="text-center text-3xl font-bold mb-4 bg-gradient-to-r from-orange-500 via-yellow-500 to-blue-500 bg-clip-text text-transparent">
          Pokemon Adventure
        </h1>

        {stage === 'entry' && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrorMessage('');
              }}
              placeholder="Enter Player Name"
              className="max-w-xs border-2 border-yellow-400 rounded-full px-4"
              disabled={isChecking}
              onKeyDown={(e) => { if (e.key === 'Enter' && trimmed && !isChecking) setStage('confirm'); }}
            />
            <Button
              disabled={!trimmed || isChecking}
              onClick={() => setStage('confirm')}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 disabled:opacity-50"
            >
              Continue
            </Button>
          </div>
        )}

        {stage === 'confirm' && (
          <div className="text-center">
            <p className="text-gray-600 mb-1">You are playing as</p>
            <div className="text-2xl font-bold text-blue-600 mb-4">{trimmed}</div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setStage('entry')} variant="outline" className="rounded-full px-6" disabled={isChecking}>
                Change Name
              </Button>
              <Button onClick={handleLookup} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8" disabled={isChecking}>
                {isChecking ? 'Checking...' : 'Continue'}
              </Button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="text-center mt-4 text-sm font-medium text-red-600">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="relative bg-white rounded-3xl shadow-xl p-8 border-2 border-blue-400">
        <span className="absolute top-4 left-4 w-2 h-2 rounded-full bg-red-400" />
        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500" />
        <h2 className="text-center text-2xl font-bold mb-2 text-gray-700">Welcome, Trainer!</h2>
        <p className="text-center text-gray-500">
          Your name must match the one used in the Main System. Once confirmed, you'll be sent
          to the mini game selection to start catching wild Pokémon.
        </p>
      </div>
    </PageFrame>
  );
}
