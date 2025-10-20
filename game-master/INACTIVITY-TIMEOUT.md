# Inactivity Timeout Feature

## Overview

Players who don't send any game events (kills, deaths, wave completion) for 40 seconds during a wave are automatically marked as dead. This prevents games from being blocked indefinitely by AFK (away from keyboard) or disconnected players.

## Why This Feature?

### Problems It Solves:
1. **AFK Players**: Players who leave their computer during a wave
2. **Network Issues**: Players with connection problems who can't send disconnect events
3. **Browser Tab Issues**: Players who close/minimize tab without proper disconnection
4. **Game Blocking**: Other players stuck waiting for inactive player to complete wave
5. **Server Resources**: Games hanging indefinitely waiting for inactive players

## How It Works

### Timer Lifecycle

**1. Timer Start:**
- When a wave begins (`wave-started` event)
- Timer created for each alive player
- Default duration: 40 seconds

**2. Timer Reset:**
- Player kills an enemy (`enemy-killed` event)
- Player gets hit (`player-touched` event)
- Timer resets to 40 seconds

**3. Timer Clear:**
- Player completes wave (`wave-cleared` event)
- Player dies (`player-killed` event)
- Player disconnects (`player-disconnected` event)
- Wave ends for any reason

**4. Timeout Triggered:**
- After 40 seconds with no events from player
- Player automatically marked as dead:
  - `isAlive = false`
  - `hasClearedWave = true`
  - `lives = 0`
- Wave completion check triggered
- Warning logged to server

### Event Flow

```
Wave Start
    ↓
Start Timers (all alive players)
    ↓
Player Activity? (kill/hit)
    ├─ Yes → Reset Timer
    └─ No → Continue countdown
         ↓
    40 seconds elapsed?
         ↓
    Mark player as DEAD
         ↓
    Check wave completion
```

## Configuration

### Default Settings

```typescript
// In gameConfig.ts
SERVER_CONFIG = {
  inactivityTimeout: 40000  // 40 seconds in milliseconds
}
```

### Environment Variable

```bash
INACTIVITY_TIMEOUT=40000  # Change timeout (in milliseconds)
```

### Examples:
- `30000` = 30 seconds (faster detection)
- `60000` = 60 seconds (more lenient)
- `120000` = 2 minutes (very lenient)

## Implementation Details

### Server-Side (`GameInstance.ts`)

**Key Components:**

1. **Timer Map**: `playerActivityTimers: Map<string, NodeJS.Timeout>`
   - Stores one timer per active player
   - Keyed by player pseudo

2. **Methods:**
   - `startInactivityTimers()` - Initialize all timers at wave start
   - `startInactivityTimer(pseudo)` - Create timer for one player
   - `resetInactivityTimer(pseudo)` - Clear and restart timer (activity detected)
   - `clearInactivityTimer(pseudo)` - Remove timer (player done)
   - `clearAllInactivityTimers()` - Clean up all timers (game/wave end)
   - `handlePlayerInactivity(pseudo)` - Timeout triggered, mark dead

3. **Integration Points:**
   - `handlePlayerTouched()` - Reset timer
   - `handleEnemyKilled()` - Reset timer
   - `handleWaveCleared()` - Clear timer
   - `handlePlayerKilled()` - Clear timer
   - `handlePlayerDisconnected()` - Clear timer
   - `startNextWave()` - Start all timers
   - `endGame()` - Clear all timers

### Logging

**DEBUG Level:**
```
Started inactivity timer for PlayerName
Cleared inactivity timer for PlayerName
```

**WARN Level:**
```
Game game-123: PlayerName inactive for 40s, marking as dead
```

## User Experience

### Normal Play
- Player is active, constantly killing enemies or getting hit
- Timer resets frequently
- Player never notices the feature

### AFK Scenario
1. Player walks away during wave
2. No keyboard/mouse input for 40 seconds
3. Server marks player as dead
4. Other players can continue/complete wave
5. Game doesn't hang

### Disconnect Scenario
1. Player loses internet connection
2. No WebSocket disconnect event sent
3. Player becomes inactive
4. After 40 seconds, marked as dead
5. Game continues normally

### False Positives?
**Very unlikely** because:
- 40 seconds is a long time
- Players need to shoot or move to progress
- Even slow players will trigger events
- Only affects truly inactive/disconnected players

## Edge Cases Handled

✅ **Player clears wave before timeout** - Timer cleared, no issue
✅ **Player dies before timeout** - Timer cleared, normal death
✅ **Player disconnects before timeout** - Timer cleared, normal disconnect
✅ **Multiple timers per player** - Old timers cleared before new ones start
✅ **Game ends before timeout** - All timers cleared
✅ **Player already dead when timeout fires** - Check prevents double-processing
✅ **Timeout fires between waves** - Player state check prevents false triggers

## Testing Checklist

- [ ] Start wave with 2 players
- [ ] Have one player stop sending events (close tab without disconnect)
- [ ] Wait 40 seconds
- [ ] Verify inactive player marked as dead in server logs
- [ ] Verify active player can complete wave
- [ ] Verify game continues normally
- [ ] Test with player who dies before timeout (should work normally)
- [ ] Test with player who completes wave before timeout (should work normally)
- [ ] Test timeout with auto-restart feature

## Benefits

1. **Improved UX** - Active players aren't stuck waiting
2. **Server Health** - Games don't hang indefinitely
3. **Fair Play** - AFK players don't block others
4. **Automatic Recovery** - No manual intervention needed
5. **Resource Management** - Prevents memory leaks from hanging games

## Related Features

Works seamlessly with:
- ✅ **Auto-restart** - Timeout ensures all-dead scenario triggers restart
- ✅ **Wave synchronization** - Inactive players don't block next wave
- ✅ **Disconnect handling** - Backup for failed disconnect events
- ✅ **Dashboard** - Shows player as dead after timeout

## Monitoring

### Server Logs
```bash
# Watch for inactive players
grep "inactive for" server.log

# Count timeouts
grep -c "marking as dead" server.log
```

### Metrics to Track
- How often timeout triggers vs normal deaths
- Average time before timeout (if logs track activity gaps)
- Impact on game completion rates

## Future Enhancements

Possible improvements:
- [ ] Configurable per-wave timeout (harder waves = longer timeout)
- [ ] Warning message to player at 30 seconds
- [ ] Client-side heartbeat to confirm true disconnection
- [ ] Grace period for first-time offenders
- [ ] Dashboard notification of timeout events
