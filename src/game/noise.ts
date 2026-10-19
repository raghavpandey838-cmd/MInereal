/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Lightweight 2D & 3D Perlin noise generator with seed support
export class PerlinNoise {
  private p: number[] = [];

  constructor(seed: number = 1337) {
    const permutation: number[] = [];
    for (let i = 0; i < 256; i++) {
      permutation[i] = i;
    }

    // Shuffle using seed
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;

    const nextRandom = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };

    for (let i = 255; i > 0; i--) {
      const j = Math.floor(nextRandom() * (i + 1));
      const tmp = permutation[i];
      permutation[i] = permutation[j];
      permutation[j] = tmp;
    }

    this.p = new Array(512);
    for (let i = 0; i < 512; i++) {
      this.p[i] = permutation[i & 255];
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  public noise2D(x: number, y: number): number {
    return this.noise3D(x, y, 0.5);
  }

  public noise3D(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    const fx = x - Math.floor(x);
    const fy = y - Math.floor(y);
    const fz = z - Math.floor(z);

    const u = this.fade(fx);
    const v = this.fade(fy);
    const w = this.fade(fz);

    const A = this.p[X] + Y;
    const AA = this.p[A] + Z;
    const AB = this.p[A + 1] + Z;
    const B = this.p[X + 1] + Y;
    const BA = this.p[B] + Z;
    const BB = this.p[B + 1] + Z;

    return this.lerp(
      w,
      this.lerp(
        v,
        this.lerp(u, this.grad(this.p[AA], fx, fy, fz), this.grad(this.p[BA], fx - 1, fy, fz)),
        this.lerp(u, this.grad(this.p[AB], fx, fy - 1, fz), this.grad(this.p[BB], fx - 1, fy - 1, fz))
      ),
      this.lerp(
        v,
        this.lerp(u, this.grad(this.p[AA + 1], fx, fy, fz - 1), this.grad(this.p[BA + 1], fx - 1, fy, fz - 1)),
        this.lerp(u, this.grad(this.p[AB + 1], fx, fy - 1, fz - 1), this.grad(this.p[BB + 1], fx - 1, fy - 1, fz - 1))
      )
    );
  }

  // Fractal Brownian Motion (Octaves)
  public fbm2D(x: number, y: number, octaves: number = 4, persistence: number = 0.5): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }
}
