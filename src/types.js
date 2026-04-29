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
