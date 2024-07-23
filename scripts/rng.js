class RNG {
  constructor(seed) {
    // LCG using GCC's constants
    this.m = 0x80000000; // 2**31;
    this.a = 1103515245;
    this.c = 12345;

    this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
  }

  NextInt() {
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state;
  }

  NextFloat() {
    // returns in range [0,1]
    return this.NextInt() / (this.m - 1);
  }

  NextInRange(start, end) {
    // returns in range [start, end): including start, excluding end
    // can't modulu NextInt because of weak randomness in lower bits
    const rangeSize = end - start;
    const randomUnder1 = this.NextInt() / this.m;
    return start + Math.floor(randomUnder1 * rangeSize);
  }

  Choice(array) {
    return array[this.NextInRange(0, array.length)];
  }
}