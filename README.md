# PokeJourney

Workspace layout:

```text
pokejourney/
├── main-system/          # Mobile React Native / Expo Pokédex app
├── catching-subsystem/   # React web subsystem 1 scaffold
├── leveling-subsystem/   # React web subsystem 2 scaffold
├── shared/               # Shared constants, Pokémon data, result format
└── docs/                 # Guidelines, database schema, API format, context
```

Each system folder uses `src/frontend` and `src/backend`. For now, only the
main system has implementation files. The subsystem folders are React web
scaffolds; members can add their frontend entry at `src/frontend/main.tsx` and
their API/backend code under `src/backend`.

## Run

```bash
corepack pnpm install
npm run dev:main
npm run dev:catching
npm run dev:leveling
```

## Build

```bash
npm run build
npm run build:catching
npm run build:leveling
```
