interface PokemonPlaceholderProps {
  name: string;
  color: string;
}

export function PokemonPlaceholder({ name, color }: PokemonPlaceholderProps) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <div
          className="w-32 h-32 rounded-full mx-auto mb-2"
          style={{ backgroundColor: color }}
        />
        <p className="text-sm text-gray-600">{name}</p>
        <p className="text-xs text-gray-400 mt-1">Replace with licensed image</p>
      </div>
    </div>
  );
}

// Pokemon color constants based on their primary type colors
export const POKEMON_COLORS = {
  Charmander: '#FF7F0F', // Fire - Orange
  Squirtle: '#6890F0',   // Water - Blue
  Pikachu: '#F8D030',    // Electric - Yellow
  Bulbasaur: '#78C850'   // Grass - Green
};
