import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { OwnedPokemon, InventoryItem } from '../store/gameStore';
import { getPokemonById, getTypeColor } from '../../../../../shared/data/pokemonData';
import { PokemonSprite, TypeBadge, LevelBadge, PokeHeader, PokeCard, EmptyState } from './PokeShared';

interface Props {
  ownedPokemon: OwnedPokemon[];
  inventory: InventoryItem[];
  onEvolve: (ownedId: string, newPokemonDataId: string, newName: string, stoneName: string) => boolean;
  onBack: () => void;
}

export function EvolutionPage({ ownedPokemon, inventory, onEvolve, onBack }: Props) {
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [evolving, setEvolving] = useState<string | null>(null);

  const evolvable = ownedPokemon.filter(owned => {
    const pd = getPokemonById(owned.pokemonDataId);
    if (!pd || !pd.evolvesTo || !pd.requiredStone) return false;
    const stage = pd.evolutionStage;
    const reqLevel = stage === 1 ? 20 : stage === 2 ? 40 : null;
    if (reqLevel === null) return false;
    return owned.level >= reqLevel;
  });

  const notReady = ownedPokemon.filter(owned => {
    const pd = getPokemonById(owned.pokemonDataId);
    if (!pd || !pd.evolvesTo || !pd.requiredStone) return false;
    const stage = pd.evolutionStage;
    const reqLevel = stage === 1 ? 20 : stage === 2 ? 40 : null;
    if (reqLevel === null) return false;
    return owned.level < reqLevel;
  });

  function tryEvolve(owned: OwnedPokemon) {
    const pd = getPokemonById(owned.pokemonDataId);
    if (!pd || !pd.evolvesTo || !pd.requiredStone) return;
    const nextPd = getPokemonById(pd.evolvesTo);
    if (!nextPd) return;

    const stoneInInv = inventory.find(i => i.itemName === pd.requiredStone && i.quantity > 0);
    if (!stoneInInv) {
      setMessage({ text: `You need a ${pd.requiredStone} to evolve ${pd.name}!`, ok: false });
      setTimeout(() => setMessage(null), 2500);
      return;
    }

    setEvolving(owned.id);
    setTimeout(() => {
      const success = onEvolve(owned.id, pd.evolvesTo!, nextPd.name, pd.requiredStone!);
      if (success) {
        setMessage({ text: `${pd.name} evolved into ${nextPd.name}! ✨`, ok: true });
      } else {
        setMessage({ text: `Evolution failed. Check your stones.`, ok: false });
      }
      setEvolving(null);
      setTimeout(() => setMessage(null), 3000);
    }, 1500);
  }

  function getRequirements(owned: OwnedPokemon) {
    const pd = getPokemonById(owned.pokemonDataId);
    if (!pd) return null;
    const stage = pd.evolutionStage;
    const reqLevel = stage === 1 ? 20 : stage === 2 ? 40 : null;
    const nextPd = pd.evolvesTo ? getPokemonById(pd.evolvesTo) : null;
    const hasStone = inventory.some(i => i.itemName === pd.requiredStone && i.quantity > 0);
    return { reqLevel, nextPd, hasStone, stone: pd.requiredStone };
  }

  return (
    <View style={styles.container}>
      <PokeHeader title="Evolution" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
              {message.ok ? '✨ ' : '❌ '}{message.text}
            </Text>
          </View>
        )}

        <PokeCard style={styles.rulesCard}>
          <Text style={styles.rulesHeader}>Evolution Requirements</Text>
          <View style={styles.rulesGrid}>
            <View style={styles.ruleBox}>
              <Text style={styles.ruleTitle}>Stage 1 → 2</Text>
              <Text style={styles.ruleText}>Level 20 + correct stone</Text>
            </View>
            <View style={styles.ruleBox}>
              <Text style={styles.ruleTitle}>Stage 2 → 3</Text>
              <Text style={styles.ruleText}>Level 40 + correct stone</Text>
            </View>
          </View>
        </PokeCard>

        {evolvable.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✨ Ready to Evolve ({evolvable.length})</Text>
            <View style={styles.cardList}>
              {evolvable.map((owned) => {
                const pd = getPokemonById(owned.pokemonDataId);
                const req = getRequirements(owned);
                if (!pd || !req) return null;
                const typeColor = getTypeColor(pd.type);
                const isEvolving = evolving === owned.id;

                return (
                  <PokeCard key={owned.id} style={styles.evolveCard}>
                    <View style={styles.evolveRow}>
                      <View style={[styles.spriteWrapper, { backgroundColor: typeColor.bg, borderColor: typeColor.border, borderWidth: 2 }]}>
                        <PokemonSprite spriteId={pd.spriteId} name={pd.name} size={60} />
                      </View>
                      <View style={styles.evolveInfo}>
                        <View style={styles.nameRow}>
                          <Text style={styles.pokemonName}>{pd.name}</Text>
                          <LevelBadge level={owned.level} />
                        </View>
                        <TypeBadge type={pd.type} />
                      </View>
                      {req.nextPd && (
                        <>
                          <View style={styles.evolveArrow}>
                            <ChevronDown color="#9CA3AF" size={24} />
                            <Text style={styles.evolveText}>evolves</Text>
                          </View>
                          <View style={[styles.spriteWrapper, { backgroundColor: '#F0FFF4', borderColor: '#C6F6D5', borderWidth: 2 }]}>
                            <PokemonSprite spriteId={req.nextPd.spriteId} name={req.nextPd.name} size={60} />
                          </View>
                        </>
                      )}
                    </View>

                    {req.nextPd && (
                      <Text style={styles.evolveDesc}>
                        {pd.name} → <Text style={styles.bold}>{req.nextPd.name}</Text> using <Text style={styles.bold}>{req.stone}</Text>
                      </Text>
                    )}

                    {req.hasStone ? (
                      <Pressable
                        onPress={() => tryEvolve(owned)}
                        disabled={isEvolving}
                        style={[styles.evolveButton, isEvolving && styles.evolvingButton]}
                      >
                        <Text style={styles.evolveButtonText}>
                          {isEvolving ? 'Evolving...' : `✨ Evolve with ${req.stone}`}
                        </Text>
                      </Pressable>
                    ) : (
                      <View style={styles.needStoneBox}>
                        <Text style={styles.needStoneText}>
                          Need <Text style={styles.bold}>{req.stone}</Text> (buy from Store)
                        </Text>
                      </View>
                    )}
                  </PokeCard>
                );
              })}
            </View>
          </View>
        )}

        {notReady.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitleMuted}>In Progress ({notReady.length})</Text>
            <View style={styles.cardList}>
              {notReady.map(owned => {
                const pd = getPokemonById(owned.pokemonDataId);
                const req = getRequirements(owned);
                if (!pd || !req) return null;
                const progress = Math.min(100, (owned.level / (req.reqLevel ?? 20)) * 100);

                return (
                  <PokeCard key={owned.id} style={styles.progressCard}>
                    <View style={styles.progressRow}>
                      <PokemonSprite spriteId={pd.spriteId} name={pd.name} size={48} />
                      <View style={styles.progressInfo}>
                        <View style={styles.nameRow}>
                          <Text style={styles.progressName}>{pd.name}</Text>
                          <LevelBadge level={owned.level} />
                        </View>
                        <View style={styles.progressBarRow}>
                          <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                          </View>
                          <Text style={styles.progressTargetText}>Lv.{req.reqLevel}</Text>
                        </View>
                        <Text style={styles.progressDescText}>
                          {Math.max(0, (req.reqLevel ?? 0) - owned.level)} more levels needed • {req.stone}
                        </Text>
                      </View>
                    </View>
                  </PokeCard>
                );
              })}
            </View>
          </View>
        )}

        {ownedPokemon.filter(o => {
          const pd = getPokemonById(o.pokemonDataId);
          return pd && pd.evolvesTo;
        }).length === 0 && (
          <EmptyState icon="✨" message="No Pokémon to evolve yet. Catch some starters and level them up!" />
        )}
      </ScrollView>
    </View>
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
  rulesCard: {
    padding: 16,
  },
  rulesHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  rulesGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  ruleBox: {
    flex: 1,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    padding: 8,
  },
  ruleTitle: {
    fontWeight: '600',
    color: '#374151',
    fontSize: 12,
  },
  ruleText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitleMuted: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardList: {
    gap: 12,
  },
  evolveCard: {
    padding: 16,
  },
  evolveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  spriteWrapper: {
    borderRadius: 12,
    padding: 8,
  },
  evolveInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pokemonName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  evolveArrow: {
    alignItems: 'center',
  },
  evolveText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  evolveDesc: {
    fontSize: 12,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 12,
  },
  bold: {
    fontWeight: 'bold',
    color: '#374151',
  },
  evolveButton: {
    backgroundColor: '#805AD5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  evolvingButton: {
    opacity: 0.7,
  },
  evolveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  needStoneBox: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FED7D7',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  needStoneText: {
    color: '#EF4444',
    fontSize: 14,
  },
  progressCard: {
    padding: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressInfo: {
    flex: 1,
  },
  progressName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progressBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 4,
  },
  progressTargetText: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressDescText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
