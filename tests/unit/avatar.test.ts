import { describe, it, expect } from 'vitest';
import { POSE_CLIPS, avatarPose } from '../../src/game/Avatar';

describe('the avatar silhouette', () => {
  it('picks a clip from the body state alone', () => {
    expect(avatarPose({ speed: 0, airborne: false, dead: false })).toBe('idle');
    expect(avatarPose({ speed: 2.4, airborne: false, dead: false })).toBe('walk');
    expect(avatarPose({ speed: 12, airborne: false, dead: false })).toBe('run');
    expect(avatarPose({ speed: 0, airborne: true, dead: false })).toBe('air');
  });

  it('outranks everything with death, and air over speed', () => {
    expect(avatarPose({ speed: 14, airborne: true, dead: true })).toBe('dead');
    expect(avatarPose({ speed: 22, airborne: true, dead: false })).toBe('air');
  });

  it('matches each pose to a clip the asset ships', () => {
    expect(Object.keys(POSE_CLIPS).sort()).toEqual(['air', 'dead', 'idle', 'run', 'walk']);
    expect(new Set(Object.values(POSE_CLIPS)).size).toBe(5);
    // The thresholds split the speeds the game actually uses: walking pace and flight cruise.
    const cruise = 21;
    expect(avatarPose({ speed: cruise, airborne: false, dead: false })).toBe('run');
  });
});
