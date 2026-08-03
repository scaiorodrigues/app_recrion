/**
 * Tipos centrais do Recrion.
 * Elementos, faixas etárias, Crions, cartas, atividades e comportamento.
 */

// ---------------------------------------------------------------------------
// Elementos e faixas
// ---------------------------------------------------------------------------

/** Elementos jogáveis — gerados pelo desempenho da criança. */
export type PlayableElement =
  | 'NATURE'
  | 'FIRE'
  | 'WATER'
  | 'EARTH'
  | 'METAL'
  | 'WIND'
  | 'ELECTRIC'
  | 'LIGHT';

/** ICE_NPC só existe em inimigos do tabuleiro; LEGENDARY é exclusivo da Torre. */
export type Element = PlayableElement | 'ICE_NPC' | 'LEGENDARY';

export type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type Tier = 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4';

/** Matérias acadêmicas — 'comportamento' é validado, não pontuado. */
export type AcademicSubject =
  | 'portugues'
  | 'matematica'
  | 'ingles'
  | 'ciencias'
  | 'logica'
  | 'arte'
  | 'musica';

export type Subject = AcademicSubject | 'comportamento';

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

// ---------------------------------------------------------------------------
// Crions e ataques
// ---------------------------------------------------------------------------

export type StatusEffect =
  | 'BURN'
  | 'FREEZE'
  | 'PARALYZE'
  | 'CONFUSE'
  | 'HEAL_SELF'
  | 'HEAL_ALL'
  | 'IGNORE_DEFENSE';

export type AttackSlot = 1 | 2 | 3 | 4;

export interface Attack {
  id: string;
  name: string;
  element: Element;
  /** 20–120 */
  power: number;
  /** 70–100 (%) */
  accuracy: number;
  description: string;
  /** XP mínimo do dia para desbloquear a carta com este ataque. */
  unlockXP: number;
  slot: AttackSlot;
  effect?: StatusEffect;
  /**
   * Prompts de arte desta carta — a criatura executando ESTE ataque.
   * O mesmo Crion aparece em poses diferentes conforme o ataque.
   */
  art: ArtLayerPrompts;
}

/**
 * As quatro camadas do desenho da carta, de cima para baixo:
 * a criatura, o efeito em volta dela, o fundo e o efeito que liga
 * o fundo aos contornos da carta.
 */
export interface ArtLayerPrompts {
  /** Camada 1 — a criatura na pose do ataque. */
  creature: string;
  /** Camada 2 — o efeito elemental em volta da criatura. */
  effect: string;
  /** Camada 3 — o cenário atrás dela. */
  background: string;
  /** Camada 4 — o efeito que sangra do fundo para a borda da carta. */
  edge: string;
}

/** Imagens já geradas para as quatro camadas. Cada uma pode faltar. */
export interface ArtLayerUris {
  creature?: string;
  effect?: string;
  background?: string;
  edge?: string;
}

export type UnlockConditionType =
  | 'DEFAULT'
  | 'BEHAVIOR_APPROVED'
  | 'BEHAVIOR_STREAK'
  | 'SUBJECT_STREAK'
  | 'XP_TOTAL';

export interface UnlockCondition {
  type: UnlockConditionType;
  days?: number;
  xp?: number;
  subject?: AcademicSubject;
}

export interface Crion {
  id: string;
  name: string;
  baseAnimal: string;
  /** Emoji do animal base — placeholder enquanto não há arte gerada. */
  baseEmoji: string;
  element: Element;
  secondaryElement?: Element;
  rarity: Rarity;
  /** Faixa etária mínima para o Crion aparecer. */
  tier: Tier;

  baseHP: number;
  baseAtk: number;
  baseDef: number;
  baseSpd: number;

  attacks: Attack[];

  description: string;
  habitat: string;
  /** Prompt de referência da criatura, usado como base pelas camadas. */
  imagePrompt: string;
  /** Subtítulo da carta, no estilo "Dragão de Elite". */
  epithet: string;

  unlockCondition: UnlockCondition;
}

/** Quanto cada matéria contribuiu para a carta — exibido na frente. */
export interface ElementContribution {
  subject: Subject;
  element: Element;
  /** Nota da matéria no dia, 0 a 100. */
  value: number;
  /** true para a matéria que definiu o elemento da carta. */
  primary: boolean;
}

/** Atributos finais da carta, já somados os ganhos do dia. */
export interface FinalStats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  /** Quanto veio do desempenho, acima do valor base do Crion. */
  bonusAtk: number;
  bonusDef: number;
}

/** Estatísticas usadas em combate. */
export interface CrionStats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  element: Element;
}

// ---------------------------------------------------------------------------
// Cartas — um Crion usando um ataque específico
// ---------------------------------------------------------------------------

export interface CrionCardData {
  id: string;
  crionId: string;
  childId: string;
  /** 'YYYY-MM-DD' */
  date: string;
  attackSlot: AttackSlot;
  rarity: Rarity;
  element: Element;
  secondaryElement?: Element;
  /** XP total do dia que gerou a carta. */
  xp: number;
  /** Matéria dominante do dia. */
  primarySubject: Subject;
  childName: string;
  imageUri?: string;
  revealedAt?: string;
  /** Carta holográfica — só sai em dia perfeito. */
  foil?: boolean;
  /** Matérias que alimentaram a carta, com suas notas. */
  contributions?: ElementContribution[];
  /** Atributos finais, já com o ganho do dia. */
  stats?: FinalStats;
  /** Camadas de arte já geradas para esta carta. */
  artUris?: ArtLayerUris;
  /** Fração das atividades do dia que foram aprovadas (0 a 1). */
  completionRate?: number;
  /** Dias seguidos de constância no momento em que a carta nasceu. */
  streak?: number;
}

/** Como o dia da criança se saiu — entrada do cálculo de raridade. */
export interface DayPerformance {
  /** Atividades disponíveis para a criança no dia. */
  available: number;
  /** Quantas foram aprovadas pelo responsável. */
  approved: number;
  /** Média das notas aprovadas (0 a 100). */
  averageScore: number;
  /** true se o responsável validou todas as obrigações de comportamento. */
  behaviorApproved: boolean;
  /** true se havia obrigações de comportamento configuradas no dia. */
  behaviorRequired: boolean;
  /** Dias consecutivos de constância, incluindo hoje. */
  streak: number;
  /**
   * true quando toda atividade aprovada saiu certa na primeira tentativa,
   * sem o responsável mandar refazer nenhuma.
   */
  allFirstTry: boolean;
}

// ---------------------------------------------------------------------------
// Usuários e vínculo pai ↔ filho
// ---------------------------------------------------------------------------

export type UserRole = 'parent' | 'child';

export interface ParentProfile {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  childIds: string[];
  createdAt: string;
}

export interface ChildProfile {
  id: string;
  parentId: string;
  name: string;
  /** 'YYYY-MM-DD' — define o tier automaticamente. */
  birthDate: string;
  tier: Tier;
  /** UID Google do filho, preenchido ao usar o código de convite. */
  linkedUid?: string;
  avatarEmoji: string;
  createdAt: string;
}

export interface InviteCode {
  code: string;
  childProfileId: string;
  parentId: string;
  /** ISO 8601 — expira em 7 dias. */
  expiresAt: string;
  usedAt?: string;
  usedByUid?: string;
}

// ---------------------------------------------------------------------------
// Atividades acadêmicas
// ---------------------------------------------------------------------------

export type ActivityStatus =
  | 'AVAILABLE'
  | 'IN_PROGRESS'
  | 'PENDING_VALIDATION'
  | 'APPROVED'
  | 'PARTIALLY_APPROVED'
  | 'PENDING_REDO';

export interface DailyActivity {
  id: string;
  childId: string;
  /** 'YYYY-MM-DD' */
  date: string;
  subject: AcademicSubject;
  tier: Tier;
  status: ActivityStatus;
  /** 0–100, calculado pela atividade. */
  score: number;
  /** Score após validação do pai (aprovação parcial reduz por 0.5). */
  validatedScore?: number;
  startedAt?: string;
  completedAt?: string;
  validatedAt?: string;
  durationSeconds?: number;
  /**
   * Quantas vezes o responsável mandou refazer.
   * Zero significa que a criança acertou de primeira — condição da Lendária.
   */
  redoCount?: number;
}

/** Pontuação por matéria em um dia. */
export type SubjectScores = Partial<Record<AcademicSubject, number>>;

export interface Bonuses {
  streak7Days: boolean;
  earlyCompletion: boolean;
  allSubjects: boolean;
  behaviorAllDone: boolean;
  total: number;
}

// ---------------------------------------------------------------------------
// Comportamento (elemento Luz)
// ---------------------------------------------------------------------------

export type BehaviorCategoryId =
  | 'HYGIENE'
  | 'HOME'
  | 'STUDY'
  | 'SOCIAL'
  | 'HEALTH';

export interface BehaviorCategory {
  id: BehaviorCategoryId;
  label: string;
  emoji: string;
  color: string;
  description: string;
}

export interface SuggestedDuty {
  id: string;
  category: BehaviorCategoryId;
  label: string;
  emoji: string;
  tiers: Tier[];
}

export interface Duty {
  id: string;
  childId: string;
  category: BehaviorCategoryId;
  label: string;
  emoji: string;
  /** true = criada pelo pai; false = veio da lista sugerida. */
  isCustom: boolean;
  activeDays: DayOfWeek[];
  isActive: boolean;
  createdAt: string;
}

export type DutyStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';

export interface DailyDutyRecord {
  id: string;
  dutyId: string;
  childId: string;
  /** 'YYYY-MM-DD' */
  date: string;
  markedDoneByChild: boolean;
  markedDoneAt?: string;
  status: DutyStatus;
  validatedByParentAt?: string;
  parentNote?: string;
}

export interface DailyBehaviorSummary {
  childId: string;
  date: string;
  totalDuties: number;
  completedByChild: number;
  approvedByParent: number;
  /** true = elemento Luz ativado no Crion do dia. */
  allApproved: boolean;
  lightBonusXP: number;
}

// ---------------------------------------------------------------------------
// Tabuleiro
// ---------------------------------------------------------------------------

export interface World {
  id: string;
  name: string;
  theme: string;
  elements: Element[];
  minTier: Tier;
  /** Exige que o Crion do dia seja deste elemento para entrar. */
  requiresElement: Element | null;
}

export interface BoardEnemy {
  id: string;
  worldId: string;
  quadrant: number;
  name: string;
  element: Element;
  stats: CrionStats;
  attacks: Attack[];
}

// ---------------------------------------------------------------------------
// Assinatura
// ---------------------------------------------------------------------------

export type SubscriptionTier = 'free' | 'subject' | 'bundle';

export interface SubscriptionState {
  tier: SubscriptionTier;
  activeSubjects: AcademicSubject[];
  expiresAt?: string;
  /** ISO 8601 — início do teste gratuito de 3 dias. */
  trialStartedAt?: string;
}

/** O que a criança pode acessar agora, já considerando o teste. */
export interface AccessState {
  /** true enquanto o teste de 3 dias estiver valendo. */
  trialActive: boolean;
  /** Dias restantes do teste (0 quando acabou). */
  trialDaysLeft: number;
  /** true quando o teste acabou e não há assinatura. */
  trialExpired: boolean;
  subjects: AcademicSubject[];
  maxRarity: Rarity;
  /** Comportamento é gratuito para sempre, em qualquer estado. */
  behavior: true;
  boardWorlds: number;
  xpMultiplier: number;
  lightMultiplier: number;
}
