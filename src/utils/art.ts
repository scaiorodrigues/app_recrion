/**
 * Resolve as quatro camadas de arte de uma carta.
 *
 * As imagens são geradas em build (`scripts/generate-art.mjs`) e hospedadas
 * fora do bundle — 600 arquivos deixariam o APK pesado demais. O app monta a
 * URL a partir do manifesto e de uma base configurável.
 *
 * Sem base configurada, devolve undefined e o CrionArt cai no desenho
 * procedural, que já funciona. Arte é enriquecimento, não requisito.
 */

import type { ArtLayerUris, AttackSlot, Crion } from '@/types';

import manifest from '../../art/manifest.json';

type LayerName = 'creature' | 'effect' | 'background' | 'edge';
type Manifest = Record<string, Record<LayerName, string>>;

const ART_MANIFEST = manifest as Manifest;

/** Base de onde as imagens são servidas, ex: https://cdn.recrion.app/art/ */
const BASE_URL = process.env.EXPO_PUBLIC_ART_BASE_URL?.replace(/\/?$/, '/');

/** Chave da carta no manifesto: um Crion usando um ataque específico. */
export function cardArtKey(crionId: string, slot: AttackSlot): string {
  return `${crionId}_s${slot}`;
}

/**
 * URLs das quatro camadas. Devolve undefined quando não há base configurada
 * ou quando a carta não está no manifesto.
 */
export function resolveArtUris(
  crion: Crion,
  slot: AttackSlot,
): ArtLayerUris | undefined {
  if (!BASE_URL) return undefined;

  const entry = ART_MANIFEST[cardArtKey(crion.id, slot)];
  if (!entry) return undefined;

  const uris: ArtLayerUris = {};
  for (const layer of ['creature', 'effect', 'background', 'edge'] as LayerName[]) {
    if (entry[layer]) uris[layer] = `${BASE_URL}${entry[layer]}`;
  }

  return uris;
}

/** true quando o app está configurado para exibir arte gerada. */
export const hasGeneratedArt = Boolean(BASE_URL);
