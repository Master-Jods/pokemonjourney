import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { getSpriteUrl, getTypeColor, REGION_COLORS } from '../../../../../shared/data/pokemonData';

const pokeballImg = require('../../imports/image-2.png');

export function PokemonSprite({ spriteId, name, size = 80 }: { spriteId: number; name: string; size?: number }) {
  return (
    <Image
      source={{ uri: getSpriteUrl(spriteId) }}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

export function TypeBadge({ type }: { type: string }) {
  const color = getTypeColor(type);
  return (
    <View style={[styles.badge, { backgroundColor: color.badge }]}>
      <Text style={styles.badgeText}>{type}</Text>
    </View>
  );
}

export function RegionBadge({ region }: { region: string }) {
  const color = REGION_COLORS[region] ?? '#555';
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{region}</Text>
    </View>
  );
}

export function CoinDisplay({ coins }: { coins: number }) {
  return (
    <View style={styles.coinDisplay}>
      <Text style={styles.coinIcon}>🪙</Text>
      <Text style={styles.coinText}>{coins}</Text>
    </View>
  );
}

export function LevelBadge({ level }: { level: number }) {
  return (
    <View style={styles.levelBadge}>
      <Text style={styles.levelBadgeText}>Lv.{level}</Text>
    </View>
  );
}

export function PokeHeader({
  title,
  onBack,
  rightContent,
}: {
  title: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      {onBack && (
        <Pressable onPress={onBack} style={styles.backButton}>
          <ChevronLeft color="#fff" size={24} />
        </Pressable>
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      {rightContent}
    </View>
  );
}

export function PokeCard({ children, style }: { children: React.ReactNode; style?: any; className?: string }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

export function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

export function PokeBall({ size = 32 }: { size?: number }) {
  return (
    <Image
      source={pokeballImg}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

export function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    Starter: '#805AD5',
    PokeReflex: '#2B6CB0',
    PokeGuess: '#276749',
    'IRL Catch': '#C05621',
    'Manual Log': '#718096',
  };
  return (
    <View style={[styles.badge, { backgroundColor: colors[source] ?? '#718096' }]}>
      <Text style={styles.badgeText}>{source}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  coinDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinIcon: {
    fontSize: 16,
  },
  coinText: {
    color: '#B7791F',
    fontWeight: '600',
    fontSize: 16,
  },
  levelBadge: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  levelBadgeText: {
    color: '#FFDE00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#CC0000',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyMessage: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 200,
  },
});
