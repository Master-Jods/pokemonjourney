import { POKEMON_DATABASE } from '../../../../../shared/data/pokemonData';
import { PokemonSprite } from './PokeShared';

export function FloatingParticles() {
  // Select random Pokemon for background
  const randomPokemon = [
    POKEMON_DATABASE.find(p => p.name === 'Pikachu'),
    POKEMON_DATABASE.find(p => p.name === 'Bulbasaur'),
    POKEMON_DATABASE.find(p => p.name === 'Charmander'),
    POKEMON_DATABASE.find(p => p.name === 'Squirtle'),
    POKEMON_DATABASE.find(p => p.name === 'Jigglypuff'),
    POKEMON_DATABASE.find(p => p.name === 'Psyduck'),
    POKEMON_DATABASE.find(p => p.name === 'Meowth'),
    POKEMON_DATABASE.find(p => p.name === 'Eevee'),
    POKEMON_DATABASE.find(p => p.name === 'Snorlax'),
    POKEMON_DATABASE.find(p => p.name === 'Dratini'),
    POKEMON_DATABASE.find(p => p.name === 'Magikarp'),
    POKEMON_DATABASE.find(p => p.name === 'Slowpoke'),
    POKEMON_DATABASE.find(p => p.name === 'Oddish'),
    POKEMON_DATABASE.find(p => p.name === 'Geodude'),
    POKEMON_DATABASE.find(p => p.name === 'Vulpix'),
    POKEMON_DATABASE.find(p => p.name === 'Poliwag'),
  ].filter(Boolean);

  const particles = [
    { pokemon: randomPokemon[0], top: '5%', left: '8%', delay: 0, duration: 4 },
    { pokemon: randomPokemon[1], top: '15%', right: '12%', delay: 1, duration: 5 },
    { pokemon: randomPokemon[2], top: '25%', left: '5%', delay: 2, duration: 6 },
    { pokemon: randomPokemon[3], top: '35%', right: '8%', delay: 3, duration: 4.5 },
    { pokemon: randomPokemon[4], top: '45%', left: '10%', delay: 1.5, duration: 5.5 },
    { pokemon: randomPokemon[5], top: '55%', right: '15%', delay: 0.5, duration: 4.8 },
    { pokemon: randomPokemon[6], top: '65%', left: '12%', delay: 2.5, duration: 5.2 },
    { pokemon: randomPokemon[7], top: '75%', right: '10%', delay: 1.8, duration: 6.2 },
    { pokemon: randomPokemon[8], top: '85%', left: '15%', delay: 0.8, duration: 5.8 },
    { pokemon: randomPokemon[9], top: '10%', left: '50%', delay: 2.2, duration: 4.2 },
    { pokemon: randomPokemon[10], top: '30%', right: '50%', delay: 1.2, duration: 5.5 },
    { pokemon: randomPokemon[11], top: '50%', left: '3%', delay: 2.8, duration: 4.7 },
    { pokemon: randomPokemon[12], top: '70%', right: '5%', delay: 0.3, duration: 5.3 },
    { pokemon: randomPokemon[13], top: '20%', left: '30%', delay: 1.7, duration: 4.9 },
    { pokemon: randomPokemon[14], top: '60%', right: '35%', delay: 2.1, duration: 5.1 },
    { pokemon: randomPokemon[15], top: '40%', left: '45%', delay: 0.9, duration: 5.6 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {particles.map((particle, index) => {
        if (!particle.pokemon) return null;
        return (
          <div
            key={index}
            className="absolute opacity-15 float"
            style={{
              top: particle.top,
              left: particle.left,
              right: particle.right,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          >
            <PokemonSprite
              spriteId={particle.pokemon.spriteId}
              name={particle.pokemon.name}
              size={90}
            />
          </div>
        );
      })}
    </div>
  );
}
