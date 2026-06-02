import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { Player, OwnedPokemon } from '../store/gameStore';
import { POKEMON_DATABASE, getPokemonById, PokemonData } from '../../../../../shared/data/pokemonData';
import { PokemonSprite, TypeBadge, LevelBadge, PokeHeader, PokeCard } from './PokeShared';

interface Props {
  players: Player[];
  allOwnedPokemon: OwnedPokemon[];
  onLogResult: (
    playerId: string,
    ownedId: string | null,
    pokemonDataId: string | null,
    levelGain: number,
    coinsEarned: number,
    gameName: string,
    result: string,
    sourceSystem: string,
    notes: string,
    addNewPokemon: boolean,
  ) => void;
  onBack: () => void;
}

const GAME_NAMES = [
  'IRL Catch a Pokémon',
  'Pokémon Showdown Battle',
  'PokeReflex',
  'PokeGuess',
  'Quiz Battle',
  'Speed Challenge',
  'Custom Game',
];

const RESULT_OPTIONS = [
  { value: 'Win / Correct', levelGain: 10, coinsEarned: 15 },
  { value: 'Caught', levelGain: 0, coinsEarned: 20 },
  { value: 'Partial', levelGain: 1, coinsEarned: 5 },
  { value: 'Lose / Wrong', levelGain: 0, coinsEarned: 0 },
  { value: 'Custom', levelGain: 0, coinsEarned: 0 },
];

function Select({ value, options, onChange, placeholder }: { value: string; options: { label: string; value: string }[]; onChange: (val: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  return (
    <View style={styles.selectContainer}>
      <Pressable onPress={() => setOpen(!open)} style={styles.selectButton}>
        <Text style={[styles.selectButtonText, !value && styles.selectPlaceholder]}>{selectedLabel}</Text>
      </Pressable>
      {open && (
        <View style={styles.dropdownContainer}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
            {options.map(opt => (
              <Pressable
                key={opt.value}
                style={[styles.dropdownItem, value === opt.value && styles.dropdownItemSelected]}
                onPress={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <Text style={value === opt.value ? styles.dropdownItemTextSelected : styles.dropdownItemText}>{opt.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export function FacilitatorLog({ players, allOwnedPokemon, onLogResult, onBack }: Props) {
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [gameName, setGameName] = useState(GAME_NAMES[0]);
  const [customGame, setCustomGame] = useState('');
  const [resultOption, setResultOption] = useState(RESULT_OPTIONS[0].value);
  const [pokemonSearch, setPokemonSearch] = useState('');
  const [selectedPokemonData, setSelectedPokemonData] = useState<PokemonData | null>(null);
  const [addNewPokemon, setAddNewPokemon] = useState(false);
  const [customLevel, setCustomLevel] = useState('0');
  const [customCoins, setCustomCoins] = useState('0');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);
  const playerPokemon = allOwnedPokemon.filter(o => o.playerId === selectedPlayerId);

  const resultDef = RESULT_OPTIONS.find(r => r.value === resultOption) ?? RESULT_OPTIONS[0];
  const isCustom = resultOption === 'Custom';
  const isCatch = resultOption === 'Caught';

  const levelGain = isCustom ? Number(customLevel) || 0 : resultDef.levelGain;
  const coinsEarned = isCustom ? Number(customCoins) || 0 : resultDef.coinsEarned;

  const pokemonSuggestions = pokemonSearch
    ? POKEMON_DATABASE.filter(p => p.name.toLowerCase().includes(pokemonSearch.toLowerCase())).slice(0, 5)
    : [];

  function selectPokemon(pd: PokemonData) {
    setSelectedPokemonData(pd);
    setPokemonSearch(pd.name);
    const alreadyOwns = playerPokemon.some(o => o.pokemonDataId === pd.id);
    setAddNewPokemon(!alreadyOwns && isCatch);
  }

  function handleSubmit() {
    if (!selectedPlayerId) {
      setMessage({ text: 'Please select a player.', ok: false });
      return;
    }

    const finalGame = gameName === 'Custom Game' ? customGame || 'Custom Game' : gameName;

    let ownedId: string | null = null;
    if (selectedPokemonData && !addNewPokemon) {
      const owned = playerPokemon.find(o => o.pokemonDataId === selectedPokemonData.id);
      ownedId = owned?.id ?? null;
    }

    onLogResult(
      selectedPlayerId,
      ownedId,
      selectedPokemonData?.id ?? null,
      levelGain,
      coinsEarned,
      finalGame,
      resultOption.toLowerCase(),
      'facilitator',
      notes,
      addNewPokemon && !!selectedPokemonData,
    );

    setMessage({ text: 'Result logged successfully!', ok: true });
    setNotes('');
    setSelectedPokemonData(null);
    setPokemonSearch('');
    setAddNewPokemon(false);
    setTimeout(() => setMessage(null), 2500);
  }

  const playerOptions = players.map(p => ({ label: `${p.name} (🪙${p.coins})`, value: p.id }));
  const gameOptions = GAME_NAMES.map(g => ({ label: g, value: g }));

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <PokeHeader title="Facilitator Log" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.alertBox}>
          <Text style={styles.alertIcon}>🔑</Text>
          <Text style={styles.alertText}>Facilitator Access — Manual Result Logger</Text>
        </View>

        {message && (
          <View
            style={[
              styles.messageBox,
              {
                backgroundColor: message.ok ? '#F0FFF4' : '#FFF5F5',
                borderColor: message.ok ? '#C6F6D5' : '#FED7D7',
              },
            ]}
          >
            <Text style={[styles.messageText, { color: message.ok ? '#276749' : '#C53030' }]}>
              {message.ok ? '✅ ' : '❌ '}{message.text}
            </Text>
          </View>
        )}

        <PokeCard style={styles.card}>
          <Text style={styles.cardLabel}>SELECT PLAYER</Text>
          <Select value={selectedPlayerId} options={playerOptions} onChange={setSelectedPlayerId} placeholder="Choose a player..." />
        </PokeCard>

        <PokeCard style={styles.card}>
          <Text style={styles.cardLabel}>GAME NAME</Text>
          <Select value={gameName} options={gameOptions} onChange={setGameName} placeholder="Choose game..." />
          {gameName === 'Custom Game' && (
            <TextInput
              style={styles.textInput}
              value={customGame}
              onChangeText={setCustomGame}
              placeholder="Enter custom game name..."
            />
          )}
        </PokeCard>

        <PokeCard style={styles.card}>
          <Text style={styles.cardLabel}>RESULT</Text>
          <View style={styles.resultGrid}>
            {RESULT_OPTIONS.map(r => {
              const active = resultOption === r.value;
              return (
                <Pressable
                  key={r.value}
                  onPress={() => {
                    setResultOption(r.value);
                    if (r.value === 'Caught') setAddNewPokemon(true);
                    else setAddNewPokemon(false);
                  }}
                  style={[
                    styles.resultButton,
                    {
                      borderColor: active ? '#CC0000' : '#E2E8F0',
                      backgroundColor: active ? '#FFF5F5' : '#fff',
                    },
                  ]}
                >
                  <Text style={[styles.resultButtonText, { color: active ? '#CC0000' : '#4A5568' }]}>{r.value}</Text>
                </Pressable>
              );
            })}
          </View>
          {isCustom ? (
            <View style={styles.customValuesGrid}>
              <View style={styles.customInputCol}>
                <Text style={styles.customLabel}>Level Gain</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={customLevel}
                  onChangeText={setCustomLevel}
                />
              </View>
              <View style={styles.customInputCol}>
                <Text style={styles.customLabel}>Coins Earned</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={customCoins}
                  onChangeText={setCustomCoins}
                />
              </View>
            </View>
          ) : (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>+{levelGain} Lv</Text>
              <Text style={styles.summaryText}>+🪙{coinsEarned}</Text>
            </View>
          )}
        </PokeCard>

        <PokeCard style={styles.card}>
          <Text style={styles.cardLabel}>POKÉMON INVOLVED (Optional)</Text>
          <View style={{ zIndex: 10 }}>
            <TextInput
              style={styles.textInput}
              value={pokemonSearch}
              onChangeText={(text: string) => { setPokemonSearch(text); setSelectedPokemonData(null); }}
              placeholder="Search Pokémon name..."
            />
            {pokemonSuggestions.length > 0 && !selectedPokemonData && (
              <View style={styles.suggestionsContainer}>
                {pokemonSuggestions.map(pd => (
                  <Pressable key={pd.id} onPress={() => selectPokemon(pd)} style={styles.suggestionItem}>
                    <PokemonSprite spriteId={pd.spriteId} name={pd.name} size={32} />
                    <Text style={styles.suggestionText}>{pd.name}</Text>
                    <TypeBadge type={pd.type} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          {selectedPokemonData && (
            <View style={styles.selectedPokemonBox}>
              <PokemonSprite spriteId={selectedPokemonData.spriteId} name={selectedPokemonData.name} size={40} />
              <View style={styles.selectedPokemonInfo}>
                <Text style={styles.selectedPokemonName}>{selectedPokemonData.name}</Text>
                <TypeBadge type={selectedPokemonData.type} />
              </View>
              {selectedPlayer && isCatch && (
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Add to Pokédex</Text>
                  <Switch value={addNewPokemon} onValueChange={setAddNewPokemon} />
                </View>
              )}
            </View>
          )}

          {selectedPlayerId && !isCatch && playerPokemon.length > 0 && (
            <View style={styles.playerPokemonSection}>
              <Text style={styles.playerPokemonLabel}>Or pick from {selectedPlayer?.name}'s Pokémon:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.playerPokemonScroll}>
                {playerPokemon.map(owned => {
                  const pd2 = getPokemonById(owned.pokemonDataId);
                  if (!pd2) return null;
                  const active = selectedPokemonData?.id === pd2.id;
                  return (
                    <Pressable
                      key={owned.id}
                      onPress={() => selectPokemon(pd2)}
                      style={[styles.playerPokemonItem, { borderColor: active ? '#CC0000' : '#E2E8F0' }]}
                    >
                      <PokemonSprite spriteId={pd2.spriteId} name={pd2.name} size={40} />
                      <Text style={styles.playerPokemonName}>{pd2.name}</Text>
                      <LevelBadge level={owned.level} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </PokeCard>

        <PokeCard style={styles.card}>
          <Text style={styles.cardLabel}>NOTES (Optional)</Text>
          <TextInput
            style={styles.textArea}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any notes about this game..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </PokeCard>

        <Pressable onPress={handleSubmit} style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Log Result ✓</Text>
        </Pressable>
        <View style={{ height: 20 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  alertIcon: {
    fontSize: 16,
  },
  alertText: {
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: 'bold',
  },
  messageBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  messageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    padding: 16,
    zIndex: 1,
  },
  cardLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginTop: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 80,
  },
  selectContainer: {
    position: 'relative',
    zIndex: 50,
  },
  selectButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectButtonText: {
    fontSize: 14,
    color: '#1F2937',
  },
  selectPlaceholder: {
    color: '#9CA3AF',
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 100,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemSelected: {
    backgroundColor: '#F9FAFB',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
  },
  dropdownItemTextSelected: {
    fontSize: 14,
    color: '#111827',
    fontWeight: 'bold',
  },
  resultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  resultButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  resultButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  customValuesGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  customInputCol: {
    flex: 1,
  },
  customLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 100,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  selectedPokemonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginTop: 8,
  },
  selectedPokemonInfo: {
    flex: 1,
    gap: 4,
    alignItems: 'flex-start',
  },
  selectedPokemonName: {
    fontWeight: '600',
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  switchLabel: {
    fontSize: 12,
    color: '#4B5563',
  },
  playerPokemonSection: {
    marginTop: 12,
  },
  playerPokemonLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  playerPokemonScroll: {
    gap: 8,
  },
  playerPokemonItem: {
    alignItems: 'center',
    gap: 2,
    padding: 8,
    borderWidth: 2,
    borderRadius: 12,
    minWidth: 60,
  },
  playerPokemonName: {
    fontSize: 12,
    color: '#374151',
  },
  submitButton: {
    backgroundColor: '#CC0000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#CC0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
