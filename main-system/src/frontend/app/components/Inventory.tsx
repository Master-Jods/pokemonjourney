import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { InventoryItem, OwnedPokemon } from '../store/gameStore';
import { getPokemonById } from '../../../../../shared/data/pokemonData';
import { PokemonSprite, LevelBadge, TypeBadge, PokeHeader, PokeCard, EmptyState } from './PokeShared';

interface Props {
  items: InventoryItem[];
  ownedPokemon: OwnedPokemon[];
  playerName: string;
  onUseRareCandy: (ownedId: string, pokemonName: string) => boolean;
  onBack: () => void;
}

const ITEM_ICONS: Record<string, string> = {
  'Fire Stone': '🔥',
  'Water Stone': '💧',
  'Leaf Stone': '🍃',
  'Thunder Stone': '⚡',
  'Rare Candy': '🍬',
};

export function Inventory({ items, ownedPokemon, playerName, onUseRareCandy, onBack }: Props) {
  const [selectingPokemon, setSelectingPokemon] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const rareCandyCount = items.find(i => i.itemName === 'Rare Candy')?.quantity ?? 0;

  function handleUseRareCandy(owned: OwnedPokemon) {
    const pd = getPokemonById(owned.pokemonDataId);
    if (!pd) return;
    const success = onUseRareCandy(owned.id, pd.name);
    if (success) {
      setMessage({ text: `${pd.name} gained +5 levels!`, ok: true });
    } else {
      setMessage({ text: 'No Rare Candy available!', ok: false });
    }
    setSelectingPokemon(false);
    setTimeout(() => setMessage(null), 2500);
  }

  if (selectingPokemon) {
    return (
      <View style={styles.container}>
        <PokeHeader title="Use Rare Candy" onBack={() => setSelectingPokemon(false)} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.helperText}>Select a Pokémon to give the Rare Candy to (+5 levels)</Text>
          {ownedPokemon.length === 0 ? (
            <EmptyState icon="🎒" message="No Pokémon available" />
          ) : (
            <View style={styles.listContainer}>
              {ownedPokemon.map(owned => {
                const pd = getPokemonById(owned.pokemonDataId);
                if (!pd) return null;
                return (
                  <Pressable
                    key={owned.id}
                    onPress={() => handleUseRareCandy(owned)}
                    style={styles.pokemonButton}
                  >
                    <PokemonSprite spriteId={pd.spriteId} name={pd.name} size={52} />
                    <View style={styles.pokemonInfo}>
                      <View style={styles.pokemonHeaderRow}>
                        <Text style={styles.pokemonName}>{pd.name}</Text>
                        <LevelBadge level={owned.level} />
                      </View>
                      <View style={{ flexDirection: 'row', marginTop: 4 }}>
                        <TypeBadge type={pd.type} />
                      </View>
                    </View>
                    <Text style={styles.levelUpText}>+5 Lv</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PokeHeader
        title="Inventory"
        onBack={onBack}
        rightContent={
          <Text style={styles.headerRightText}>{items.reduce((sum, i) => sum + i.quantity, 0)} items</Text>
        }
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {message && (
          <View
            style={[
              styles.messageBox,
              {
                backgroundColor: message.ok ? '#FFFFF0' : '#FFF5F5',
                borderColor: message.ok ? '#F6E05E' : '#FED7D7',
              },
            ]}
          >
            <Text style={[styles.messageText, { color: message.ok ? '#744210' : '#C53030' }]}>
              {message.ok ? '🍬 ' : '❌ '}{message.text}
            </Text>
          </View>
        )}

        {items.length === 0 ? (
          <EmptyState icon="🎒" message="Your inventory is empty. Visit the Pokémon Store to buy items!" />
        ) : (
          <View style={styles.listContainer}>
            {items.map((item) => {
              const isCandy = item.itemName === 'Rare Candy';
              return (
                <PokeCard key={item.itemName} style={styles.itemCard}>
                  <View style={styles.itemRow}>
                    <View style={styles.itemIconWrapper}>
                      <Text style={styles.itemIcon}>{ITEM_ICONS[item.itemName] ?? '📦'}</Text>
                    </View>
                    <View style={styles.itemInfo}>
                      <View style={styles.itemHeaderRow}>
                        <Text style={styles.itemName}>{item.itemName}</Text>
                        <View style={styles.quantityBadge}>
                          <Text style={styles.quantityText}>×{item.quantity}</Text>
                        </View>
                      </View>
                      <Text style={styles.itemDescription}>
                        {isCandy ? 'Adds +5 levels to a Pokémon' : `Used for ${item.itemName.replace(' Stone', '')}-type evolution`}
                      </Text>
                    </View>
                  </View>
                  {isCandy && item.quantity > 0 && (
                    <Pressable
                      onPress={() => setSelectingPokemon(true)}
                      style={styles.useCandyButton}
                    >
                      <Text style={styles.useCandyButtonText}>Use Rare Candy 🍬</Text>
                    </Pressable>
                  )}
                  {!isCandy && (
                    <Text style={styles.evolutionHint}>
                      Use in the Evolution page to evolve Pokémon
                    </Text>
                  )}
                </PokeCard>
              );
            })}
          </View>
        )}

        <PokeCard style={styles.guideCard}>
          <Text style={styles.guideTitle}>💡 How to use items</Text>
          <View style={styles.guideList}>
            <Text style={styles.guideListItem}>• <Text style={styles.boldText}>Evolution Stones</Text> → Used in the Evolution page</Text>
            <Text style={styles.guideListItem}>• <Text style={styles.boldText}>Rare Candy</Text> → Tap "Use Rare Candy" and pick a Pokémon</Text>
            <Text style={styles.guideListItem}>• Buy more items from the Pokémon Store</Text>
          </View>
        </PokeCard>
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
  headerRightText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  helperText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  listContainer: {
    gap: 12,
  },
  pokemonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 12,
  },
  pokemonInfo: {
    flex: 1,
  },
  pokemonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pokemonName: {
    fontWeight: 'bold',
    color: '#1F2937',
    fontSize: 16,
  },
  levelUpText: {
    color: '#EAB308',
    fontWeight: 'bold',
    fontSize: 14,
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
  itemCard: {
    padding: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  itemIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIcon: {
    fontSize: 24,
  },
  itemInfo: {
    flex: 1,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  itemName: {
    fontWeight: 'bold',
    color: '#1F2937',
    fontSize: 16,
  },
  quantityBadge: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  quantityText: {
    color: '#FFDE00',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  useCandyButton: {
    marginTop: 12,
    backgroundColor: '#D69E2E',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  useCandyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  evolutionHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  guideCard: {
    padding: 16,
  },
  guideTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  guideList: {
    gap: 4,
  },
  guideListItem: {
    fontSize: 12,
    color: '#6B7280',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#374151',
  },
});
