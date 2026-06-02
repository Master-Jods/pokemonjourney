import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buyStoreItem,
  evolveOwnedPokemon,
  findOrCreatePlayer,
  getPlayerCoins,
  getPlayerDashboardStats,
  getPlayerHistory,
  getPlayerInventory,
  saveStarterPokemon,
  rewardBadgeToPlayer,
} from '../backend/playerService';
import { startBackgroundMusic } from './lib/soundEffects';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import {
  Backpack,
  BookOpen,
  CircleDollarSign,
  Flame,
  Home,
  Leaf,
  Moon,
  ScrollText,
  ShoppingCart,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Waves,
  Zap,
} from 'lucide-react-native';
import {
  POKEMON_DATABASE,
  PokemonData,
  STORE_ITEMS,
  StoreItem,
  getPokemonById,
  getSpriteUrl,
  getTypeColor,
} from '../../../shared/data/pokemonData';

const pokeballImg = require('./imports/image-2.png') as ImageSourcePropType;
const pokemonLogo = require('./imports/image-3.png') as ImageSourcePropType;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  if (typeof error === 'string' && error.trim()) return error;
  return 'Unknown error';
}

type Page =
  | 'start'
  | 'dashboard'
  | 'starter'
  | 'pokedex'
  | 'store'
  | 'inventory'
  | 'evolution'
  | 'history'
  | 'rewarding';

type OwnedPokemon = {
  id: string;
  pokemonDataId: string;
  level: number;
  source: string;
};

type HistoryEntry = {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
  pokemonId?: string;
  levelGain?: number;
  result?: string;
  sourceSystem?: string;
};

type EvolutionAnimationState = {
  from: PokemonData;
  to: PokemonData;
};

const STARTER_QUESTIONS = [
  {
    text: 'In a battle, you prefer to...',
    options: [
      { label: 'Rush in with full force 🔥', type: 'Fire' },
      { label: 'Outlast the opponent with patience 🌿', type: 'Grass' },
      { label: 'Stay flexible and find openings 💧', type: 'Water' },
    ],
  },
  {
    text: "What's your ideal vacation?",
    options: [
      { label: 'Volcanic island adventure 🌋', type: 'Fire' },
      { label: 'Dense forest exploration 🌲', type: 'Grass' },
      { label: 'Ocean cruise or surfing 🏄', type: 'Water' },
    ],
  },
  {
    text: 'Your biggest strength is...',
    options: [
      { label: 'Passion and raw determination 💪', type: 'Fire' },
      { label: 'Patience and careful strategy 🧠', type: 'Grass' },
      { label: 'Adaptability and staying calm 🌊', type: 'Water' },
    ],
  },
  {
    text: 'When facing a tough problem, you...',
    options: [
      { label: 'Attack it head-on immediately ⚡', type: 'Fire' },
      { label: 'Analyze every detail first 🔍', type: 'Grass' },
      { label: 'Go with the flow and improvise 🎯', type: 'Water' },
    ],
  },
  {
    text: 'Your favorite element is...',
    options: [
      { label: 'Fire — powerful and unstoppable 🔥', type: 'Fire' },
      { label: 'Nature — wise and enduring 🌿', type: 'Grass' },
      { label: 'Water — calm yet overwhelming 💧', type: 'Water' },
    ],
  },
];

const featureItems: { label: string; page: Page; Icon: any; color: string }[] = [
  { label: 'Pokédex', page: 'pokedex', Icon: BookOpen, color: '#2B6CB0' },
  { label: 'Starter', page: 'starter', Icon: Star, color: '#D69E2E' },
  { label: 'Store', page: 'store', Icon: ShoppingCart, color: '#276749' },
  { label: 'Inventory', page: 'inventory', Icon: Backpack, color: '#C05621' },
  { label: 'Evolution', page: 'evolution', Icon: Sparkles, color: '#805AD5' },
  { label: 'History', page: 'history', Icon: ScrollText, color: '#718096' },
];

const navItems: { page: Page; Icon: any; label: string }[] = [
  { page: 'dashboard', Icon: Home, label: 'Home' },
  { page: 'pokedex', Icon: BookOpen, label: 'Dex' },
  { page: 'store', Icon: ShoppingCart, label: 'Store' },
  { page: 'inventory', Icon: Backpack, label: 'Bag' },
  { page: 'history', Icon: ScrollText, label: 'Log' },
];

export default function App() {
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [page, setPage] = useState<Page>('start');
  const [coins, setCoins] = useState(100);
  const [ownedPokemon, setOwnedPokemon] = useState<OwnedPokemon[]>([]);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [starterError, setStarterError] = useState('');
  const [isSavingStarter, setIsSavingStarter] = useState(false);
  const [storeError, setStoreError] = useState('');
  const [isBuyingItem, setIsBuyingItem] = useState('');
  const [evolutionAnimation, setEvolutionAnimation] = useState<EvolutionAnimationState | null>(null);
  const [pokemonDetailsCache, setPokemonDetailsCache] = useState<Record<string, PokemonData>>({});

  useEffect(() => {
    async function fetchMissingPokemonDetails() {
      const missingIds = ownedPokemon
        .map(p => p.pokemonDataId)
        .filter(id => !getPokemonById(id) && !pokemonDetailsCache[id]);
      
      if (missingIds.length === 0) return;

      const newDetails = { ...pokemonDetailsCache };
      let changed = false;

      await Promise.all(
        missingIds.map(async (idStr) => {
          try {
            const numId = parseInt(idStr, 10);
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${numId}`);
            if (!response.ok) return;
            const data = await response.json();
            
            const typeName = data.types[0].type.name;
            const capitalizedType = typeName.charAt(0).toUpperCase() + typeName.slice(1);
            const capitalizedName = data.name.charAt(0).toUpperCase() + data.name.slice(1);
            
            let region = 'Unknown';
            if (numId <= 151) region = 'Kanto';
            else if (numId <= 251) region = 'Johto';
            else if (numId <= 386) region = 'Hoenn';
            else if (numId <= 493) region = 'Sinnoh';
            else if (numId <= 649) region = 'Unova';
            else if (numId <= 721) region = 'Kalos';
            else if (numId <= 809) region = 'Alola';
            else if (numId <= 898) region = 'Galar';
            else region = 'Paldea';

            newDetails[idStr] = {
              id: idStr,
              name: capitalizedName,
              type: capitalizedType,
              region: region,
              spriteId: numId,
              evolutionStage: 1,
            };
            changed = true;
          } catch (err) {
            console.error(`Failed to fetch details for pokemon ${idStr}:`, err);
          }
        })
      );

      if (changed) {
        setPokemonDetailsCache(newDetails);
      }
    }

    if (ownedPokemon.length > 0) {
      fetchMissingPokemonDetails();
    }
  }, [ownedPokemon]);

  const getPokemonOrFallback = (id: string): PokemonData | undefined => {
    return getPokemonById(id) ?? pokemonDetailsCache[id];
  };

  useEffect(() => {
    if (page !== 'dashboard' || !playerId) return;

    const interval = setInterval(async () => {
      try {
        const [stats, savedInventory, savedHistory, currentCoins] = await Promise.all([
          getPlayerDashboardStats(playerId),
          getPlayerInventory(playerId),
          getPlayerHistory(playerId),
          getPlayerCoins(playerId),
        ]);

        setCoins(currentCoins);
        setInventory(savedInventory);
        setHistory(savedHistory);
        setOwnedPokemon(
          stats.pokedex.map((item) => ({
            id: item.pokedex_id,
            pokemonDataId: item.pokemon_id,
            level: item.level,
            source: item.source,
          }))
        );
      } catch (err) {
        console.error('Auto-refresh error:', err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [page, playerId]);

  const starter = useMemo(() => {
    const first = ownedPokemon.find(owned => owned.source === 'Starter');
    return first ? getPokemonOrFallback(first.pokemonDataId) ?? null : null;
  }, [ownedPokemon, pokemonDetailsCache]);

  const totalLevels = ownedPokemon.reduce((sum, owned) => sum + owned.level, 0);
  const showNav = !!playerName && page !== 'start' && page !== 'rewarding';

 function startJourney() {
  const trimmed = nameInput.trim();

  if (!trimmed) {
    setError('Please enter your trainer name!');
    return;
  }

  if (trimmed.length < 2) {
    setError('Name must be at least 2 characters.');
    return;
  }

  setError('');
  setIsStarting(true);
  startBackgroundMusic();

  setTimeout(() => {
    findOrCreatePlayer(trimmed)
      .then(async (player) => {
        const [stats, savedInventory, savedHistory] = await Promise.all([
          getPlayerDashboardStats(player.player_id),
          getPlayerInventory(player.player_id),
          getPlayerHistory(player.player_id),
        ]);

        setPlayerName(player.player_name);
        setPlayerId(player.player_id);
        setCoins(player.coin_balance ?? 0);
        setInventory(savedInventory);
        setHistory(savedHistory);
        setOwnedPokemon(
          stats.pokedex.map((item) => ({
            id: item.pokedex_id,
            pokemonDataId: item.pokemon_id,
            level: item.level,
            source: item.source,
          }))
        );
        
        const gymMatch = player.player_name.match(/^Gym([1-5])$/i);
        if (gymMatch) {
          setPage('rewarding');
        } else {
          setPage('dashboard');
        }
      })
      .catch((error) => {
  console.error('Start journey error:', error);
  setError('Unable to start journey. Please try again.');
})
      .finally(() => {
        setIsStarting(false);
      });
  }, 1150);
}

  function chooseStarter(pokemon: PokemonData) {
  const hasStarter = ownedPokemon.some(owned => owned.source === 'Starter');

  if (hasStarter) {
    setPage('dashboard');
    return;
  }

  setStarterError('');
  setIsSavingStarter(true);

  saveStarterPokemon(playerId, pokemon.id, playerName, pokemon.name)
    .then((result) => {
      setOwnedPokemon(current => [
        ...current,
        {
          id: result.pokemon.pokedex_id,
          pokemonDataId: result.pokemon.pokemon_id,
          level: result.pokemon.level,
          source: result.pokemon.source,
        },
      ]);

      setHistory(current => [result.history, ...current]);
      setPage('dashboard');
    })
    .catch((error) => {
      console.error('Starter selection error:', error);
      setStarterError(`Hindi na-save si ${pokemon.name}. ${getErrorMessage(error)}`);
    })
    .finally(() => {
      setIsSavingStarter(false);
    });
}

  async function buyItem(item: StoreItem) {
    if (coins < item.price) return;
    setStoreError('');
    setIsBuyingItem(item.name);
    try {
      const result = await buyStoreItem(playerId, item, playerName);
      setCoins(result.coins);
      setInventory(result.inventory);
      setHistory(current => [result.history, ...current]);
    } catch (error) {
      console.error('Store purchase error:', error);
      setStoreError(`Hindi na-save ang purchase. ${getErrorMessage(error)}`);
    } finally {
      setIsBuyingItem('');
    }
  }

  async function evolvePokemon(
    owned: OwnedPokemon,
    nextId: string,
    stone: string,
    currentName: string,
    nextName: string,
  ) {
    if (stone && (inventory[stone] ?? 0) < 1) return;
    setStoreError('');
    try {
      const result = await evolveOwnedPokemon(playerId, owned.id, nextId, stone, playerName, currentName, nextName);
      setInventory(result.inventory);
      setOwnedPokemon(current =>
        current.map(item => (item.id === owned.id ? { ...item, pokemonDataId: nextId } : item)),
      );
      
      const numCurrent = parseInt(owned.pokemonDataId, 10);
      const numNext = parseInt(nextId, 10);
      
      setEvolutionAnimation({
        from: {
          id: owned.pokemonDataId,
          name: currentName,
          type: 'Normal',
          region: 'Kanto',
          spriteId: numCurrent,
          evolutionStage: 1,
        },
        to: {
          id: nextId,
          name: nextName,
          type: 'Normal',
          region: 'Kanto',
          spriteId: numNext,
          evolutionStage: 2,
        }
      });
      setHistory(current => [result.history, ...current]);
    } catch (error) {
      console.error('Evolution error:', error);
      setStoreError(`Hindi na-save ang evolution. ${getErrorMessage(error)}`);
    }
  }

  function switchTrainer() {
    setNameInput('');
    setError('');
    setPlayerName('');
    setPage('start');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={page === 'start' ? 'light' : 'dark'} />
      <View style={styles.phone}>
        {page === 'start' ? (
          <StartScreen
            name={nameInput}
            error={error}
            onNameChange={value => {
              setNameInput(value);
              setError('');
            }}
            onStart={startJourney}
            isStarting={isStarting}
          />
        ) : (
          <>
            {page !== 'dashboard' && (
              <Header title={titleForPage(page)} onBack={page === 'rewarding' ? undefined : () => setPage('dashboard')} />
            )}

            {page === 'dashboard' && (
              <DashboardScreen
                playerName={playerName}
                coins={coins}
                ownedPokemon={ownedPokemon}
                totalLevels={totalLevels}
                starter={starter}
                history={history}
                pokemonDetailsCache={pokemonDetailsCache}
                getPokemonOrFallback={getPokemonOrFallback}
                onNavigate={setPage}
                onSwitchTrainer={switchTrainer}
              />
            )}

            {page === 'starter' && (
              <StarterScreen
                hasStarter={!!starter}
                starterId={starter?.id}
                onSelect={chooseStarter}
                error={starterError}
                isSaving={isSavingStarter}
              />
            )}

            {page === 'pokedex' && <PokedexScreen ownedPokemon={ownedPokemon} />}

            {page === 'store' && (
              <StoreScreen coins={coins} inventory={inventory} onBuy={buyItem} error={storeError} buyingItem={isBuyingItem} />
            )}

            {page === 'inventory' && (
              <InventoryScreen
                inventory={inventory}
                ownedPokemon={ownedPokemon}
                onEvolve={evolvePokemon}
                error={storeError}
              />
            )}

            {page === 'evolution' && (
              <EvolutionScreen
                inventory={inventory}
                ownedPokemon={ownedPokemon}
                onEvolve={evolvePokemon}
                error={storeError}
              />
            )}

            {page === 'history' && <HistoryScreen history={history} />}

            {page === 'rewarding' && (
              <RewardingScreen
                gymLeaderName={playerName}
                onLogout={switchTrainer}
              />
            )}

            {showNav && <BottomNav current={page} onNavigate={setPage} />}
            {evolutionAnimation && (
              <EvolutionAnimation
                from={evolutionAnimation.from}
                to={evolutionAnimation.to}
                onDone={() => setEvolutionAnimation(null)}
              />
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function StartScreen({
  name,
  error,
  isStarting,
  onNameChange,
  onStart,
}: {
  name: string;
  error: string;
  isStarting: boolean;
  onNameChange: (value: string) => void;
  onStart: () => void;
}) {
  return (
    <View style={styles.startScreen}>
      <FloatingText style={[styles.floatIcon, styles.floatOne]} delay={0}>⚡</FloatingText>
      <FloatingText style={[styles.floatIcon, styles.floatTwo]} delay={500} reverse>🔥</FloatingText>
      <FloatingText style={[styles.floatIcon, styles.floatThree]} delay={1000}>💧</FloatingText>
      <FloatingText style={[styles.floatIcon, styles.floatFour]} delay={1500} reverse>🌿</FloatingText>
      <FloatingText style={[styles.floatIcon, styles.floatFive]} delay={800}>✨</FloatingText>

      <FadeInView style={styles.logoArea}>
        <Image source={pokemonLogo} style={styles.logo} resizeMode="contain" />
        <SpinImage source={pokeballImg} style={styles.bigBall} />
        <Text style={styles.brandTitle}>PokéJourney</Text>
        <Text style={styles.brandSubtitle}>Begin your Pokémon adventure!</Text>
      </FadeInView>

      <FadeInView delay={180} style={styles.startCard}>
        <Text style={styles.muted}>Welcome, Trainer!</Text>
        <Text style={styles.startHeading}>Enter your name to start</Text>
        <Text style={styles.inputLabel}>Trainer Name</Text>
        <TextInput
          value={name}
          onChangeText={onNameChange}
          placeholder="e.g. Ash, Misty, Brock..."
          placeholderTextColor="#9CA3AF"
          maxLength={20}
          onSubmitEditing={onStart}
          style={[styles.input, error ? styles.inputError : null]}
          editable={!isStarting}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Pressable style={[styles.startButton, isStarting && styles.disabledButton]} onPress={onStart} disabled={isStarting}>
          <Text style={styles.startButtonText}>{isStarting ? 'Starting Journey...' : 'Start Journey →'}</Text>
        </Pressable>
        <Text style={styles.hintText}>Returning trainer? Enter your name to continue your journey.</Text>
      </FadeInView>

      {isStarting && (
        <View style={styles.transitionOverlay}>
          <PokeballTransition />
        </View>
      )}
    </View>
  );
}

function DashboardScreen({
  playerName,
  coins,
  ownedPokemon,
  totalLevels,
  starter,
  history,
  pokemonDetailsCache,
  getPokemonOrFallback,
  onNavigate,
  onSwitchTrainer,
}: {
  playerName: string;
  coins: number;
  ownedPokemon: OwnedPokemon[];
  totalLevels: number;
  starter: PokemonData | null;
  history: HistoryEntry[];
  pokemonDetailsCache: Record<string, PokemonData>;
  getPokemonOrFallback: (id: string) => PokemonData | undefined;
  onNavigate: (page: Page) => void;
  onSwitchTrainer: () => void;
}) {
  const starterOwned = starter ? ownedPokemon.find(owned => owned.pokemonDataId === starter.id) : null;

  const recentTouchedPokemon = useMemo(() => {
    const touchedIds = new Set<string>();
    const resultList: OwnedPokemon[] = [];

    const getPokemonIdByName = (name: string): string | undefined => {
      const cleanName = name.trim().toLowerCase();
      const local = POKEMON_DATABASE.find(p => p.name.toLowerCase() === cleanName);
      if (local) return local.id;
      const cached = Object.values(pokemonDetailsCache).find(p => p.name.toLowerCase() === cleanName);
      if (cached) return cached.id;
      return undefined;
    };

    for (const log of history) {
      const isEvolution = log.result === 'evolved' || log.title === 'Evolution';
      const isLevelGain = log.levelGain !== undefined && log.levelGain > 0;

      if (isEvolution || isLevelGain) {
        let pokemonDataId: string | undefined = undefined;

        if (isEvolution && log.detail) {
          const match = log.detail.match(/evolved\s+(?:his\s+)?([A-Za-z0-9\-\s]+?)\s+to\s+([A-Za-z0-9\-\s]+)/i);
          if (match) {
            const name = match[2].replace(/\.$/, '').trim();
            pokemonDataId = getPokemonIdByName(name);
          }
        }

        if (!pokemonDataId && log.pokemonId) {
          pokemonDataId = log.pokemonId;
        }

        if (pokemonDataId) {
          const owned = ownedPokemon.find(p => p.pokemonDataId === pokemonDataId);
          if (owned && !touchedIds.has(owned.id)) {
            touchedIds.add(owned.id);
            resultList.push(owned);
          }
        }
      }
    }
    return resultList.slice(0, 4);
  }, [history, ownedPokemon, pokemonDetailsCache]);

  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <FadeInView>
      <Card style={styles.trainerCard}>
        <View style={styles.trainerHeader}>
          <View>
            <Text style={styles.trainerLabel}>Trainer</Text>
            <Text style={styles.trainerName}>{playerName}</Text>
          </View>
          <SpinImage source={pokeballImg} style={styles.headerBall} />
        </View>
        <View style={styles.statsRow}>
          <Stat label="Pokémon" value={ownedPokemon.length} />
          <Divider />
          <Stat label="Total Lvls" value={totalLevels} />
          <View style={styles.statSpacer} />
          <CoinDisplay coins={coins} />
        </View>
      </Card>
      </FadeInView>

      {starter && starterOwned ? (
        <FadeInView delay={120}>
        <Card style={styles.starterCard}>
          <Text style={styles.sectionLabel}>Your Starter</Text>
          <View style={styles.starterRow}>
            <View style={styles.spriteFrame}>
              <FloatingSprite pokemon={starter} size={70} />
            </View>
            <View style={styles.flexOne}>
              <View style={styles.nameRow}>
                <Text style={styles.cardTitle}>{starter.name}</Text>
                <LevelBadge level={starterOwned.level} />
              </View>
              <TypeBadge type={starter.type} />
              <Text style={styles.smallMuted}>{starter.region} Region</Text>
            </View>
          </View>
        </Card>
        </FadeInView>
      ) : (
        <FadeInView delay={120}>
          <Pressable style={styles.chooseStarterButton} onPress={() => onNavigate('starter')}>
            <Text style={styles.chooseStarterText}>⭐ Choose your Starter Pokémon</Text>
          </Pressable>
        </FadeInView>
      )}

      <FadeInView delay={220}>
        <Text style={styles.sectionLabel}>Features</Text>
        <View style={styles.featureGrid}>
          {featureItems.map(item => (
            <ScalePressable
              key={item.page}
              style={styles.featureTile}
              onPress={() => onNavigate(item.page)}
            >
              <View style={[styles.featureIconWrap, { backgroundColor: `${item.color}14` }]}>
                <item.Icon size={30} color={item.color} strokeWidth={2.4} />
              </View>
              <Text style={styles.featureLabel}>{item.label}</Text>
            </ScalePressable>
          ))}
        </View>
      </FadeInView>

      {ownedPokemon.length > 0 && (
        <FadeInView delay={360}>
          <Text style={styles.sectionLabel}>Recent Pokémon</Text>
          <Card style={styles.recentCard}>
            {recentTouchedPokemon.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentList}>
                {recentTouchedPokemon.map(owned => {
                  const pokemon = getPokemonOrFallback(owned.pokemonDataId);
                  if (!pokemon) return null;
                  return (
                    <View key={owned.id} style={styles.recentItem}>
                      <FloatingSprite pokemon={pokemon} size={56} />
                      <Text style={styles.recentName}>{pokemon.name}</Text>
                      <LevelBadge level={owned.level} />
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.emptyRecent}>
                <Text style={styles.emptyRecentText}>No recent evolutions or level-ups yet.</Text>
                <Text style={styles.emptyRecentSubtext}>Train or evolve your Pokémon to see them here!</Text>
              </View>
            )}
          </Card>
        </FadeInView>
      )}

      <Pressable onPress={onSwitchTrainer}>
        <Text style={styles.switchText}>Switch Trainer</Text>
      </Pressable>
    </ScrollView>
  );
}

function StarterScreen({
  hasStarter,
  starterId,
  onSelect,
  error,
  isSaving,
}: {
  hasStarter: boolean;
  starterId?: string;
  onSelect: (pokemon: PokemonData) => void;
  error: string;
  isSaving: boolean;
}) {
  const [step, setStep] = useState<'quiz' | 'pick' | 'confirm'>('quiz');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({ Fire: 0, Grass: 0, Water: 0 });
  const [recommendedType, setRecommendedType] = useState('');
  const [recommendedId, setRecommendedId] = useState('');
  const [selected, setSelected] = useState<PokemonData | null>(null);

  if (hasStarter) {
    const current = starterId ? getPokemonById(starterId) : null;
    return (
      <InfoScreen
        icon="⭐"
        title="You already have a starter!"
        message={current ? `Your starter is ${current.name}.` : 'Your starter is already locked in.'}
      />
    );
  }

  function handleAnswer(type: string) {
    const nextScores = { ...scores, [type]: (scores[type] ?? 0) + 1 };
    setScores(nextScores);

    if (questionIndex < STARTER_QUESTIONS.length - 1) {
      setQuestionIndex(current => current + 1);
      return;
    }

    const maxScore = Math.max(...Object.values(nextScores));
    const topTypes = Object.entries(nextScores).filter(([, score]) => score === maxScore).map(([key]) => key);
    const typeWinner = topTypes[Math.floor(Math.random() * topTypes.length)];
    const starters = POKEMON_DATABASE.filter(pokemon => pokemon.isStarter && pokemon.type === typeWinner);
    const recommended = starters[Math.floor(Math.random() * starters.length)];
    setRecommendedType(typeWinner);
    setRecommendedId(recommended?.id ?? '');
    setStep('pick');
  }

  if (step === 'quiz') {
    const question = STARTER_QUESTIONS[questionIndex];
    const progress = questionIndex / STARTER_QUESTIONS.length;
    return (
      <ScrollView contentContainerStyle={styles.pageContent}>
        <View>
          <View style={styles.progressMeta}>
            <Text style={styles.smallMuted}>Question {questionIndex + 1} of {STARTER_QUESTIONS.length}</Text>
            <Text style={styles.smallMuted}>{Math.round(progress * 100)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        <FadeInView key={`q-${questionIndex}`}>
          <Card style={styles.questionCard}>
            <Text style={styles.muted}>Choose wisely, Trainer!</Text>
            <Text style={styles.questionText}>{question.text}</Text>
          </Card>
        </FadeInView>

        {question.options.map((option, index) => (
          <FadeInView key={option.label} delay={index * 90}>
            <ScalePressable style={styles.answerCard} onPress={() => handleAnswer(option.type)}>
              <Text style={styles.answerText}>{option.label}</Text>
            </ScalePressable>
          </FadeInView>
        ))}
      </ScrollView>
    );
  }

  if (step === 'pick') {
    const starters = POKEMON_DATABASE.filter(pokemon => pokemon.isStarter && pokemon.type === recommendedType);
    return (
      <ScrollView contentContainerStyle={styles.pageContent}>
        <Card style={styles.recommendationCard}>
          <Text style={styles.muted}>Based on your answers, you suit a</Text>
          <Text style={[styles.recommendedType, typeTextStyle(recommendedType)]}>{recommendedType}-type Trainer!</Text>
          <Text style={styles.smallMuted}>Pick one starter from any region</Text>
        </Card>

        {starters.map((pokemon, index) => (
          <FadeInView key={pokemon.id} delay={index * 90}>
            <ScalePressable
              style={styles.pickCard}
              onPress={() => {
                setSelected(pokemon);
                setStep('confirm');
              }}
            >
              <View style={styles.spriteFrame}>
                <FloatingSprite pokemon={pokemon} size={62} />
              </View>
              <View style={styles.flexOne}>
                <View style={styles.nameRow}>
                  <Text style={styles.cardTitle}>{pokemon.name}</Text>
                  {pokemon.id === recommendedId ? <Text style={styles.recommendedBadge}>Recommended</Text> : null}
                </View>
                <View style={styles.badgeRow}>
                  <TypeBadge type={pokemon.type} />
                  <RegionBadge region={pokemon.region} />
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </ScalePressable>
          </FadeInView>
        ))}

        <Pressable
          onPress={() => {
            setQuestionIndex(0);
            setScores({ Fire: 0, Grass: 0, Water: 0 });
            setStep('quiz');
          }}
        >
          <Text style={styles.switchText}>Retake questionnaire</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (!selected) return null;
  return (
    <ScrollView contentContainerStyle={[styles.pageContent, styles.confirmContent]}>
      <Text style={styles.muted}>Your chosen partner</Text>
      <PulseView style={styles.confirmSpriteFrame}>
        <PokemonSprite pokemon={selected} size={128} />
      </PulseView>
      <Text style={styles.confirmName}>{selected.name}</Text>
      <View style={styles.badgeRow}>
        <TypeBadge type={selected.type} />
        <RegionBadge region={selected.region} />
      </View>
      <Card style={styles.confirmNote}>
        <Text style={styles.confirmNoteText}>
          {selected.name} will start at Lv.5 and join your adventure. You can evolve it later using the correct stone!
        </Text>
      </Card>
      {error ? (
        <View style={styles.inlineError}>
          <Text style={styles.inlineErrorText}>{error}</Text>
        </View>
      ) : null}
      <Pressable
        style={[styles.confirmButton, isSaving && styles.disabledButton]}
        disabled={isSaving}
        onPress={() => onSelect(selected)}
      >
        <Text style={styles.confirmButtonText}>{isSaving ? 'Saving...' : `Begin with ${selected.name}`}</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} disabled={isSaving} onPress={() => setStep('pick')}>
        <Text style={styles.secondaryButtonText}>Choose another</Text>
      </Pressable>
    </ScrollView>
  );
}

interface PokedexPokemonDetails extends PokemonData {
  moves: string[];
  evs: string;
  nature: string;
  level: number;
  ability: string;
}

function PokedexScreen({ ownedPokemon }: { ownedPokemon: OwnedPokemon[] }) {
  const [caughtPokemon, setCaughtPokemon] = useState<PokedexPokemonDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    async function fetchPokemon() {
      try {
        const ownedIds = Array.from(new Set(ownedPokemon.map(owned => owned.pokemonDataId)));
        
        const fetchedData = await Promise.all(
          ownedIds.map(async (idStr) => {
            const numId = parseInt(idStr, 10);
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${numId}`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            
            const typeName = data.types[0].type.name;
            const capitalizedType = typeName.charAt(0).toUpperCase() + typeName.slice(1);
            const capitalizedName = data.name.charAt(0).toUpperCase() + data.name.slice(1);
            
            let region = 'Unknown';
            if (numId <= 151) region = 'Kanto';
            else if (numId <= 251) region = 'Johto';
            else if (numId <= 386) region = 'Hoenn';
            else if (numId <= 493) region = 'Sinnoh';
            else if (numId <= 649) region = 'Unova';
            else if (numId <= 721) region = 'Kalos';
            else if (numId <= 809) region = 'Alola';
            else if (numId <= 898) region = 'Galar';
            else region = 'Paldea';

            // Extract moves (up to 4)
            const moves = (data.moves ?? [])
              .slice(0, 4)
              .map((m: any) => m.move.name.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));

            // Extract level from ownedPokemon
            const matchingOwned = ownedPokemon.find(owned => owned.pokemonDataId === idStr);
            const level = matchingOwned ? matchingOwned.level : 100;

            // Generate EVs based on base stats
            const parsedStats = (data.stats ?? []).map((s: any) => ({
              name: s.stat.name,
              base: s.base_stat
            }));
            const sortedStats = [...parsedStats].sort((a, b) => b.base - a.base);
            
            const top1 = sortedStats[0]?.name || 'special-attack';
            const top2 = sortedStats[1]?.name || 'speed';
            
            const evNames: Record<string, string> = {
              'hp': 'HP',
              'attack': 'Atk',
              'defense': 'Def',
              'special-attack': 'SpA',
              'special-defense': 'SpD',
              'speed': 'Spe'
            };
            
            const mainStat1 = evNames[top1] || 'SpA';
            const mainStat2 = evNames[top2] || 'Spe';
            const remainingStat = Object.values(evNames).find(v => v !== mainStat1 && v !== mainStat2) || 'HP';
            
            const evs = `252 ${mainStat1} / 252 ${mainStat2} / 4 ${remainingStat}`;

            // Determine nature
            let nature = 'Serious';
            if (top1 === 'special-attack' || top2 === 'special-attack') {
              nature = (top1 === 'speed' || top2 === 'speed') ? 'Timid' : 'Modest';
            } else if (top1 === 'attack' || top2 === 'attack') {
              nature = (top1 === 'speed' || top2 === 'speed') ? 'Jolly' : 'Adamant';
            } else if (top1 === 'defense' || top2 === 'defense') {
              nature = 'Bold';
            } else if (top1 === 'special-defense' || top2 === 'special-defense') {
              nature = 'Calm';
            }

            // Extract ability
            const abilityRaw = data.abilities?.[0]?.ability?.name || 'Blaze';
            const ability = abilityRaw.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

            return {
              id: idStr,
              name: capitalizedName,
              type: capitalizedType,
              region: region,
              spriteId: numId,
              evolutionStage: 1,
              moves,
              level,
              evs,
              nature,
              ability
            } as PokedexPokemonDetails;
          })
        );
        
        setCaughtPokemon(fetchedData);
      } catch (error) {
        console.error("Error fetching from PokeAPI", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPokemon();
  }, [ownedPokemon]);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(x => x !== id));
    } else {
      if (selectedIds.length >= 6) {
        alert("You can only select up to 6 Pokémon for your Showdown team.");
        return;
      }
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const generateShowdownText = () => {
    return selectedIds
      .map(id => {
        const pokemon = caughtPokemon.find(p => p.id === id);
        if (!pokemon) return '';
        
        const movesText = (pokemon.moves && pokemon.moves.length > 0)
          ? pokemon.moves.map(m => `- ${m}`).join('\n')
          : '- Tackle\n- Growl';
          
        return `${pokemon.name}
Ability: ${pokemon.ability || 'Blaze'}
Level: ${pokemon.level || 100}
EVs: ${pokemon.evs || '252 HP / 252 SpA / 4 SpD'}
${pokemon.nature || 'Serious'} Nature
${movesText}`;
      })
      .filter(Boolean)
      .join('\n\n');
  };

  if (loading) {
    return (
      <View style={[styles.pageContent, { alignItems: 'center', paddingTop: 40 }]}>
        <Text style={styles.muted}>Loading Pokédex from PokeAPI...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={caughtPokemon}
        keyExtractor={pokemon => pokemon.id}
        contentContainerStyle={[styles.pageContent, selectedIds.length > 0 && { paddingBottom: 100 }]}
        renderItem={({ item }) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <Pressable onPress={() => toggleSelect(item.id)}>
              <PokemonListCard pokemon={item}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {isSelected ? (
                    <View style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: '#2563EB',
                      borderWidth: 2,
                      borderColor: '#2563EB',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
                    </View>
                  ) : (
                    <View style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: '#94A3B8',
                      backgroundColor: 'transparent'
                    }} />
                  )}
                  <Text style={styles.ownedText}>
                    {isSelected ? 'Selected' : 'Owned'}
                  </Text>
                </View>
              </PokemonListCard>
            </Pressable>
          );
        }}
      />

      {selectedIds.length > 0 && (
        <View style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 2,
          borderColor: '#E2E8F0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 5
        }}>
          <View>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1E293B' }}>Showdown Team</Text>
            <Text style={{ fontSize: 12, color: '#64748B' }}>{selectedIds.length} / 6 selected</Text>
          </View>
          <Pressable
            onPress={() => setModalVisible(true)}
            style={{
              backgroundColor: '#2563EB',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 12
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>Export Showdown</Text>
          </Pressable>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            padding: 24,
            width: '100%',
            maxWidth: 500,
            maxHeight: '80%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 15,
            elevation: 10
          }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginBottom: 8, textAlign: 'center' }}>
              Showdown Team Export
            </Text>
            <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 16, textAlign: 'center' }}>
              Select and copy the team below to import directly into Pokémon Showdown!
            </Text>

            <ScrollView style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1.5,
              borderColor: '#E2E8F0',
              marginBottom: 20
            }}>
              <TextInput
                multiline={true}
                editable={false}
                value={generateShowdownText()}
                style={{
                  fontFamily: 'monospace',
                  fontSize: 14,
                  color: '#334155'
                }}
              />
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end' }}>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={{
                  backgroundColor: '#E2E8F0',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 12
                }}
              >
                <Text style={{ color: '#475569', fontSize: 14, fontWeight: 'bold' }}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StoreScreen({
  coins,
  inventory,
  onBuy,
  error,
  buyingItem,
}: {
  coins: number;
  inventory: Record<string, number>;
  onBuy: (item: StoreItem) => void;
  error: string;
  buyingItem: string;
}) {
  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <Card style={styles.storeHeader}>
        <Text style={styles.sectionLabel}>Trainer Coins</Text>
        <CoinDisplay coins={coins} />
      </Card>
      {error ? (
        <View style={styles.inlineError}>
          <Text style={styles.inlineErrorText}>{error}</Text>
        </View>
      ) : null}
      {STORE_ITEMS.filter(item => !item.isBadge).map(item => {
        const canBuy = coins >= item.price;
        const isBuying = buyingItem === item.name;
        return (
          <Card key={item.name} style={styles.itemCard}>
            <StoreItemIcon item={item} />
            <View style={styles.flexOne}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.smallMuted}>{item.description}</Text>
              <Text style={styles.smallMuted}>Owned: {inventory[item.name] ?? 0}</Text>
            </View>
            <Pressable
              style={[styles.buyButton, (!canBuy || isBuying) && styles.disabledButton]}
              disabled={!canBuy || isBuying}
              onPress={() => onBuy(item)}
            >
              <Text style={styles.buyButtonText}>{isBuying ? '...' : item.price}</Text>
            </Pressable>
          </Card>
        );
      })}
    </ScrollView>
  );
}

function InventoryScreen({
  inventory,
  ownedPokemon,
  onEvolve,
  error,
}: {
  inventory: Record<string, number>;
  ownedPokemon: OwnedPokemon[];
  onEvolve: (owned: OwnedPokemon, nextId: string, stone: string, currentName: string, nextName: string) => void;
  error: string;
}) {
  const [selectedStone, setSelectedStone] = useState<StoreItem | null>(null);
  const items = STORE_ITEMS.filter(item => (inventory[item.name] ?? 0) > 0);
  if (!items.length) return <InfoScreen icon="🎒" title="Empty Bag" message="Buy items from the store to fill your inventory." />;

  const evolutionCandidates = selectedStone
    ? ownedPokemon
        .map(owned => {
          const pokemon = getPokemonById(owned.pokemonDataId);
          const next = pokemon?.evolvesTo ? getPokemonById(pokemon.evolvesTo) : null;
          const requiredLevel = pokemon ? getEvolutionLevel(pokemon.evolutionStage) : null;
          return { owned, pokemon, next, requiredLevel };
        })
        .filter(
          (entry): entry is {
            owned: OwnedPokemon;
            pokemon: PokemonData;
            next: PokemonData;
            requiredLevel: number;
          } =>
            !!entry.pokemon &&
            !!entry.next &&
            entry.requiredLevel !== null &&
            entry.pokemon.requiredStone === selectedStone.name &&
            entry.owned.level >= entry.requiredLevel,
        )
    : [];

  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      {error ? (
        <View style={styles.inlineError}>
          <Text style={styles.inlineErrorText}>{error}</Text>
        </View>
      ) : null}
      {selectedStone ? (
        <Card style={styles.evolutionPicker}>
          <View style={styles.evolutionPickerHeader}>
            <View>
              <Text style={styles.sectionLabel}>Use {selectedStone.name}</Text>
              <Text style={styles.smallMuted}>Eligible Pokémon only</Text>
            </View>
            <Pressable style={styles.secondaryMiniButton} onPress={() => setSelectedStone(null)}>
              <Text style={styles.secondaryMiniButtonText}>Close</Text>
            </Pressable>
          </View>

          {evolutionCandidates.length > 0 ? (
            <View style={styles.candidateList}>
              {evolutionCandidates.map(({ owned, pokemon, next, requiredLevel }) => (
                <Pressable
                  key={owned.id}
                  style={styles.evolutionCandidate}
                  onPress={() => {
                    onEvolve(owned, next.id, selectedStone.name, pokemon.name, next.name);
                    setSelectedStone(null);
                  }}
                >
                  <PokemonSprite pokemon={pokemon} size={56} />
                  <View style={styles.flexOne}>
                    <View style={styles.nameRow}>
                      <Text style={styles.cardTitle}>{pokemon.name}</Text>
                      <LevelBadge level={owned.level} />
                    </View>
                    <Text style={styles.smallMuted}>Evolves to {next.name} at Lv.{requiredLevel}</Text>
                    <View style={styles.badgeRow}>
                      <TypeBadge type={pokemon.type} />
                    </View>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.emptyInline}>
              <Text style={styles.emptyInlineText}>No eligible Pokémon for {selectedStone.name} yet.</Text>
            </View>
          )}
        </Card>
      ) : null}
      {items.map(item => (
        <Card key={item.name} style={styles.itemCard}>
          <StoreItemIcon item={item} />
          <View style={styles.flexOne}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.smallMuted}>Quantity: {inventory[item.name]}</Text>
          </View>
          {item.isStone ? (
            <Pressable style={styles.selectButton} onPress={() => setSelectedStone(item)}>
              <Text style={styles.selectButtonText}>Use Item</Text>
            </Pressable>
          ) : null}
        </Card>
      ))}
    </ScrollView>
  );
}

function RewardingScreen({
  gymLeaderName,
  onLogout,
}: {
  gymLeaderName: string;
  onLogout: () => void;
}) {
  const [recipientName, setRecipientName] = useState('');
  const [rewardError, setRewardError] = useState('');
  const [rewardSuccess, setRewardSuccess] = useState('');
  const [isRewarding, setIsRewarding] = useState(false);

  const gymNum = gymLeaderName.match(/^Gym([1-5])$/i)?.[1] || '1';
  const badgeName = `Badge ${gymNum}`;

  // Custom Gym Leader Visual Themes matching Kanto Gym Badges
  const GYM_COLORS: Record<string, { bg: string; shadow: string }> = {
    '1': { bg: '#4A5568', shadow: '#2D3748' }, // Boulder Badge - Rock Slate
    '2': { bg: '#3182CE', shadow: '#1A365D' }, // Cascade Badge - Water Blue
    '3': { bg: '#D69E2E', shadow: '#744210' }, // Thunder Badge - Lightning Gold
    '4': { bg: '#38A169', shadow: '#22543D' }, // Rainbow Badge - Grass Green
    '5': { bg: '#D53F8C', shadow: '#702459' }, // Soul Badge - Magenta/Poison Pink
  };

  const colors = GYM_COLORS[gymNum] || GYM_COLORS['1'];

  const handleReward = async () => {
    if (!recipientName.trim()) {
      setRewardError('Please enter a trainer name.');
      setRewardSuccess('');
      return;
    }

    setIsRewarding(true);
    setRewardError('');
    setRewardSuccess('');

    try {
      const result = await rewardBadgeToPlayer(recipientName.trim(), badgeName);
      setRewardSuccess(`Successfully rewarded ${badgeName} to ${result.playerName}!`);
      setRecipientName('');
    } catch (err) {
      setRewardError(getErrorMessage(err));
    } finally {
      setIsRewarding(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <Card style={styles.rewardCard}>
        <Text style={styles.gymTitle}>{gymLeaderName} Leader Panel</Text>
        <Text style={styles.gymSubtitle}>Reward trainers with the prestigious {badgeName}</Text>
        
        <View style={styles.badgeShowcase}>
          <PixelBadge name={badgeName} size={80} />
          <Text style={styles.badgeShowcaseText}>{badgeName}</Text>
        </View>

        {rewardError ? (
          <View style={styles.inlineError}>
            <Text style={styles.inlineErrorText}>{rewardError}</Text>
          </View>
        ) : null}

        {rewardSuccess ? (
          <View style={styles.inlineSuccess}>
            <Text style={styles.inlineSuccessText}>{rewardSuccess}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Trainer Username</Text>
          <TextInput
            value={recipientName}
            onChangeText={setRecipientName}
            placeholder="e.g. Ash, Misty, Brock..."
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            editable={!isRewarding}
          />
        </View>

        <Pressable
          style={[
            styles.grantButton,
            { backgroundColor: colors.bg, shadowColor: colors.shadow },
            isRewarding && styles.disabledButton,
          ]}
          onPress={handleReward}
          disabled={isRewarding}
        >
          <Text style={styles.grantButtonText}>
            {isRewarding ? 'Rewarding...' : `Grant ${badgeName}`}
          </Text>
        </Pressable>

        <Pressable style={styles.leaderLogoutButton} onPress={onLogout}>
          <Text style={styles.leaderLogoutButtonText}>Logout Leader Panel</Text>
        </Pressable>
      </Card>
    </ScrollView>
  );
}

function toTitleCase(str: string): string {
  return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function findNextEvolutionInChain(chain: any, currentSpeciesName: string): { name: string; url: string; item: string | null } | null {
  const current = currentSpeciesName.toLowerCase();
  
  if (chain.species.name === current) {
    if (chain.evolves_to && chain.evolves_to.length > 0) {
      const next = chain.evolves_to[0];
      const details = next.evolution_details?.[0] || null;
      const itemName = details?.item?.name || null;
      return {
        name: next.species.name,
        url: next.species.url,
        item: itemName ? toTitleCase(itemName) : null
      };
    }
    return null;
  }
  
  if (chain.evolves_to) {
    for (const child of chain.evolves_to) {
      const result = findNextEvolutionInChain(child, currentSpeciesName);
      if (result) return result;
    }
  }
  
  return null;
}

function findStageInChain(chain: any, currentSpeciesName: string, currentStage = 1): number {
  const current = currentSpeciesName.toLowerCase();
  if (chain.species.name === current) {
    return currentStage;
  }
  if (chain.evolves_to) {
    for (const child of chain.evolves_to) {
      const stage = findStageInChain(child, currentSpeciesName, currentStage + 1);
      if (stage > 0) return stage;
    }
  }
  return 0;
}

function EvolutionScreen({
  inventory,
  ownedPokemon,
  onEvolve,
  error,
}: {
  inventory: Record<string, number>;
  ownedPokemon: OwnedPokemon[];
  onEvolve: (owned: OwnedPokemon, nextId: string, stone: string, currentName: string, nextName: string) => void;
  error: string;
}) {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCandidates() {
      try {
        const list: any[] = [];
        
        for (const owned of ownedPokemon) {
          const local = getPokemonById(owned.pokemonDataId);
          if (local) {
            if (local.evolvesTo) {
              const next = getPokemonById(local.evolvesTo);
              const stone = local.requiredStone ?? '';
              const requiredLevel = getEvolutionLevel(local.evolutionStage);
              list.push({
                owned,
                pokemon: local,
                next: next ? { id: next.id, name: next.name } : null,
                stone,
                requiredLevel,
              });
            }
            continue;
          }

          const numId = parseInt(owned.pokemonDataId, 10);
          const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${numId}`);
          if (!res.ok) continue;
          const pokeData = await res.json();

          const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${numId}`);
          if (!speciesRes.ok) continue;
          const speciesData = await speciesRes.json();

          const chainUrl = speciesData.evolution_chain?.url;
          if (!chainUrl) continue;

          const chainRes = await fetch(chainUrl);
          if (!chainRes.ok) continue;
          const chainData = await chainRes.json();

          const nextEv = findNextEvolutionInChain(chainData.chain, pokeData.name);
          if (!nextEv) continue;

          const match = nextEv.url.match(/\/pokemon-species\/(\d+)\//);
          if (!match) continue;
          const nextPokedexId = String(parseInt(match[1], 10)).padStart(3, '0');

          const typeName = pokeData.types[0].type.name;
          const capitalizedType = typeName.charAt(0).toUpperCase() + typeName.slice(1);
          
          const stone = nextEv.item || '';
          const stage = findStageInChain(chainData.chain, pokeData.name);
          const requiredLevel = getEvolutionLevel(stage);
          
          const capitalizedName = pokeData.name.charAt(0).toUpperCase() + pokeData.name.slice(1);
          const capitalizedNextName = nextEv.name.charAt(0).toUpperCase() + nextEv.name.slice(1);

          list.push({
            owned,
            pokemon: {
              id: owned.pokemonDataId,
              name: capitalizedName,
              type: capitalizedType,
              spriteId: numId,
              evolutionStage: stage,
              requiredStone: stone || undefined,
            },
            next: {
              id: nextPokedexId,
              name: capitalizedNextName,
            },
            stone,
            requiredLevel,
          });
        }
        
        setCandidates(list);
      } catch (error) {
        console.error("Error loading evolution candidates:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCandidates();
  }, [ownedPokemon]);

  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      {error ? (
        <View style={styles.inlineError}>
          <Text style={styles.inlineErrorText}>{error}</Text>
        </View>
      ) : null}
      {loading ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={styles.smallMuted}>Loading evolution data from PokeAPI...</Text>
        </View>
      ) : candidates.length === 0 ? (
        <InfoScreen icon="✨" title="No Evolutions" message="Choose or catch Pokémon that can evolve." />
      ) : (
        candidates.map(({ owned, pokemon, next, stone, requiredLevel }) => {
          const hasStone = !stone || (inventory[stone] ?? 0) > 0;
          const meetsLevel = requiredLevel !== null && owned.level >= requiredLevel;
          const canEvolve = meetsLevel && hasStone;
          
          return (
            <Card key={owned.id} style={styles.itemCard}>
              <PokemonSprite pokemon={pokemon} size={62} />
              <View style={styles.flexOne}>
                <Text style={styles.cardTitle}>{pokemon.name}</Text>
                <Text style={styles.smallMuted}>
                  Evolves to {next?.name ?? 'Unknown'} {stone ? `with ${stone}` : 'directly'}
                </Text>
                {requiredLevel !== null ? (
                  <Text style={styles.smallMuted}>Required Lv.{requiredLevel} · Current Lv.{owned.level}</Text>
                ) : null}
                {stone ? (
                  <Text style={styles.smallMuted}>Owned {stone}: {inventory[stone] ?? 0}</Text>
                ) : (
                  <Text style={styles.smallMuted}>No evolution stone required</Text>
                )}
              </View>
              <Pressable
                style={[styles.selectButton, !canEvolve && styles.disabledButton]}
                disabled={!canEvolve || !next}
                onPress={() => next && onEvolve(owned, next.id, stone, pokemon.name, next.name)}
              >
                <Text style={styles.selectButtonText}>Evolve</Text>
              </Pressable>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

function HistoryScreen({ history }: { history: HistoryEntry[] }) {
  if (!history.length) return <InfoScreen icon="📜" title="No History" message="Your journey log will appear here." />;
  return (
    <FlatList
      data={history}
      keyExtractor={entry => entry.id}
      contentContainerStyle={styles.pageContent}
      renderItem={({ item }) => (
        <Card style={styles.historyCard}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.smallMuted}>{item.detail}</Text>
          <Text style={styles.timestamp}>{item.createdAt}</Text>
        </Card>
      )}
    />
  );
}

function InfoScreen({ icon, title, message }: { icon: string; title: string; message: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

function PokemonListCard({ pokemon, children }: { pokemon: PokemonData; children?: React.ReactNode }) {
  const colors = getTypeColor(pokemon.type);
  return (
    <Card style={[styles.pokemonCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <PokemonSprite pokemon={pokemon} size={66} />
      <View style={styles.flexOne}>
        <Text style={styles.cardTitle}>{pokemon.name}</Text>
        <Text style={[styles.typeLine, { color: colors.text }]}>
          #{pokemon.id} · {pokemon.region}
        </Text>
        <TypeBadge type={pokemon.type} />
      </View>
      {children}
    </Card>
  );
}

function Header({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
      ) : (
        <View style={styles.backButton} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

function BottomNav({ current, onNavigate }: { current: Page; onNavigate: (page: Page) => void }) {
  return (
    <View style={styles.bottomNav}>
      {navItems.map(item => {
        const active = current === item.page || (current === 'starter' && item.page === 'dashboard');
        return (
          <Pressable
            key={item.page}
            style={[styles.navItem, active && styles.activeNavItem]}
            onPress={() => onNavigate(item.page)}
          >
            <item.Icon size={24} color={active ? '#CC0000' : '#64748B'} strokeWidth={2.5} />
            <Text style={[styles.navLabel, active && styles.activeNavLabel]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function PokemonSprite({ pokemon, size }: { pokemon: PokemonData; size: number }) {
  return (
    <Image
      source={{ uri: getSpriteUrl(pokemon.spriteId) }}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

function FloatingSprite({ pokemon, size }: { pokemon: PokemonData; size: number }) {
  return (
    <FloatingView distance={8} duration={2600}>
      <PokemonSprite pokemon={pokemon} size={size} />
    </FloatingView>
  );
}

function TypeBadge({ type }: { type: string }) {
  const colors = getTypeColor(type);
  return (
    <View style={[styles.typeBadge, { backgroundColor: colors.badge }]}>
      <Text style={styles.typeBadgeText}>{type}</Text>
    </View>
  );
}

function RegionBadge({ region }: { region: string }) {
  const colors: Record<string, string> = {
    Kanto: '#CC0000',
    Unova: '#003A70',
    Paldea: '#7B2D8B',
  };
  return (
    <View style={[styles.typeBadge, { backgroundColor: colors[region] ?? '#555' }]}>
      <Text style={styles.typeBadgeText}>{region}</Text>
    </View>
  );
}

function LevelBadge({ level }: { level: number }) {
  return (
    <View style={styles.levelBadge}>
      <Text style={styles.levelBadgeText}>Lv.{level}</Text>
    </View>
  );
}

function CoinDisplay({ coins }: { coins: number }) {
  return (
    <View style={styles.coinDisplay}>
      <CircleDollarSign size={22} color="#B7791F" strokeWidth={2.5} />
      <Text style={styles.coinText}>{coins}</Text>
    </View>
  );
}

const BADGE_DESIGNS: Record<string, { colors: Record<string, string>; grid: string[][] }> = {
  'badge 1': {
    colors: {
      '.': 'transparent',
      'X': '#1A202C', // Outline/Black border
      'G': '#A0AEC0', // Rock Grey base
      'L': '#E2E8F0', // Grey highlight
      'D': '#4A5568', // Grey shadow
    },
    grid: [
      ['.', '.', '.', 'X', 'X', 'X', 'X', '.', '.', '.'],
      ['.', '.', 'X', 'L', 'L', 'L', 'L', 'X', '.', '.'],
      ['.', 'X', 'L', 'G', 'G', 'G', 'G', 'D', 'X', '.'],
      ['X', 'L', 'G', 'G', 'G', 'G', 'G', 'D', 'D', 'X'],
      ['X', 'L', 'G', 'G', 'G', 'G', 'G', 'D', 'D', 'X'],
      ['X', 'L', 'G', 'G', 'G', 'G', 'G', 'D', 'D', 'X'],
      ['X', 'L', 'G', 'G', 'G', 'G', 'G', 'D', 'D', 'X'],
      ['.', 'X', 'D', 'D', 'D', 'D', 'D', 'D', 'X', '.'],
      ['.', '.', 'X', 'D', 'D', 'D', 'D', 'X', '.', '.'],
      ['.', '.', '.', 'X', 'X', 'X', 'X', '.', '.', '.'],
    ]
  },
  'badge 2': {
    colors: {
      '.': 'transparent',
      'X': '#0B3C5D', // Dark Blue Outline
      'B': '#3182CE', // Water Blue base
      'L': '#90CDF4', // Light Blue highlight
      'D': '#1A365D', // Water Blue shadow
    },
    grid: [
      ['.', '.', '.', '.', 'X', 'X', '.', '.', '.', '.'],
      ['.', '.', '.', 'X', 'L', 'B', 'X', '.', '.', '.'],
      ['.', '.', '.', 'X', 'L', 'B', 'X', '.', '.', '.'],
      ['.', '.', 'X', 'L', 'B', 'B', 'D', 'X', '.', '.'],
      ['.', '.', 'X', 'L', 'B', 'B', 'D', 'X', '.', '.'],
      ['.', 'X', 'L', 'B', 'B', 'B', 'D', 'D', 'X', '.'],
      ['.', 'X', 'L', 'B', 'B', 'B', 'D', 'D', 'X', '.'],
      ['X', 'L', 'B', 'B', 'B', 'B', 'D', 'D', 'D', 'X'],
      ['.', 'X', 'D', 'D', 'D', 'D', 'D', 'D', 'X', '.'],
      ['.', '.', 'X', 'X', 'X', 'X', 'X', 'X', '.', '.'],
    ]
  },
  'badge 3': {
    colors: {
      '.': 'transparent',
      'X': '#7B341E', // Dark copper/red outline
      'Y': '#ECC94B', // Yellow base
      'O': '#DD6B20', // Orange shadow
      'W': '#FFF9DB', // White/yellow highlight
    },
    grid: [
      ['.', '.', '.', 'X', 'X', 'X', 'X', '.', '.', '.'],
      ['.', '.', 'X', 'W', 'W', 'Y', 'Y', 'X', '.', '.'],
      ['.', 'X', 'W', 'Y', 'Y', 'Y', 'O', 'O', 'X', '.'],
      ['X', 'W', 'Y', 'Y', 'Y', 'Y', 'O', 'O', 'O', 'X'],
      ['X', 'Y', 'Y', 'W', 'Y', 'Y', 'O', 'O', 'O', 'X'],
      ['X', 'Y', 'Y', 'Y', 'W', 'Y', 'O', 'O', 'O', 'X'],
      ['X', 'O', 'O', 'Y', 'Y', 'O', 'O', 'O', 'O', 'X'],
      ['.', 'X', 'O', 'O', 'O', 'O', 'O', 'O', 'X', '.'],
      ['.', '.', 'X', 'O', 'O', 'O', 'O', 'X', '.', '.'],
      ['.', '.', '.', 'X', 'X', 'X', 'X', '.', '.', '.'],
    ]
  },
  'badge 4': {
    colors: {
      '.': 'transparent',
      'X': '#1C1917', // Black outline
      'R': '#E53E3E', // Red
      'O': '#ED8936', // Orange
      'Y': '#ECC94B', // Yellow
      'G': '#48BB78', // Green
      'B': '#3182CE', // Blue
      'P': '#805AD5', // Purple
    },
    grid: [
      ['.', '.', 'X', 'X', 'X', 'X', 'X', 'X', '.', '.'],
      ['.', 'X', 'R', 'R', 'O', 'O', 'Y', 'Y', 'X', '.'],
      ['X', 'R', 'R', 'R', 'O', 'O', 'Y', 'Y', 'Y', 'X'],
      ['X', 'R', 'R', 'G', 'G', 'G', 'G', 'Y', 'Y', 'X'],
      ['X', 'P', 'P', 'G', 'G', 'G', 'G', 'B', 'B', 'X'],
      ['X', 'P', 'P', 'G', 'G', 'G', 'G', 'B', 'B', 'X'],
      ['X', 'P', 'P', 'P', 'B', 'B', 'B', 'B', 'B', 'X'],
      ['X', 'P', 'P', 'P', 'B', 'B', 'B', 'B', 'B', 'X'],
      ['.', 'X', 'P', 'P', 'P', 'B', 'B', 'B', 'X', '.'],
      ['.', '.', 'X', 'X', 'X', 'X', 'X', 'X', '.', '.'],
    ]
  },
  'badge 5': {
    colors: {
      '.': 'transparent',
      'X': '#4C0519', // Dark Rose outline
      'M': '#D53F8C', // Magenta/pink base
      'L': '#F687B3', // Light pink highlight
      'P': '#805AD5', // Purple shadow
    },
    grid: [
      ['.', '.', 'X', 'X', '.', '.', 'X', 'X', '.', '.'],
      ['.', 'X', 'L', 'L', 'X', 'X', 'L', 'L', 'X', '.'],
      ['X', 'L', 'M', 'M', 'M', 'M', 'M', 'M', 'M', 'X'],
      ['X', 'L', 'M', 'M', 'M', 'M', 'M', 'M', 'M', 'X'],
      ['X', 'M', 'M', 'M', 'M', 'M', 'M', 'M', 'P', 'X'],
      ['.', 'X', 'M', 'M', 'M', 'M', 'M', 'P', 'X', '.'],
      ['.', '.', 'X', 'M', 'M', 'M', 'P', 'X', '.', '.'],
      ['.', '.', '.', 'X', 'M', 'P', 'X', '.', '.', '.'],
      ['.', '.', '.', '.', 'X', 'X', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.', '.', '.'],
    ]
  }
};

function PixelBadge({ name, size = 30 }: { name: string; size?: number }) {
  const badgeKey = name.toLowerCase().trim();
  const design = BADGE_DESIGNS[badgeKey] || BADGE_DESIGNS['badge 1'];

  const rows = design.grid.length;
  const cols = design.grid[0].length;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${cols} ${rows}`}>
      {design.grid.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          const color = design.colors[cell];
          if (color === 'transparent') return null;
          return (
            <Rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx}
              y={rIdx}
              width={1}
              height={1}
              fill={color}
            />
          );
        })
      )}
    </Svg>
  );
}

function StoreItemIcon({ item }: { item: StoreItem }) {
  const iconProps = { size: 30, strokeWidth: 2.4 };
  let icon = <Sparkles {...iconProps} color="#805AD5" />;
  let backgroundColor = '#FAF5FF';

  if (item.isBadge || item.name.toLowerCase().includes('badge')) {
    icon = <PixelBadge name={item.name} size={32} />;
    backgroundColor = '#F7FAFC';
  } else if (item.name.includes('Fire')) {
    icon = <Flame {...iconProps} color="#FF6B35" />;
    backgroundColor = '#FFF0EB';
  } else if (item.name.includes('Water')) {
    icon = <Waves {...iconProps} color="#4A90E2" />;
    backgroundColor = '#EBF4FF';
  } else if (item.name.includes('Leaf')) {
    icon = <Leaf {...iconProps} color="#38A169" />;
    backgroundColor = '#F0FFF4';
  } else if (item.name.includes('Thunder')) {
    icon = <Zap {...iconProps} color="#D69E2E" />;
    backgroundColor = '#FFFFF0';
  } else if (item.name.includes('Moon')) {
    icon = <Moon {...iconProps} color="#6B46C1" />;
    backgroundColor = '#F5F3FF';
  } else if (item.name.includes('Sun')) {
    icon = <Sun {...iconProps} color="#D69E2E" />;
    backgroundColor = '#FFFBEB';
  } else if (item.name.includes('Ice')) {
    icon = <Snowflake {...iconProps} color="#2B6CB0" />;
    backgroundColor = '#EBF8FF';
  } else if (item.name.includes('Shiny') || item.name.includes('Dusk') || item.name.includes('Dawn')) {
    icon = <Sparkles {...iconProps} color="#805AD5" />;
    backgroundColor = '#FAF5FF';
  }

  return <View style={[styles.itemIconBox, { backgroundColor }]}>{icon}</View>;
}

function EvolutionAnimation({
  from,
  to,
  onDone,
}: {
  from: PokemonData;
  to: PokemonData;
  onDone: () => void;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(progress, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(burst, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(reveal, {
          toValue: 1,
          duration: 750,
          delay: 180,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        setTimeout(onDone, 900);
      }
    });

    return () => animation.stop();
  }, [burst, onDone, progress, reveal]);

  const fromOpacity = progress.interpolate({
    inputRange: [0, 0.24, 0.42, 0.6, 0.78, 1],
    outputRange: [1, 0.22, 1, 0.16, 0.9, 0],
  });
  const fromScale = progress.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [1, 1.35, 0.35],
  });
  const glowScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1.85],
  });
  const glowOpacity = progress.interpolate({
    inputRange: [0, 0.35, 0.75, 1],
    outputRange: [0.25, 0.75, 0.95, 0.05],
  });
  const burstScale = burst.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 2.8],
  });
  const burstOpacity = burst.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 1, 0],
  });
  const toScale = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1],
  });
  const toOpacity = reveal.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <View style={styles.evolutionOverlay}>
      <Animated.View style={[styles.evolutionGlow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
      <Animated.View style={[styles.evolutionBurstRing, { opacity: burstOpacity, transform: [{ scale: burstScale }] }]} />
      <Animated.View style={[styles.evolutionBurstRing, styles.evolutionBurstRingSecond, { opacity: burstOpacity, transform: [{ scale: burstScale }] }]} />

      {Array.from({ length: 12 }).map((_, index) => {
        const angle = (Math.PI * 2 * index) / 12;
        const distance = 118 + (index % 3) * 18;
        const translateX = burst.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(angle) * distance],
        });
        const translateY = burst.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(angle) * distance],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.evolutionSpark,
              {
                opacity: burstOpacity,
                transform: [{ translateX }, { translateY }, { scale: burstScale }],
              },
            ]}
          />
        );
      })}

      <View style={styles.evolutionStage}>
        <Animated.View style={[styles.evolutionSpriteWrap, { opacity: fromOpacity, transform: [{ scale: fromScale }] }]}>
          <PokemonSprite pokemon={from} size={150} />
        </Animated.View>
        <Animated.View style={[styles.evolutionSpriteWrap, styles.evolutionRevealSprite, { opacity: toOpacity, transform: [{ scale: toScale }] }]}>
          <PokemonSprite pokemon={to} size={176} />
        </Animated.View>
      </View>

      <Animated.View style={[styles.evolutionTextBox, { opacity: toOpacity }]}>
        <Text style={styles.evolutionTitle}>{to.name}</Text>
        <Text style={styles.evolutionSubtitle}>Evolution complete!</Text>
      </Animated.View>
    </View>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function FadeInView({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 520,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 520,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

function FloatingView({
  children,
  delay = 0,
  distance = 20,
  duration = 3000,
  reverse = false,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  duration?: number;
  reverse?: boolean;
  style?: any;
}) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(value, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [delay, distance, duration, value]);

  const translateY = value.interpolate({
    inputRange: [0, 1],
    outputRange: [0, reverse ? distance : -distance],
  });

  return <Animated.View style={[style, { transform: [{ translateY }] }]}>{children}</Animated.View>;
}

function FloatingText({
  children,
  delay,
  reverse,
  style,
}: {
  children: React.ReactNode;
  delay: number;
  reverse?: boolean;
  style?: any;
}) {
  return (
    <FloatingView delay={delay} reverse={reverse} style={style}>
      <Text style={styles.floatText}>{children}</Text>
    </FloatingView>
  );
}

function SpinImage({ source, style }: { source: ImageSourcePropType; style?: any }) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return <Animated.Image source={source} style={[style, { transform: [{ rotate }] }]} />;
}

function PulseView({ children, style }: { children: React.ReactNode; style?: any }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [scale]);

  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}

function PokeballTransition() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 35,
        duration: 1150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 1150,
        delay: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
      Animated.timing(loadingOpacity, {
        toValue: 1,
        duration: 300,
        delay: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, rotation, scale, loadingOpacity]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.Image
        source={pokeballImg}
        style={[styles.transitionBall, { position: 'absolute', opacity, transform: [{ scale }, { rotate }] }]}
      />
      <Animated.View style={{ position: 'absolute', opacity: loadingOpacity, alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        <Image source={pokemonLogo} style={{ width: 240, height: 90, resizeMode: 'contain', marginBottom: 24 }} />
        <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginBottom: 24, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 4 }}>
          Preparing Adventure...
        </Text>
        <ActivityIndicator size="large" color="#FFCB05" />
      </Animated.View>
    </View>
  );
}

function ScalePressable({
  children,
  onPress,
  style,
  disabled,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function typeTextStyle(type: string) {
  if (type === 'Fire') return { color: '#FF6B35' };
  if (type === 'Water') return { color: '#4A90E2' };
  return { color: '#38A169' };
}

function getEvolutionLevel(stage: number): number | null {
  if (stage === 1) return 20;
  if (stage === 2) return 40;
  return null;
}

function titleForPage(page: Page) {
  const titles: Record<Page, string> = {
    start: 'PokéJourney',
    dashboard: 'Dashboard',
    starter: 'Starter Selection',
    pokedex: 'Pokédex',
    store: 'Pokémon Store',
    inventory: 'Inventory',
    evolution: 'Evolution',
    history: 'Game History',
    rewarding: 'Gym Leader Panel',
  };
  return titles[page];
}

const styles = StyleSheet.create({
  grantButton: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 4,
    marginTop: 12,
  },
  grantButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  rewardCard: {
    padding: 32,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#3182CE',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  gymTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  gymSubtitle: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 24,
    textAlign: 'center',
  },
  badgeShowcase: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F7FAFC',
    borderRadius: 20,
    marginBottom: 24,
    width: '100%',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  badgeShowcaseText: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2B6CB0',
  },
  leaderLogoutButton: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#718096',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  leaderLogoutButtonText: {
    color: '#718096',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inlineSuccess: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: '#C6F6D5',
    marginBottom: 16,
    width: '100%',
  },
  inlineSuccessText: {
    color: '#2F855A',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 16,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#E2E8F0',
  },
  phone: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#F8FAFC',
  },
  startScreen: {
    flex: 1,
    justifyContent: 'center',
    gap: 28,
    padding: 24,
    overflow: 'hidden',
    backgroundColor: '#CC0000',
  },
  floatIcon: {
    position: 'absolute',
  },
  floatText: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 34,
  },
  floatOne: { top: 40, left: 24 },
  floatTwo: { top: 82, right: 34, fontSize: 42 },
  floatThree: { bottom: 150, left: 42 },
  floatFour: { bottom: 195, right: 34 },
  floatFive: { top: '32%', left: '25%', fontSize: 26 },
  logoArea: {
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 210,
    height: 84,
  },
  bigBall: {
    width: 98,
    height: 98,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.24)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  brandSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '700',
  },
  startCard: {
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.96)',
    padding: 22,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 30,
    elevation: 8,
  },
  transitionOverlay: {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 99,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#CC0000',
},
  transitionBall: {
    width: 96,
    height: 96,
  },
  muted: {
    color: '#64748B',
    fontSize: 14,
  },
  startHeading: {
    color: '#1F2937',
    fontSize: 20,
    fontWeight: '800',
  },
  inputLabel: {
    marginTop: 6,
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#111827',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FC8181',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  startButton: {
    marginTop: 4,
    borderRadius: 14,
    backgroundColor: '#CC0000',
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#CC0000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 4,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  hintText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
  },
  pageContent: {
    gap: 14,
    padding: 16,
    paddingBottom: 92,
  },
  card: {
    borderWidth: 1,
    borderColor: '#EDF2F7',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 2,
  },
  trainerCard: {
    overflow: 'hidden',
  },
  trainerHeader: {
    minHeight: 88,
    padding: 16,
    backgroundColor: '#CC0000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trainerLabel: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '800',
  },
  trainerName: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
  },
  headerBall: {
    width: 52,
    height: 52,
  },
  statsRow: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statBlock: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  statValue: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '900',
  },
  divider: {
    width: 1,
    height: 34,
    backgroundColor: '#E5E7EB',
  },
  statSpacer: {
    flex: 1,
  },
  starterCard: {
    padding: 16,
  },
  sectionLabel: {
    marginBottom: 8,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  starterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  spriteFrame: {
    borderWidth: 2,
    borderColor: '#FEB2B2',
    borderRadius: 18,
    backgroundColor: '#FFF5F5',
    padding: 8,
  },
  flexOne: {
    flex: 1,
    gap: 5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardTitle: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '900',
  },
  smallMuted: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  chooseStarterButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CC0000',
    borderRadius: 18,
    backgroundColor: '#FFF5F5',
    padding: 18,
    alignItems: 'center',
  },
  chooseStarterText: {
    color: '#CC0000',
    fontSize: 14,
    fontWeight: '900',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 12,
    rowGap: 8,
  },
  featureTile: {
    width: '22%',
    aspectRatio: 1,
    minHeight: 78,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 5,
    paddingVertical: 8,
  },
  featureIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    color: '#4B5563',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 12,
  },
  recentCard: {
    padding: 12,
  },
  recentList: {
    gap: 12,
  },
  recentItem: {
    width: 66,
    alignItems: 'center',
    gap: 4,
  },
  recentName: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyRecent: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRecentText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 2,
  },
  emptyRecentSubtext: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  switchText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  header: {
    minHeight: 56,
    backgroundColor: '#CC0000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 38,
    lineHeight: 38,
    fontWeight: '400',
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 42,
  },
  pokemonCard: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeLine: {
    fontSize: 12,
    fontWeight: '800',
  },
  selectButton: {
    borderRadius: 12,
    backgroundColor: '#CC0000',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selectedButton: {
    backgroundColor: '#805AD5',
  },
  disabledButton: {
    backgroundColor: '#CBD5E1',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  ownedText: {
    color: '#276749',
    fontSize: 12,
    fontWeight: '900',
  },
  unownedText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
  },
  storeHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemCard: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemIcon: {
    fontSize: 30,
  },
  itemIconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButton: {
    minWidth: 58,
    borderRadius: 12,
    backgroundColor: '#276749',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  inlineButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineButtonText: {
    color: '#FFDE00',
    fontSize: 12,
    fontWeight: '900',
  },
  evolutionPicker: {
    padding: 14,
    gap: 12,
  },
  evolutionPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryMiniButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryMiniButtonText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
  },
  candidateList: {
    gap: 10,
  },
  evolutionCandidate: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emptyInline: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    padding: 14,
  },
  emptyInlineText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  evolutionOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 200,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  evolutionStage: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evolutionSpriteWrap: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evolutionRevealSprite: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  evolutionGlow: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFDE00',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 40,
  },
  evolutionBurstRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 5,
    borderColor: '#FFDE00',
  },
  evolutionBurstRingSecond: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderColor: '#FFFFFF',
  },
  evolutionSpark: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFDE00',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
  },
  evolutionTextBox: {
    position: 'absolute',
    bottom: 108,
    alignItems: 'center',
    gap: 4,
  },
  evolutionTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  evolutionSubtitle: {
    color: '#FFDE00',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  historyCard: {
    padding: 15,
    gap: 5,
  },
  timestamp: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 52,
  },
  emptyTitle: {
    color: '#1F2937',
    fontSize: 20,
    fontWeight: '900',
  },
  emptyMessage: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#CC0000',
  },
  questionCard: {
    padding: 20,
    gap: 8,
  },
  questionText: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '900',
  },
  answerCard: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#EDF2F7',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 1,
  },
  answerText: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '800',
  },
  recommendationCard: {
    alignItems: 'center',
    padding: 18,
    gap: 6,
  },
  recommendedType: {
    fontSize: 20,
    fontWeight: '900',
  },
  pickCard: {
    borderWidth: 2,
    borderColor: '#EDF2F7',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 2,
  },
  recommendedBadge: {
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: '#FEF3C7',
    color: '#A16207',
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: '900',
  },
  chevron: {
    color: '#CC0000',
    fontSize: 30,
    fontWeight: '300',
  },
  confirmContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  confirmSpriteFrame: {
    width: 164,
    height: 164,
    borderRadius: 82,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
  },
  confirmName: {
    color: '#1F2937',
    fontSize: 30,
    fontWeight: '900',
  },
  confirmNote: {
    padding: 16,
    maxWidth: 330,
  },
  confirmNoteText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  inlineError: {
    width: '100%',
    maxWidth: 330,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    padding: 12,
  },
  inlineErrorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  confirmButton: {
    width: '100%',
    maxWidth: 330,
    borderRadius: 14,
    backgroundColor: '#CC0000',
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    padding: 8,
  },
  secondaryButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '800',
  },
  levelBadge: {
    borderRadius: 999,
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  levelBadgeText: {
    color: '#FFDE00',
    fontSize: 11,
    fontWeight: '900',
  },
  coinDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinIcon: {
    fontSize: 17,
  },
  coinText: {
    color: '#B7791F',
    fontSize: 16,
    fontWeight: '900',
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 64,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: -6 },
    shadowRadius: 16,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  activeNavItem: {
    backgroundColor: '#FFF5F5',
  },
  navLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
  },
  activeNavLabel: {
    color: '#CC0000',
  },
});
