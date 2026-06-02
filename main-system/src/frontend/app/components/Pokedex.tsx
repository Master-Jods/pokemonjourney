import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { OwnedPokemon } from '../store/gameStore';
import { getPokemonById, getTypeColor } from '../../../../../shared/data/pokemonData';
import { PokemonSprite, TypeBadge, RegionBadge, LevelBadge, SourceBadge, PokeHeader, PokeCard, EmptyState } from './PokeShared';

interface Props {
  ownedPokemon: OwnedPokemon[];
  onBack: () => void;
}

export function Pokedex({ ownedPokemon, onBack }: Props) {
  const [filter, setFilter] = useState<'All' | 'Fire' | 'Water' | 'Grass' | 'Electric' | 'Normal' | 'Rock' | 'Ghost'>('All');
  const [selected, setSelected] = useState<OwnedPokemon | null>(null);
  const [search, setSearch] = useState('');

  const types = ['All', 'Fire', 'Water', 'Grass', 'Electric', 'Normal', 'Rock', 'Ghost'] as const;

  const filtered = ownedPokemon.filter(owned => {
    const pd = getPokemonById(owned.pokemonDataId);
    if (!pd) return false;
    const matchType = filter === 'All' || pd.type === filter;
    const matchSearch = !search || pd.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  if (selected) {
    const pd = getPokemonById(selected.pokemonDataId);
    if (!pd) return null;
    const typeColor = getTypeColor(pd.type);
    const evolutionLvl = pd.evolutionStage === 1 ? 20 : pd.evolutionStage === 2 ? 40 : null;
    const canEvolve = pd.evolvesTo && evolutionLvl !== null && selected.level >= evolutionLvl;

    return (
      <View style={styles.container}>
        <PokeHeader title={pd.name} onBack={() => setSelected(null)} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Sprite card */}
          <View style={[styles.spriteHeader, { backgroundColor: typeColor.bg, borderColor: typeColor.border }]}>
            <PokemonSprite spriteId={pd.spriteId} name={pd.name} size={140} />
          </View>

          {/* Info */}
          <PokeCard style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Text style={styles.pokemonName}>{pd.name}</Text>
              <LevelBadge level={selected.level} />
            </View>

            <View style={styles.badgeRow}>
              <TypeBadge type={pd.type} />
              <RegionBadge region={pd.region} />
              <SourceBadge source={selected.source} />
            </View>

            <View style={styles.statsGrid}>
              <Stat label="Evolution Stage" value={`Stage ${pd.evolutionStage}`} />
              <Stat label="Level" value={selected.level.toString()} />
              <Stat label="Caught" value={new Date(selected.caughtAt).toLocaleDateString()} />
              <Stat label="Status" value={selected.status} />
            </View>

            {pd.evolvesTo && (
              <View style={[styles.evolutionNotice, canEvolve ? styles.evolveReady : styles.evolveWait]}>
                {canEvolve ? (
                  <Text style={styles.evolveReadyText}>
                    ✨ Ready to evolve with {pd.requiredStone}! Go to the Evolution page.
                  </Text>
                ) : (
                  <Text style={styles.evolveWaitText}>
                    Next evolution at Lv.{evolutionLvl} with {pd.requiredStone}. ({Math.max(0, (evolutionLvl ?? 0) - selected.level)} more levels needed)
                  </Text>
                )}
              </View>
            )}
          </PokeCard>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PokeHeader
        title="Pokédex"
        onBack={onBack}
        rightContent={<Text style={styles.headerRight}>{ownedPokemon.length} caught</Text>}
      />

      <View style={styles.controls}>
        {/* Search */}
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="🔍 Search Pokémon..."
          placeholderTextColor="#9CA3AF"
        />

        {/* Type filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
          {types.map(type => {
            const color = type === 'All' ? null : getTypeColor(type);
            const active = filter === type;
            return (
              <Pressable
                key={type}
                onPress={() => setFilter(type)}
                style={[
                  styles.filterButton,
                  { backgroundColor: active ? (color?.badge ?? '#CC0000') : '#f1f5f9' },
                ]}
              >
                <Text style={[styles.filterButtonText, { color: active ? '#fff' : '#64748b' }]}>
                  {type}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {filtered.length === 0 ? (
          <EmptyState icon="📔" message="No Pokémon found. Catch some in the wild or through games!" />
        ) : (
          <View style={styles.listGrid}>
            {filtered.map((owned) => {
              const pd = getPokemonById(owned.pokemonDataId);
              if (!pd) return null;
              const typeColor = getTypeColor(pd.type);
              return (
                <Pressable
                  key={owned.id}
                  onPress={() => setSelected(owned)}
                  style={[styles.listItem, { borderLeftColor: typeColor.border }]}
                >
                  <View style={[styles.listSpriteWrapper, { backgroundColor: typeColor.bg }]}>
                    <PokemonSprite spriteId={pd.spriteId} name={pd.name} size={52} />
                  </View>
                  <View style={styles.listContentCol}>
                    <View style={styles.listTitleRow}>
                      <Text style={styles.listTitle}>{pd.name}</Text>
                      <LevelBadge level={owned.level} />
                    </View>
                    <View style={styles.badgeRow}>
                      <TypeBadge type={pd.type} />
                      <RegionBadge region={pd.region} />
                    </View>
                    <Text style={styles.listSubtitle}>
                      {pd.evolutionStage < 3 ? `Stage ${pd.evolutionStage} • Can evolve` : 'Final form'}
                    </Text>
                  </View>
                  <ChevronRight color="#CBD5E0" size={20} />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statContainer}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
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
  headerRight: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  controls: {
    padding: 12,
    gap: 12,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  filterList: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  listGrid: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderLeftWidth: 4,
    padding: 12,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  listSpriteWrapper: {
    padding: 6,
    borderRadius: 12,
  },
  listContentCol: {
    flex: 1,
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  spriteHeader: {
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  infoCard: {
    padding: 16,
    gap: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pokemonName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    gap: 12,
  },
  statContainer: {
    width: '45%',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  evolutionNotice: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  evolveReady: {
    backgroundColor: '#F0FFF4',
    borderColor: '#38A169',
  },
  evolveWait: {
    backgroundColor: '#F7FAFC',
    borderColor: '#E2E8F0',
  },
  evolveReadyText: {
    color: '#276749',
    fontSize: 14,
    fontWeight: '600',
  },
  evolveWaitText: {
    color: '#718096',
    fontSize: 14,
  },
});
