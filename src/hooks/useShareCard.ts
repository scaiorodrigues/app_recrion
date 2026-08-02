/**
 * Captura a carta como imagem e abre a folha de compartilhamento do sistema.
 */

import { useCallback, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

export function useShareCard() {
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const shareCard = useCallback(async (crionName: string) => {
    if (!cardRef.current || sharing) return;

    setSharing(true);
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(
          'Compartilhamento indisponível',
          'Este aparelho não permite compartilhar arquivos.',
        );
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `Carta do ${crionName}`,
        UTI: 'public.png',
      });
    } catch {
      Alert.alert('Ops!', 'Não foi possível compartilhar a carta agora. Tente de novo.');
    } finally {
      setSharing(false);
    }
  }, [sharing]);

  return { cardRef, shareCard, sharing };
}

export default useShareCard;
