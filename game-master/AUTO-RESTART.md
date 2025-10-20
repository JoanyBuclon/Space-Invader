# Auto-Restart Feature

## Overview

When all players in a game die (total party wipe), the server automatically starts a new game with the same players after a 5-second delay. This keeps the gameplay flowing and allows players to try again without manually reconnecting.

## How It Works

### Server-Side Logic

1. **Game End Detection** (`GameInstance.ts`)
   - When the game ends, `endGame()` is called
   - Checks if any player survived (`anyWon`)
   - Calls the `onGameEnd` callback with `allPlayersDead = !anyWon`

2. **Game Manager Handling** (`GameManager.ts`)
   - `handleGameEnd()` receives the callback
   - If `allPlayersDead === true`:
     - Gets all player connections from the completed game
     - Filters out disconnected players
     - If enough players remain (≥ MIN_PLAYERS):
       - Sends `lobby-update` event to all players
       - Waits 5 seconds
       - Calls `startGameWithPlayers()` to create new game
     - If not enough players:
       - Returns remaining players to lobby
       - They wait for more players to join

### Client-Side Handling

1. **Game Ended Event** (`multiplayerState.svelte.ts`)
   - Receives `game-ended` event from server
   - If `victory === false` (all players died):
     - Sets `multiplayerStatus = 'lobby'`
     - Shows waiting room screen
     - Player stays connected and ready
   - If `victory === true` (someone won):
     - Shows final victory/defeat screen
     - Player can manually restart

2. **UI Updates** (`LobbyScreen.svelte`)
   - Shows waiting room with all players who died
   - Displays "La partie va bientôt commencer!" when ready
   - Shows hint: "(Redémarrage automatique après défaite)"

## Configuration

### Server Config

```typescript
// In GameManager.ts
const restartDelay = 5000; // 5 seconds delay before restart
```

### Minimum Players

Uses the same `MIN_PLAYERS` setting from server config:
```bash
MIN_PLAYERS=2  # Default: 2 players required
```

## User Experience

### Scenario 1: All Players Die
1. All players lose their last life
2. Game ends with "Défaite totale"
3. Screen shows: "All players died - waiting for game restart..."
4. Returns to waiting room showing all players
5. After 5 seconds, server broadcasts wave-started for new game
6. New game begins automatically

### Scenario 2: Someone Wins
1. At least one player survives all waves
2. Winners see "VICTOIRE!" screen
3. Losers see "GAME OVER" screen
4. Shows final statistics
5. No automatic restart (end of session)

### Scenario 3: Player Disconnects During Restart
1. Some players die, some disconnect
2. Server counts remaining connected players
3. If still ≥ MIN_PLAYERS: restart with remaining players
4. If < MIN_PLAYERS: return to lobby, wait for new players

## Flow Diagrams

### Victory Flow
```
Game → At least 1 survives → game-ended(victory=true)
    → Client shows victory/defeat screen
    → Session ends
```

### Total Defeat Flow
```
Game → All players die → game-ended(victory=false)
    → Client returns to lobby
    → Server sends lobby-update
    → Wait 5 seconds
    → Server starts new game
    → game-started event
    → New game begins
```

## Implementation Details

### Key Changes

**GameInstance.ts:**
- Added `onGameEnd` callback property
- Added `setOnGameEnd()` method
- Added `getConnections()` method
- Modified `endGame()` to call callback

**GameManager.ts:**
- Added `startGameWithPlayers()` helper method
- Added `handleGameEnd()` callback handler
- Modified `startGameFromLobby()` to use new helper
- Sets up callback when creating game instances

**multiplayerState.svelte.ts:**
- Modified `handleGameEnded()` to check victory flag
- Returns to lobby on total defeat instead of ended state
- Keeps connection alive for restart

**LobbyScreen.svelte:**
- Added hint about auto-restart feature
- Shows waiting room properly during restart

## Benefits

1. **Better UX**: No need to manually reconnect
2. **Continuous Play**: Keep playing until victory
3. **Social**: Keeps players together as a group
4. **Less Friction**: Automatic retry mechanism
5. **Competitive**: Encourages teams to improve together

## Edge Cases Handled

- ✅ Player disconnects during game end
- ✅ Not enough players remain after deaths
- ✅ Connection errors during restart notification
- ✅ Invalid stream references
- ✅ Timing issues with WebSocket messages

## Testing Checklist

- [ ] Start game with 2 players
- [ ] Both players die
- [ ] Verify lobby screen appears
- [ ] Wait 5 seconds
- [ ] Verify new game starts automatically
- [ ] Test with player disconnect during restart
- [ ] Test with multiple consecutive restarts
- [ ] Verify dashboard shows new game correctly
