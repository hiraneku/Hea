import { Vector3 } from 'three';
import { rayBoxSpan, type Obstacle } from './math';
import { HEAVY } from './config';
import { PROJECTILES, projectileOf, type AttackId } from './combat';

export interface FiringLane {
  mode: 'clear' | 'breach' | 'blocked';
  walls: number[];
  thickness: number;
}
/** Non-mutating assessment of the entire firing corridor, including all remaining voxel runs. */
export function assessFiringLane(
  from: Vector3,
  target: Vector3,
  attack: AttackId,
  obstacles: Obstacle[],
): FiringLane {
  const ray = target.clone().sub(from),
    distance = ray.length();
  if (distance < 0.001) return { mode: 'blocked', walls: [], thickness: 0 };
  ray.divideScalar(distance);
  const radius = PROJECTILES[projectileOf(attack)].radius;
  const limit = Math.max(0, distance - radius - 0.72),
    groups = new Map<number, { enter: number; exit: number }[]>();
  for (const box of obstacles) {
    const padded = {
      ...box,
      minX: box.minX - radius,
      maxX: box.maxX + radius,
      minZ: box.minZ - radius,
      maxZ: box.maxZ + radius,
      bottom: (box.bottom ?? 0) - radius,
      top: box.top + radius,
    };
    if (!rayBoxSpan(from, ray, padded, limit)) continue;
    // Bolts and the vortex seed break on any wall; only missiles and the hammer chew through.
    if (attack === 'fire' || attack === 'vortex' || box.owner === undefined)
      return { mode: 'blocked', walls: [], thickness: Infinity };
    const span = rayBoxSpan(from, ray, box, limit);
    const list = groups.get(box.owner) ?? [];
    // Radius-only grazes can be chipped away, but never allow firing through fixed scenery.
    list.push(span ?? { enter: 0, exit: 0 });
    groups.set(box.owner, list);
  }
  const maxDepth = attack === 'hammer' ? HEAVY.thinDepth : 1.4;
  let max = 0;
  for (const spans of groups.values()) {
    spans.sort((a, b) => a.enter - b.enter);
    let start = spans[0].enter,
      end = spans[0].exit;
    for (let i = 1; i <= spans.length; i++) {
      if (i < spans.length && spans[i].enter <= end + 0.04) {
        end = Math.max(end, spans[i].exit);
        continue;
      }
      max = Math.max(max, end - start);
      if (end - start > maxDepth)
        return { mode: 'blocked', walls: [...groups.keys()], thickness: max };
      if (i < spans.length) {
        start = spans[i].enter;
        end = spans[i].exit;
      }
    }
  }
  return { mode: groups.size ? 'breach' : 'clear', walls: [...groups.keys()], thickness: max };
}
