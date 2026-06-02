import { useState } from 'react';
import { PokeHeader, PokeCard } from './PokeShared';

interface SubsystemResult {
  playerName: string;
  pokemonName?: string;
  gameName: string;
  result: string;
  levelGain: number;
  coinsEarned: number;
  sourceSystem: string;
}

interface Props {
  onProcess: (result: SubsystemResult) => { success: boolean; message: string };
  onBack: () => void;
}

const EXAMPLE_CATCH = JSON.stringify({
  playerName: 'Ash',
  pokemonName: 'Squirtle',
  gameName: 'PokeReflex',
  result: 'caught',
  levelGain: 0,
  coinsEarned: 20,
  sourceSystem: 'catching_subsystem',
}, null, 2);

const EXAMPLE_LEVEL = JSON.stringify({
  playerName: 'Ash',
  pokemonName: 'Charmander',
  gameName: 'Battle Predictor',
  result: 'correct',
  levelGain: 10,
  coinsEarned: 15,
  sourceSystem: 'leveling_subsystem',
}, null, 2);

export function ResultReceiver({ onProcess, onBack }: Props) {
  const [jsonInput, setJsonInput] = useState('');
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [parsed, setParsed] = useState<SubsystemResult | null>(null);
  const [parseError, setParseError] = useState('');

  function handleParse() {
    setParseError('');
    setParsed(null);
    try {
      const data = JSON.parse(jsonInput);
      if (!data.playerName || !data.gameName || !data.result) {
        setParseError('Missing required fields: playerName, gameName, result');
        return;
      }
      setParsed({
        playerName: data.playerName,
        pokemonName: data.pokemonName,
        gameName: data.gameName,
        result: data.result,
        levelGain: Number(data.levelGain ?? 0),
        coinsEarned: Number(data.coinsEarned ?? 0),
        sourceSystem: data.sourceSystem ?? 'subsystem',
      });
    } catch {
      setParseError('Invalid JSON format. Please check your input.');
    }
  }

  function handleProcess() {
    if (!parsed) return;
    const result = onProcess(parsed);
    setMessage({ text: result.message, ok: result.success });
    if (result.success) {
      setJsonInput('');
      setParsed(null);
    }
    setTimeout(() => setMessage(null), 4000);
  }

  function loadExample(type: 'catch' | 'level') {
    setJsonInput(type === 'catch' ? EXAMPLE_CATCH : EXAMPLE_LEVEL);
    setParsed(null);
    setParseError('');
    setMessage(null);
  }

  return (
    <div className="flex flex-col min-h-full">
      <PokeHeader title="Subsystem Integration" onBack={onBack} />
      <div className="flex-1 p-4 flex flex-col gap-4">
        <PokeCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span>🔗</span>
            <h2 className="font-bold text-gray-800">Result Receiver</h2>
          </div>
          <p className="text-xs text-gray-500">
            Paste a JSON result from a subsystem (PokeReflex, Battle Predictor, etc.) to update player records automatically.
          </p>
        </PokeCard>

        {message && (
          <div
            className="rounded-xl p-3 text-sm font-semibold text-center"
            style={{
              background: message.ok ? '#F0FFF4' : '#FFF5F5',
              color: message.ok ? '#276749' : '#C53030',
              border: `1px solid ${message.ok ? '#C6F6D5' : '#FED7D7'}`,
            }}
          >
            {message.ok ? '✅ ' : '❌ '}{message.text}
          </div>
        )}

        {/* Examples */}
        <PokeCard className="p-4">
          <p className="text-xs text-gray-500 font-semibold mb-2">LOAD EXAMPLE</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => loadExample('catch')}
              className="py-2 px-3 rounded-xl text-xs font-semibold border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              🎯 Catch Result
            </button>
            <button
              onClick={() => loadExample('level')}
              className="py-2 px-3 rounded-xl text-xs font-semibold border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              ⬆️ Level Result
            </button>
          </div>
        </PokeCard>

        {/* JSON Input */}
        <PokeCard className="p-4">
          <p className="text-xs text-gray-500 font-semibold mb-2">PASTE JSON RESULT</p>
          <textarea
            value={jsonInput}
            onChange={e => { setJsonInput(e.target.value); setParsed(null); setParseError(''); setMessage(null); }}
            placeholder={'{\n  "playerName": "Ash",\n  "gameName": "PokeReflex",\n  "result": "caught",\n  ...\n}'}
            rows={8}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none resize-none font-mono"
          />
          {parseError && (
            <p className="text-xs text-red-500 mt-1">{parseError}</p>
          )}
          <button
            onClick={handleParse}
            disabled={!jsonInput.trim()}
            className="mt-3 w-full py-2.5 rounded-xl font-semibold text-sm "
            style={{
              background: jsonInput.trim() ? '#1a1a2e' : '#E2E8F0',
              color: jsonInput.trim() ? '#FFDE00' : '#A0AEC0',
            }}
          >
            Parse JSON
          </button>
        </PokeCard>

        {/* Parsed preview */}
        {parsed && (
          <PokeCard className="p-4">
            <p className="text-xs text-green-700 font-semibold mb-3">✅ Parsed Successfully</p>
            <div className="flex flex-col gap-2">
              <Row label="Player" value={parsed.playerName} />
              {parsed.pokemonName && <Row label="Pokémon" value={parsed.pokemonName} />}
              <Row label="Game" value={parsed.gameName} />
              <Row label="Result" value={parsed.result} />
              <Row label="Level Gain" value={`+${parsed.levelGain}`} />
              <Row label="Coins Earned" value={`+${parsed.coinsEarned} 🪙`} />
              <Row label="Source" value={parsed.sourceSystem} />
            </div>
            <button
              onClick={handleProcess}
              className="mt-4 w-full py-3 rounded-xl font-bold text-white  "
              style={{ background: 'linear-gradient(135deg, #CC0000, #FF4444)' }}
            >
              Process Result →
            </button>
          </PokeCard>
        )}

        {/* Expected format */}
        <PokeCard className="p-4">
          <p className="text-xs text-gray-500 font-semibold mb-2">REQUIRED FORMAT</p>
          <div className="bg-gray-50 rounded-xl p-3 text-xs font-mono text-gray-600 leading-relaxed">
            {`{\n  "playerName": string,      // required\n  "pokemonName": string,    // optional\n  "gameName": string,       // required\n  "result": string,         // required\n  "levelGain": number,      // 0-100\n  "coinsEarned": number,    // 0+\n  "sourceSystem": string    // optional\n}`}
          </div>
        </PokeCard>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}
