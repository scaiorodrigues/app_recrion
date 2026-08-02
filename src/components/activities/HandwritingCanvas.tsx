/**
 * Canvas de escrita à mão. Os traços são capturados via PanResponder e
 * desenhados com react-native-svg — sem dependência nativa extra.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { THEME } from '@/constants/theme';

export type Stroke = string;

interface HandwritingCanvasProps {
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokes: Stroke[];
  onStrokesChange: (strokes: Stroke[]) => void;
  disabled?: boolean;
}

export function HandwritingCanvas({
  height = 110,
  strokeColor = THEME.colors.text,
  strokeWidth = 4,
  strokes,
  onStrokesChange,
  disabled = false,
}: HandwritingCanvasProps) {
  const [current, setCurrent] = useState<string>('');
  const currentRef = useRef('');

  const setPath = useCallback((path: string) => {
    currentRef.current = path;
    setCurrent(path);
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,

        onPanResponderGrant: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          setPath(`M${locationX.toFixed(1)},${locationY.toFixed(1)}`);
        },

        onPanResponderMove: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          setPath(`${currentRef.current} L${locationX.toFixed(1)},${locationY.toFixed(1)}`);
        },

        onPanResponderRelease: () => {
          // Um toque sem arraste não vira traço.
          if (currentRef.current.includes('L')) {
            onStrokesChange([...strokes, currentRef.current]);
          }
          setPath('');
        },
      }),
    [disabled, strokes, onStrokesChange, setPath],
  );

  return (
    <View
      {...panResponder.panHandlers}
      accessibilityLabel="Área de escrita"
      style={{
        height,
        backgroundColor: '#FFFFFF',
        borderRadius: THEME.borderRadius.input,
        borderWidth: 2.5,
        borderColor: THEME.colors.border,
        borderStyle: 'dashed',
        overflow: 'hidden',
      }}
    >
      <Svg style={{ flex: 1 }}>
        {strokes.map((d, i) => (
          <Path
            key={i}
            d={d}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
        {current !== '' && (
          <Path
            d={current}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </Svg>
    </View>
  );
}

export default HandwritingCanvas;
