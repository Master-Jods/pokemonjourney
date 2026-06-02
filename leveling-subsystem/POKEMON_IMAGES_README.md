# Pokemon Images Integration Guide

This application currently uses simple colored circle placeholders for Pokemon images.

## How to Add Licensed Pokemon Images

To replace the placeholders with actual Pokemon artwork:

### Option 1: Using Image URLs

1. Obtain licensed Pokemon images from:
   - Official Pokemon API (https://pokeapi.co/) with proper attribution
   - Licensed image sources
   - Your own legally purchased assets

2. Update the illustration components in `src/app/components/pokemon-illustrations/`:

```tsx
// Example: CharmanderIllustration.tsx
export function CharmanderIllustration() {
  return (
    <img 
      src="YOUR_CHARMANDER_IMAGE_URL" 
      alt="Charmander"
      className="w-full h-full object-contain"
    />
  );
}
```

### Option 2: Using Local Image Files

1. Place your licensed Pokemon images in `public/pokemon/`:
   - `charmander.png`
   - `squirtle.png`
   - `pikachu.png`
   - `bulbasaur.png`

2. Update the illustration components:

```tsx
export function CharmanderIllustration() {
  return (
    <img 
      src="/pokemon/charmander.png" 
      alt="Charmander"
      className="w-full h-full object-contain"
    />
  );
}
```

### Option 3: Using Pokemon API

Install and use PokeAPI:

```bash
pnpm install axios
```

Create a Pokemon image component:

```tsx
import { useState, useEffect } from 'react';
import axios from 'axios';

export function PokemonImage({ pokemonName }: { pokemonName: string }) {
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`)
      .then(response => {
        setImageUrl(response.data.sprites.other['official-artwork'].front_default);
      });
  }, [pokemonName]);

  return imageUrl ? (
    <img src={imageUrl} alt={pokemonName} className="w-full h-full object-contain" />
  ) : (
    <div>Loading...</div>
  );
}
```

## Image Requirements

- **Format**: PNG with transparency recommended
- **Size**: 512x512px or higher for best quality
- **Background**: Transparent or white
- **Style**: Official Pokemon artwork style

## Legal Notice

Pokemon characters and artwork are © The Pokemon Company, Nintendo, and Game Freak.
Ensure you have proper licensing or use official APIs with attribution before deploying.
