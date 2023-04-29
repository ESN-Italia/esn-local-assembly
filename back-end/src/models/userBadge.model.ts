import { epochISOString, Resource } from 'idea-toolbox';

/**
 * The badge earned by a user.
 */
export class UserBadge extends Resource {
  /**
   * The ID of the user who have earned the badge.
   */
  userId: string;
  /**
   * The badge earned.
   */
  badge: Badges;
  /**
   * When the badge was earned.
   */
  earnedAt: epochISOString;
  /**
   * Whether and when the badge was first seen.
   */
  firstSeenAt?: epochISOString;

  load(x: any): void {
    super.load(x);
    this.userId = this.clean(x.userId, String);
    this.badge = this.clean(x.badge, String);
    this.earnedAt = this.clean(x.earnedAt, d => new Date(d).toISOString(), new Date().toISOString());
    if (x.firstSeenAt) this.firstSeenAt = this.clean(x.firstSeenAt, d => new Date(d).toISOString());
  }
}

/**
 * The available badges to earn while performing actions in the platform.
 */
export enum Badges {
  CHAIRING_WIZARD = 'CHAIRING_WIZARD',
  CHEERGIVER = 'CHEERGIVER',
  ENERGY_DRIVER = 'ENERGY_DRIVER',
  FABULOUS_SCRIBE = 'FABULOUS_SCRIBE',
  FIRST_QUESTION = 'FIRST_QUESTION',
  JOKER = 'JOKER',
  KNOW_IT_ALL = 'KNOW_IT_ALL',
  LOVE_GIVER = 'LOVE_GIVER',
  MIC_CATCHER = 'MIC_CATCHER',
  NEWCOMER = 'NEWCOMER',
  ONLOOKER = 'ONLOOKER',
  PEER_PRESSURE_MINHO = 'PEER_PRESSURE_MINHO',
  PLENARIES_RUNNER = 'PLENARIES_RUNNER',
  POKEMON_HUNTER = 'POKEMON_HUNTER',
  QUESTIONS_MASTER = 'QUESTIONS_MASTER',
  RISING_STAR = 'RISING_STAR',
  SHOW_MAKER = 'SHOW_MAKER',
  SPECTATOR = 'SPECTATOR',
  MEDUSA = 'MEDUSA',
  RAPID_ROCKET_SPEAKER = 'RAPID_ROCKET_SPEAKER'
}
