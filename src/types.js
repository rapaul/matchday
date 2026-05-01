/**
 * @typedef {'PENDING'|'LIVE'|'HALF_TIME'|'FINISHED'} MatchStatus
 * @typedef {'FIELD'|'BENCH'|'GOALIE'} StintRole
 */

/**
 * @typedef {Object} Player
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {Object} Match
 * @property {string} id
 * @property {string} opponent
 * @property {number} halfLengthSec
 * @property {MatchStatus} status
 * @property {number} goalsUs
 * @property {number} goalsThem
 * @property {string|null} potdPlayerId
 * @property {number} createdAt  - epoch ms
 * @property {number} clockElapsedSec  - seconds accumulated while clock was running (excluding the current run)
 * @property {number|null} clockStartWall  - epoch ms when the clock was last resumed; null when paused
 * @property {number|null} secondHalfStartSec  - clock seconds at which the second half kicked off; null until half-time happens
 * @property {boolean} [archived]  - true when the match is hidden from the main list and excluded from stats
 */

/**
 * @typedef {Object} Stint
 * @property {string} id
 * @property {string} matchId
 * @property {string} playerId
 * @property {StintRole} role
 * @property {number} startSec   - match clock seconds
 * @property {number|null} endSec
 */
