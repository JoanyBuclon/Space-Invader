# Space Invader Multiplayer Server

Node.js gRPC server for the Space Invader multiplayer game (Étape 2).

## Features

- **gRPC bidirectional streaming** for real-time client-server communication
- **Lobby system** with automatic matchmaking (waits for 2-4 players)
- **Game state management** with wave progression
- **Dashboard API** with WebSocket for real-time monitoring
- **Multiple concurrent games** support

## Architecture

### Components

- **GameManager**: Handles lobby, matchmaking, and manages multiple game instances
- **GameInstance**: Manages a single multiplayer game session with wave progression
- **gRPC Server**: Handles client connections and event streaming
- **Dashboard Server**: HTTP/WebSocket server for monitoring dashboard

### Game Flow

1. Players connect with gRPC and join lobby with pseudonym
2. Server waits for minimum players (configurable, default 2)
3. Game starts automatically when enough players join
4. Server broadcasts wave configuration to all players
5. Players send events (kills, deaths, wave completion)
6. Server synchronizes and starts next wave when all players complete
7. Game ends in two ways:
   - **Victory**: At least one player survives all waves
   - **Total defeat**: All players die
     - Server automatically restarts a new game after 5 seconds with same players
     - Continues as long as minimum players remain connected
     - If not enough players, they return to lobby

## Installation

```bash
pnpm install
# or npm install
```

## Development

Start the development server with auto-reload:

```bash
pnpm dev
```

## Production

Build and run:

```bash
pnpm build
pnpm start
```

## Configuration

Environment variables (optional):

```bash
# Server ports
GRPC_PORT=50051        # gRPC server port
HTTP_PORT=3001         # Dashboard HTTP/WebSocket port

# Game settings
MIN_PLAYERS=2          # Minimum players to start game
MAX_PLAYERS=4          # Maximum players per game

# Logging
LOG_LEVEL=INFO         # DEBUG | INFO | WARN | ERROR
```

## Endpoints

### gRPC Service (port 50051)

- `PlayGame`: Bidirectional streaming for game events
- `MonitorGames`: Server streaming for dashboard updates

### HTTP API (port 3001)

- `GET /health`: Health check
- `GET /stats`: Server statistics
- `GET /games`: Active games list
- `WebSocket /`: Real-time dashboard updates

## Protocol

See `proto/game.proto` for complete gRPC service definition.

### Client → Server Events

- `player-joined(pseudo)`
- `player-disconnected(pseudo)`
- `player-touched(pseudo)`
- `wave-cleared(pseudo)`
- `enemy-killed(pseudo)`
- `player-killed(pseudo)`

### Server → Client Events

- `game-started(numberOfWaves, lifePoints, players[])`
- `wave-started(waveNumber, numberOfEnemies, numberOfLines, enemyLife)`
- `game-ended(victory, playerStats[])`
- `lobby-update(waitingPlayers[], requiredPlayers, currentPlayers)`
- `error(message, code)`

## Game Configuration

Edit `src/config/gameConfig.ts` to modify:

- Starting lives
- Number of waves
- Enemies per wave
- Enemy health per wave
- Lobby settings
- **Inactivity timeout** (default: 40 seconds)

Default: 5 waves with progressive difficulty (1-3 HP enemies, 2-4 lines, 5-9 enemies per line)

### Inactivity Detection

Players are automatically marked as dead if they don't send any events (kills, deaths, wave completion) for 40 seconds during a wave. This prevents games from being blocked by AFK or disconnected players who haven't properly sent a disconnect event.

**How it works:**
- Timer starts when wave begins
- Timer resets on each player event (enemy-killed, player-touched)
- Timer clears when player dies or completes wave
- After 40s of inactivity, player is marked as dead automatically

## Project Structure

```
server/
├── proto/              # Protocol Buffers definitions
├── src/
│   ├── config/         # Game and server configuration
│   ├── game/           # Game logic (Manager, Instance)
│   ├── grpc/           # gRPC server and handlers
│   ├── http/           # Dashboard HTTP/WebSocket server
│   ├── utils/          # Logger and utilities
│   └── server.ts       # Main entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Development Notes

- Server uses ESM modules (type: "module")
- TypeScript with strict mode
- Automatic lobby checking every 2 seconds
- Old games cleanup every 5 minutes
- Graceful shutdown on SIGINT/SIGTERM

## Troubleshooting

**gRPC connection issues from browser:**
- Make sure client uses gRPC-Web compatible library
- CORS is handled by the dashboard server
- For gRPC, use appropriate client library (see client README)

**Players not joining:**
- Check pseudo is unique
- Check minimum players requirement
- Check server logs for errors

**Dashboard not updating:**
- WebSocket connection to port 3001
- Check browser console for connection errors
- Verify server is running on correct port
