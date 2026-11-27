// A small seeded random source (mulberry32) so a screenshot run with
// ?seed=N always stages the same world, and a real run is different
// every time. Nothing here touches Math.random, so the seed is the
// whole story of a run's obstacle pattern.
export function createRandom(seed) {
  let a = seed >>> 0;
  return {
    // A float in [0, 1).
    next() {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    // An integer in [min, max] inclusive.
    int(min, max) {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    // One item from an array, uniformly.
    pick(items) {
      return items[Math.floor(this.next() * items.length)];
    },
    // True with probability p.
    chance(p) {
      return this.next() < p;
    },
  };
}
