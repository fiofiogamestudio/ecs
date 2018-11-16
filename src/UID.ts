/**
 * @module  uid
 */
/*
 * UIDGenerator for multi-instance Entity Component System
 * Generate numeric unique ids for ECS entities. The requirements are:
 *  * generate Numbers for fast comparaison, low storage and bandwidth usage
 *  * generators can be salted so you can use multiple generators with 
 *  uniqueness guaranty
 *  * each salted generator can generate reasonable amount of unique ids
 */

// maximum number of salted generators that can run concurently, once the
// number of allowed generators has been reached the salt of the next 
// generator is silently reset to 0
const MAX_SALTS = 10000

const MAX_ENTITY_PER_GENERATOR = Math.floor(Number.MAX_SAFE_INTEGER /
  MAX_SALTS) - 1
let currentSalt = 0

/**
 * Generate unique sequences of Numbers. Can be salted (up to 9999 salts)
 * to generate differents ids.
 *
 * To work properly, ECS needs to associate an unique id with each entity. But
 * to preserve efficiency, the unique id must be a Number (more exactly a safe
 * integer).
 *
 * The basic implementation would be an incremented Number to generate a unique
 * sequence, but this fails when several ecs instances are running and creating
 * entities concurrently (e.g. in a multiplayer networked game). To work around
 * this problem, ecs provide UIDGenerator class which allow you to salt your
 * generated ids sequence. Two generators with different salts will NEVER
 * generate the same ids.
 *
 * Currently, there is a maxumum of 9999 salts and about 900719925473 uid per
 * salt. These limits are hard-coded, but I plan to expose these settings in
 * the future.
 *
 * @class  UIDGenerator
 */
export class UIDGenerator {
  salt: number;
  uidCounter: number;
  /**
   * @constructor
   * @class  UIDGenerator
   * @param  {Number} [salt=0] The salt to use for this generator. Number
   * between 0 and 9999 (inclusive).
   */
  constructor(salt: number = 0) {
    /**
     * The salt of this generator.
     * @property {Number} salt
     */
    this.salt = salt

    /**
     * The counter used to generate unique sequence.
     * @property {Number} uidCount
     */
    this.uidCounter = 0
  }

  /**
   * Create a new unique id.
   *
   * @return {Number} An unique id.
   */
  next(): number {
    let nextUid = this.salt + this.uidCounter * MAX_SALTS

    // if we exceed the number of maximum entities (which is
    // very high) reset the counter.
    if (++this.uidCounter >= MAX_ENTITY_PER_GENERATOR) {
      this.uidCounter = 0
    }

    return nextUid
  }
}

/**
 * The default generator to use if an entity is created without id or generator instance.
 *
 * @property {UIDGenerator} DefaultUIDGenerator
 */
export const DefaultUIDGenerator = new UIDGenerator(currentSalt++)

export const isSaltedBy = (entityId: number, salt: number) => entityId % MAX_SALTS === salt

/**
 * Return the next unique salt.
 *
 * @method  nextSalt
 * @return {Number} A unique salt.
 */
export const nextSalt = (): number => {
  let salt = currentSalt

  // if we exceed the number of maximum salts, silently reset
  // to 1 (since 0 will always be the default generator)
  if (++currentSalt > MAX_SALTS - 1) {
    currentSalt = 1
  }

  return salt
}

/**
 * Create a new generator with unique salt.
 *
 * @method  nextGenerator
 * @return {UIDGenerator} The created UIDGenerator.
 */
export const nextGenerator = (): UIDGenerator => new UIDGenerator(nextSalt());
