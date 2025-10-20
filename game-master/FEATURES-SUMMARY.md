# Space Invader Multiplayer - Features Summary

Complete implementation of the Space Invader multiplayer game with advanced server management features.

## Core Features

### 1. Multiplayer Lobby System
- **Nickname Registration**: Players enter unique pseudonyms
- **Waiting Room**: Shows all connected players
- **Automatic Matchmaking**: Game starts when MIN_PLAYERS reached (default: 2)
- **Player Capacity**: Supports up to MAX_PLAYERS per game (default: 10)
- **Visual Feedback**: Progress bar showing player count

**Files:**
- `server/src/game/GameManager.ts`
- `client/src/lib/components/LobbyScreen.svelte`

### 2. Server-Driven Wave Progression
- **Dynamic Configuration**: Server sends wave parameters
  - Number of enemies per line
  - Number of lines
  - Enemy health points
- **5 Progressive Waves**: Increasing difficulty
- **Synchronized Gameplay**: All players face same waves
- **Wave Completion**: Next wave starts when all players finish

**Files:**
- `server/src/config/gameConfig.ts`
- `server/src/game/GameInstance.ts`

### 3. Real-Time Event Communication
- **WebSocket Protocol**: Bidirectional communication
- **Client → Server Events**:
  - `player-joined`: Join lobby
  - `enemy-killed`: Enemy destroyed
  - `player-touched`: Lost a life
  - `wave-cleared`: Completed wave
  - `player-killed`: No lives left
  - `player-disconnected`: Leave game

- **Server → Client Events**:
  - `lobby-update`: Waiting room status
  - `game-started`: Game begins
  - `wave-started`: New wave configuration
  - `game-ended`: Victory or defeat
  - `error`: Error messages

**Files:**
- `server/src/http/gameWebSocket.ts`
- `client/src/lib/grpc/gameClient.ts`

### 4. Auto-Restart on Total Defeat ✨
When all players die:
1. Game ends with `victory: false`
2. Players return to waiting room automatically
3. Server waits 5 seconds
4. New game starts automatically with same players
5. Continues until victory or players disconnect

**Benefits:**
- No manual reconnection needed
- Keeps player groups together
- Continuous gameplay experience
- Encourages team improvement

**Files:**
- `server/src/game/GameManager.ts` (`handleGameEnd`)
- `client/src/lib/game/multiplayerState.svelte.ts`

### 5. Inactivity Timeout Detection ✨
Players inactive for 40 seconds are automatically marked as dead:

**How It Works:**
- Timer starts at wave beginning for each player
- Resets on any activity (kills, hits)
- Clears on wave completion or death
- After 40s: player marked as dead, wave can progress

**Benefits:**
- Prevents game blocking by AFK players
- Handles silent disconnections
- No manual intervention needed
- Fair for active players

**Configuration:**
```bash
INACTIVITY_TIMEOUT=40000  # milliseconds (default: 40s)
```

**Files:**
- `server/src/game/GameInstance.ts` (timer management)
- `server/src/config/gameConfig.ts`

### 6. Real-Time Dashboard
- **Live Monitoring**: All active games displayed
- **Game Details**: Players, wave progress, status
- **Server Statistics**: Total games, active games, uptime, player count
- **Auto-Updates**: Refreshes every 2 seconds
- **Auto-Reconnect**: Handles connection issues

**Files:**
- `dashboard/src/lib/dashboardClient.ts`
- `dashboard/src/lib/components/GameCard.svelte`
- `dashboard/src/lib/components/StatsCard.svelte`

## Technical Architecture

### Server (Node.js + TypeScript)
```
server/
├── src/
│   ├── config/          # Game configuration
│   ├── game/            # Game logic
│   │   ├── GameManager.ts      # Lobby & matchmaking
│   │   ├── GameInstance.ts     # Wave management
│   │   └── types.ts            # Type definitions
│   ├── grpc/            # gRPC server (optional)
│   ├── http/            # WebSocket servers
│   │   ├── dashboardServer.ts  # Dashboard API
│   │   └── gameWebSocket.ts    # Game client WebSocket
│   └── server.ts        # Entry point
└── proto/               # Protocol definitions
```

### Client (Svelte 5 + SvelteKit)
```
client/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── GameCanvas.svelte       # Game rendering
│   │   │   ├── LobbyScreen.svelte      # Lobby UI
│   │   │   ├── GameScreens.svelte      # Victory/Defeat
│   │   │   └── GameUI.svelte           # HUD
│   │   ├── game/
│   │   │   ├── gameState.svelte.ts     # Game logic
│   │   │   ├── multiplayerState.svelte.ts  # Multiplayer integration
│   │   │   └── types.ts                # Type definitions
│   │   └── grpc/
│   │       └── gameClient.ts           # WebSocket client
│   └── routes/
│       └── +page.svelte                # Main page
```

### Dashboard (Svelte 5 + SvelteKit)
```
dashboard/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── GameCard.svelte     # Game display
│   │   │   └── StatsCard.svelte    # Statistics
│   │   └── dashboardClient.ts      # WebSocket client
│   └── routes/
│       └── +page.svelte            # Dashboard page
```

## Configuration

### Server Environment Variables
```bash
# Ports
GRPC_PORT=50051          # gRPC server (optional)
HTTP_PORT=3001           # WebSocket + Dashboard

# Game Settings
MIN_PLAYERS=2            # Minimum to start
MAX_PLAYERS=10           # Maximum per game
INACTIVITY_TIMEOUT=40000 # Auto-kill timeout (ms)

# Logging
LOG_LEVEL=INFO           # DEBUG | INFO | WARN | ERROR
```

### Wave Configuration
Edit `server/src/config/gameConfig.ts`:
```typescript
DEFAULT_GAME_CONFIG = {
  startingLives: 3,
  waves: [
    { waveNumber: 1, numberOfEnemies: 5, numberOfLines: 2, enemyLife: 1 },
    { waveNumber: 2, numberOfEnemies: 6, numberOfLines: 2, enemyLife: 1 },
    { waveNumber: 3, numberOfEnemies: 7, numberOfLines: 3, enemyLife: 1 },
    { waveNumber: 4, numberOfEnemies: 4, numberOfLines: 2, enemyLife: 2 },
    { waveNumber: 5, numberOfEnemies: 5, numberOfLines: 3, enemyLife: 2 }
  ]
}
```

## Quick Start

```bash
# 1. Install dependencies
cd server && pnpm install
cd ../client && pnpm install
cd ../dashboard && pnpm install

# 2. Start services (3 terminals)
cd server && pnpm dev       # Terminal 1
cd client && pnpm dev       # Terminal 2
cd dashboard && pnpm dev    # Terminal 3

# 3. Test multiplayer
# - Open multiple tabs: http://localhost:5173
# - Enter different nicknames
# - Play with 2+ players
# - Monitor: http://localhost:5174
```

## Game Flow

```
Player Join
    ↓
Lobby (wait for MIN_PLAYERS)
    ↓
Game Started (server broadcasts lives & waves)
    ↓
┌─ Wave 1 Started (server sends config)
│       ↓
│   Players Play
│   - Kill enemies → enemy-killed event
│   - Get hit → player-touched event
│   - Inactive 40s → auto-killed
│       ↓
│   Player finishes → wave-cleared event
│       ↓
│   All players done? → Next wave
└─ Repeat for waves 2-5
    ↓
Game Ended
    ├─ Victory (someone alive)
    │   └─ Show stats, session ends
    └─ Total Defeat (all dead)
        └─ Auto-restart after 5s
            └─ Back to Wave 1
```

## Key Metrics

- **Latency**: Real-time WebSocket communication
- **Scalability**: Multiple concurrent games supported
- **Reliability**: Auto-reconnect, timeout handling, graceful shutdown
- **UX**: Smooth transitions, visual feedback, automatic recovery
- **Monitoring**: Full observability via dashboard

## Documentation

Detailed guides:
- `AUTO-RESTART.md` - Auto-restart feature details
- `INACTIVITY-TIMEOUT.md` - Timeout detection details
- `server/README.md` - Server setup & API
- `client/README.md` - Client setup & usage
- `dashboard/README.md` - Dashboard setup
- `README.md` - Complete overview

## Testing Scenarios

✅ **Normal Play**: Multiple players complete waves
✅ **Victory**: Players beat all waves
✅ **Total Defeat**: All players die → auto-restart
✅ **AFK Player**: Inactive player auto-killed after 40s
✅ **Disconnect**: Player leaves → game continues
✅ **Reconnect**: Dashboard reconnects automatically
✅ **Multiple Games**: Concurrent games don't interfere
✅ **Wave Sync**: All players see same wave config

## Technologies

**Backend:**
- Node.js 22+ with TypeScript
- WebSocket (ws library)
- gRPC (optional, @grpc/grpc-js)
- ESM modules

**Frontend:**
- Svelte 5 (runes)
- SvelteKit
- TailwindCSS 4.x
- Canvas API
- TypeScript

**Communication:**
- WebSocket (browser clients)
- gRPC (native clients, optional)
- JSON message format

## License

MIT - Sfeir Bordeaux - Vibe Coding Session 4
