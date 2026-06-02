export interface PokemonData {
  id: string;
  name: string;
  type: string;
  region: string;
  spriteId: number;
  evolutionStage: number;
  evolvesTo?: string;
  requiredStone?: string;
  isStarter?: boolean;
}

export interface StoreItem {
  name: string;
  price: number;
  description: string;
  icon: string;
  isStone: boolean;
  isBadge?: boolean;
}

export const POKEMON_DATABASE: PokemonData[] = [
  // Kanto starters & evolutions
  { id: '001', name: 'Bulbasaur', type: 'Grass', region: 'Kanto', spriteId: 1, evolutionStage: 1, evolvesTo: '002', requiredStone: 'Leaf Stone', isStarter: true },
  { id: '002', name: 'Ivysaur', type: 'Grass', region: 'Kanto', spriteId: 2, evolutionStage: 2, evolvesTo: '003', requiredStone: 'Leaf Stone' },
  { id: '003', name: 'Venusaur', type: 'Grass', region: 'Kanto', spriteId: 3, evolutionStage: 3 },
  { id: '004', name: 'Charmander', type: 'Fire', region: 'Kanto', spriteId: 4, evolutionStage: 1, evolvesTo: '005', requiredStone: 'Fire Stone', isStarter: true },
  { id: '005', name: 'Charmeleon', type: 'Fire', region: 'Kanto', spriteId: 5, evolutionStage: 2, evolvesTo: '006', requiredStone: 'Fire Stone' },
  { id: '006', name: 'Charizard', type: 'Fire', region: 'Kanto', spriteId: 6, evolutionStage: 3 },
  { id: '007', name: 'Squirtle', type: 'Water', region: 'Kanto', spriteId: 7, evolutionStage: 1, evolvesTo: '008', requiredStone: 'Water Stone', isStarter: true },
  { id: '008', name: 'Wartortle', type: 'Water', region: 'Kanto', spriteId: 8, evolutionStage: 2, evolvesTo: '009', requiredStone: 'Water Stone' },
  { id: '009', name: 'Blastoise', type: 'Water', region: 'Kanto', spriteId: 9, evolutionStage: 3 },
  // Other Kanto Pokémon
  { id: '025', name: 'Pikachu', type: 'Electric', region: 'Kanto', spriteId: 25, evolutionStage: 1, evolvesTo: '026', requiredStone: 'Thunder Stone' },
  { id: '026', name: 'Raichu', type: 'Electric', region: 'Kanto', spriteId: 26, evolutionStage: 2 },
  { id: '052', name: 'Meowth', type: 'Normal', region: 'Kanto', spriteId: 52, evolutionStage: 1 },
  { id: '074', name: 'Geodude', type: 'Rock', region: 'Kanto', spriteId: 74, evolutionStage: 1 },
  { id: '092', name: 'Gastly', type: 'Ghost', region: 'Kanto', spriteId: 92, evolutionStage: 1 },
  { id: '129', name: 'Magikarp', type: 'Water', region: 'Kanto', spriteId: 129, evolutionStage: 1, evolvesTo: '130', requiredStone: 'Water Stone' },
  { id: '130', name: 'Gyarados', type: 'Water', region: 'Kanto', spriteId: 130, evolutionStage: 2 },
  { id: '133', name: 'Eevee', type: 'Normal', region: 'Kanto', spriteId: 133, evolutionStage: 1 },
  // Unova starters & evolutions
  { id: '495', name: 'Snivy', type: 'Grass', region: 'Unova', spriteId: 495, evolutionStage: 1, evolvesTo: '496', requiredStone: 'Leaf Stone', isStarter: true },
  { id: '496', name: 'Servine', type: 'Grass', region: 'Unova', spriteId: 496, evolutionStage: 2, evolvesTo: '497', requiredStone: 'Leaf Stone' },
  { id: '497', name: 'Serperior', type: 'Grass', region: 'Unova', spriteId: 497, evolutionStage: 3 },
  { id: '498', name: 'Tepig', type: 'Fire', region: 'Unova', spriteId: 498, evolutionStage: 1, evolvesTo: '499', requiredStone: 'Fire Stone', isStarter: true },
  { id: '499', name: 'Pignite', type: 'Fire', region: 'Unova', spriteId: 499, evolutionStage: 2, evolvesTo: '500', requiredStone: 'Fire Stone' },
  { id: '500', name: 'Emboar', type: 'Fire', region: 'Unova', spriteId: 500, evolutionStage: 3 },
  { id: '501', name: 'Oshawott', type: 'Water', region: 'Unova', spriteId: 501, evolutionStage: 1, evolvesTo: '502', requiredStone: 'Water Stone', isStarter: true },
  { id: '502', name: 'Dewott', type: 'Water', region: 'Unova', spriteId: 502, evolutionStage: 2, evolvesTo: '503', requiredStone: 'Water Stone' },
  { id: '503', name: 'Samurott', type: 'Water', region: 'Unova', spriteId: 503, evolutionStage: 3 },
  // Paldea starters & evolutions
  { id: '906', name: 'Sprigatito', type: 'Grass', region: 'Paldea', spriteId: 906, evolutionStage: 1, evolvesTo: '907', requiredStone: 'Leaf Stone', isStarter: true },
  { id: '907', name: 'Floragato', type: 'Grass', region: 'Paldea', spriteId: 907, evolutionStage: 2, evolvesTo: '908', requiredStone: 'Leaf Stone' },
  { id: '908', name: 'Meowscarada', type: 'Grass', region: 'Paldea', spriteId: 908, evolutionStage: 3 },
  { id: '909', name: 'Fuecoco', type: 'Fire', region: 'Paldea', spriteId: 909, evolutionStage: 1, evolvesTo: '910', requiredStone: 'Fire Stone', isStarter: true },
  { id: '910', name: 'Crocalor', type: 'Fire', region: 'Paldea', spriteId: 910, evolutionStage: 2, evolvesTo: '911', requiredStone: 'Fire Stone' },
  { id: '911', name: 'Skeledirge', type: 'Fire', region: 'Paldea', spriteId: 911, evolutionStage: 3 },
  { id: '912', name: 'Quaxly', type: 'Water', region: 'Paldea', spriteId: 912, evolutionStage: 1, evolvesTo: '913', requiredStone: 'Water Stone', isStarter: true },
  { id: '913', name: 'Quaxwell', type: 'Water', region: 'Paldea', spriteId: 913, evolutionStage: 2, evolvesTo: '914', requiredStone: 'Water Stone' },
  { id: '914', name: 'Quaquaval', type: 'Water', region: 'Paldea', spriteId: 914, evolutionStage: 3 },
];

export const STORE_ITEMS: StoreItem[] = [
  { name: 'Fire Stone', price: 50, description: 'Used for Fire-type evolution', icon: '🔥', isStone: true },
  { name: 'Water Stone', price: 50, description: 'Used for Water-type evolution', icon: '💧', isStone: true },
  { name: 'Leaf Stone', price: 50, description: 'Used for Grass-type evolution', icon: '🍃', isStone: true },
  { name: 'Thunder Stone', price: 50, description: 'Used for Electric-type evolution', icon: '⚡', isStone: true },
  { name: 'Moon Stone', price: 50, description: 'Used for moon-linked evolution', icon: '🌙', isStone: true },
  { name: 'Sun Stone', price: 50, description: 'Used for sun-linked evolution', icon: '☀️', isStone: true },
  { name: 'Shiny Stone', price: 50, description: 'Used for radiant evolution', icon: '✨', isStone: true },
  { name: 'Dusk Stone', price: 50, description: 'Used for dark evolution', icon: '🌑', isStone: true },
  { name: 'Dawn Stone', price: 50, description: 'Used for dawn-linked evolution', icon: '🌅', isStone: true },
  { name: 'Ice Stone', price: 50, description: 'Used for Ice-type evolution', icon: '❄️', isStone: true },
  { name: 'Badge 1', price: 0, description: 'Boulder Badge - Level Cap is 40', icon: 'badge1', isStone: false, isBadge: true },
  { name: 'Badge 2', price: 0, description: 'Cascade Badge - Level Cap is 50', icon: 'badge2', isStone: false, isBadge: true },
  { name: 'Badge 3', price: 0, description: 'Thunder Badge - Level Cap is 70', icon: 'badge3', isStone: false, isBadge: true },
  { name: 'Badge 4', price: 0, description: 'Rainbow Badge - Level Cap is 90', icon: 'badge4', isStone: false, isBadge: true },
  { name: 'Badge 5', price: 0, description: 'Soul Badge - Level Cap is 100', icon: 'badge5', isStone: false, isBadge: true },
];

export const TYPE_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  Fire:     { bg: '#FFF0EB', text: '#C05621', border: '#FF6B35', badge: '#FF6B35' },
  Water:    { bg: '#EBF4FF', text: '#2B6CB0', border: '#4A90E2', badge: '#4A90E2' },
  Grass:    { bg: '#F0FFF4', text: '#276749', border: '#38A169', badge: '#38A169' },
  Electric: { bg: '#FFFFF0', text: '#744210', border: '#D69E2E', badge: '#D69E2E' },
  Normal:   { bg: '#F5F5F0', text: '#4A5568', border: '#A0AEC0', badge: '#718096' },
  Rock:     { bg: '#FAF5EB', text: '#744210', border: '#B7791F', badge: '#B7791F' },
  Ghost:    { bg: '#FAF5FF', text: '#44337A', border: '#805AD5', badge: '#805AD5' },
  Psychic:  { bg: '#FFF5F7', text: '#702459', border: '#D53F8C', badge: '#D53F8C' },
  Dragon:   { bg: '#EBF8FF', text: '#2C5282', border: '#3182CE', badge: '#3182CE' },
};

export const REGION_COLORS: Record<string, string> = {
  Kanto: '#CC0000',
  Unova: '#003A70',
  Paldea: '#7B2D8B',
};

export function getPokemonById(id: string): PokemonData | undefined {
  return POKEMON_DATABASE.find(p => p.id === id);
}

export function getPokemonByName(name: string): PokemonData | undefined {
  return POKEMON_DATABASE.find(p => p.name.toLowerCase() === name.toLowerCase());
}

export function getSpriteUrl(spriteId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${spriteId}.png`;
}

export function getTypeColor(type: string) {
  return TYPE_COLORS[type] ?? TYPE_COLORS['Normal'];
}
