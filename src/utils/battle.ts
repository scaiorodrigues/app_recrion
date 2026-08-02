/**
 * Lógica de combate por turnos.
 * O resultado é calculado matematicamente; a animação apenas reproduz os turnos.
 */

import { ELEMENT_CHART } from '@/constants/game';
import type { Attack, CrionStats, Element } from '@/types';

export const MULTIPLIER_STRONG = 1.5;
export const MULTIPLIER_WEAK = 0.5;
export const MULTIPLIER_NEUTRAL = 1.0;

/** Cura de HEAL_SELF e de HEAL_ALL quando usado em combate solo. */
const HEAL_SELF_RATIO = 0.2;
const HEAL_ALL_SOLO_RATIO = 0.25;

export function getElementMultiplier(attackElement: Element, defenderElement: Element): number {
  const chart = ELEMENT_CHART[attackElement];
  if (!chart) return MULTIPLIER_NEUTRAL;

  if (chart.strongAgainst.includes(defenderElement)) return MULTIPLIER_STRONG;
  if (chart.weakAgainst.includes(defenderElement)) return MULTIPLIER_WEAK;
  return MULTIPLIER_NEUTRAL;
}

/**
 * Dano de um golpe. Retorna 0 quando o ataque erra.
 * IGNORE_DEFENSE trata a defesa do inimigo como 1 — exclusivo de Lendários.
 */
export function calculateDamage(
  attacker: CrionStats,
  defender: CrionStats,
  attack: Attack,
  /** Injetável para tornar o combate testável e determinístico. */
  random: () => number = Math.random,
): number {
  const hit = random() < attack.accuracy / 100;
  if (!hit) return 0;

  const multiplier = getElementMultiplier(attack.element, defender.element);
  const effectiveDef = attack.effect === 'IGNORE_DEFENSE' ? 1 : Math.max(1, defender.def);

  const baseDamage = (attacker.atk / effectiveDef) * attack.power * multiplier;
  return Math.max(1, Math.floor(baseDamage));
}

/** Cura aplicada por ataques de Luz. 0 para ataques sem efeito de cura. */
export function calculateHeal(attack: Attack, maxHP: number): number {
  if (attack.effect === 'HEAL_SELF') return Math.floor(maxHP * HEAL_SELF_RATIO);
  // Sem multiplayer ainda, HEAL_ALL cura só o próprio Crion, com valor maior.
  if (attack.effect === 'HEAL_ALL') return Math.floor(maxHP * HEAL_ALL_SOLO_RATIO);
  return 0;
}

export interface BattleTurn {
  turn: number;
  actor: 'player' | 'enemy';
  attackName: string;
  damage: number;
  heal: number;
  multiplier: number;
  missed: boolean;
  playerHP: number;
  enemyHP: number;
}

export interface BattleResult {
  winner: 'player' | 'enemy';
  turns: BattleTurn[];
}

const MAX_TURNS = 30;

/**
 * Simula o combate inteiro de uma vez.
 * Quem tem mais velocidade começa; empate favorece a criança.
 */
export function simulateBattle(
  player: CrionStats,
  playerAttack: Attack,
  enemy: CrionStats,
  enemyAttack: Attack,
  random: () => number = Math.random,
): BattleResult {
  const turns: BattleTurn[] = [];
  const playerMaxHP = player.hp;
  const enemyMaxHP = enemy.hp;

  let playerHP = player.hp;
  let enemyHP = enemy.hp;
  let playerFirst = player.spd >= enemy.spd;

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const order: ('player' | 'enemy')[] = playerFirst
      ? ['player', 'enemy']
      : ['enemy', 'player'];

    for (const actor of order) {
      if (playerHP <= 0 || enemyHP <= 0) break;

      const isPlayer = actor === 'player';
      const attack = isPlayer ? playerAttack : enemyAttack;
      const attacker = isPlayer ? player : enemy;
      const defender = isPlayer ? enemy : player;

      const damage = calculateDamage(attacker, defender, attack, random);
      const heal = calculateHeal(attack, isPlayer ? playerMaxHP : enemyMaxHP);

      if (isPlayer) {
        enemyHP = Math.max(0, enemyHP - damage);
        playerHP = Math.min(playerMaxHP, playerHP + heal);
      } else {
        playerHP = Math.max(0, playerHP - damage);
        enemyHP = Math.min(enemyMaxHP, enemyHP + heal);
      }

      turns.push({
        turn,
        actor,
        attackName: attack.name,
        damage,
        heal,
        multiplier: getElementMultiplier(attack.element, defender.element),
        missed: damage === 0,
        playerHP,
        enemyHP,
      });
    }

    if (playerHP <= 0 || enemyHP <= 0) break;
    playerFirst = player.spd >= enemy.spd;
  }

  // Se o limite de turnos estourar, vence quem tem mais HP proporcional.
  const winner =
    enemyHP <= 0
      ? 'player'
      : playerHP <= 0
        ? 'enemy'
        : playerHP / playerMaxHP >= enemyHP / enemyMaxHP
          ? 'player'
          : 'enemy';

  return { winner, turns };
}
