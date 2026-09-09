import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { PlateItem, WeightUnit, getPlateColor } from '../../utils/plateCalculator';
import { ThemeColors } from '../../types/theme';

export interface PlateVisualizerProps {
  platesPerSide: PlateItem[];
  unit?: WeightUnit;
  barWeight?: number;
  colors?: Partial<ThemeColors>;
  testID?: string;
}

/**
 * Retorna las dimensiones visuales (altura y grosor) de un disco según su peso
 */
function getPlateDimensions(weight: number, unit: WeightUnit = 'kg'): { height: number; width: number } {
  // Normalizar pesos si es lb
  const normWeight = unit === 'lb' ? weight * 0.453592 : weight;

  if (normWeight >= 24) {
    return { height: 110, width: 20 }; // 25kg / 55lb
  } else if (normWeight >= 19) {
    return { height: 110, width: 18 }; // 20kg / 45lb (diámetro estándar IPF 450mm)
  } else if (normWeight >= 14) {
    return { height: 96, width: 15 }; // 15kg / 35lb
  } else if (normWeight >= 9) {
    return { height: 82, width: 13 }; // 10kg / 25lb
  } else if (normWeight >= 4.5) {
    return { height: 68, width: 11 }; // 5kg / 10lb
  } else if (normWeight >= 2.2) {
    return { height: 54, width: 9 }; // 2.5kg / 5lb
  } else if (normWeight >= 1) {
    return { height: 44, width: 8 }; // 1.25kg / 2.5lb
  }
  return { height: 36, width: 7 }; // Fraccionales
}

/**
 * Retorna un color de texto contrastante para la etiqueta sobre el disco
 */
function getContrastTextColor(plateColor: string): string {
  // Blanco para discos oscuros, negro para discos claros como blanco o amarillo
  const upper = plateColor.toUpperCase();
  if (upper === '#F3F4F6' || upper === '#FFFFFF' || upper === '#EAB308') {
    return '#1F2937';
  }
  return '#FFFFFF';
}

export const PlateVisualizer: React.FC<PlateVisualizerProps> = ({
  platesPerSide,
  unit = 'kg',
  barWeight,
  colors,
  testID = 'plate-visualizer',
}) => {
  const isDark = colors?.background ? colors.background === '#121212' || colors.background.includes('1e') : true;
  const sleeveBg = isDark ? '#334155' : '#94A3B8';
  const stopperBg = isDark ? '#475569' : '#64748B';
  const clampBg = isDark ? '#64748B' : '#475569';
  const textColor = colors?.textSecondary || (isDark ? '#94A3B8' : '#64748B');

  // Desenrollar discos en lista plana para renderizar cada disco individualmente
  const flatPlates: { weight: number; color: string; key: string }[] = [];
  platesPerSide.forEach((plate, groupIndex) => {
    for (let i = 0; i < plate.count; i++) {
      flatPlates.push({
        weight: plate.weight,
        color: plate.color || getPlateColor(plate.weight, unit),
        key: `plate-${groupIndex}-${plate.weight}-${i}`,
      });
    }
  });

  const hasPlates = flatPlates.length > 0;

  return (
    <View style={styles.outerContainer} testID={testID}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.barbellWrapper}>
          {/* Barra central que atraviesa todo */}
          <View
            style={[styles.barbellShaft, { backgroundColor: sleeveBg }]}
            testID="plate-sleeve"
          />

          {/* Tope interior / Collar de la barra */}
          <View
            style={[styles.collarStopper, { backgroundColor: stopperBg }]}
            testID="plate-collar"
          >
            <View style={styles.collarDetail} />
          </View>

          {/* Discos cargados */}
          {hasPlates ? (
            <View style={styles.platesRow}>
              {flatPlates.map((plate, index) => {
                const { height, width } = getPlateDimensions(plate.weight, unit);
                const textColorForPlate = getContrastTextColor(plate.color);
                const isVeryNarrow = width < 10;

                return (
                  <View
                    key={plate.key}
                    testID={`plate-item-${plate.weight}-${index}`}
                    style={[
                      styles.plateItem,
                      {
                        height,
                        width,
                        backgroundColor: plate.color,
                        borderColor: plate.color === '#F3F4F6' ? '#9CA3AF' : 'rgba(0,0,0,0.3)',
                      },
                    ]}
                  >
                    {!isVeryNarrow && (
                      <Text
                        style={[
                          styles.plateText,
                          {
                            color: textColorForPlate,
                            fontSize: width > 14 ? 10 : 8,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {plate.weight}
                      </Text>
                    )}
                  </View>
                );
              })}

              {/* Pinza / Collar exterior de seguridad */}
              <View
                style={[styles.outerClamp, { backgroundColor: clampBg }]}
                testID="plate-outer-clamp"
              />
            </View>
          ) : (
            <View style={styles.emptyContainer} testID="plate-visualizer-empty">
              <Text style={[styles.emptyText, { color: textColor }]}>
                {barWeight !== undefined
                  ? `Solo barra (${barWeight} ${unit})`
                  : 'Barra sin discos'}
              </Text>
            </View>
          )}

          {/* Extremo final de la manga */}
          <View style={[styles.sleeveEnd, { backgroundColor: sleeveBg }]} />
        </View>
      </ScrollView>

      <Text style={[styles.captionText, { color: textColor }]}>
        Manga de la barra (un lado)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 12,
  },
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    minWidth: '100%',
  },
  barbellWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 130,
    position: 'relative',
    paddingRight: 20,
  },
  barbellShaft: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 18,
    borderRadius: 3,
    zIndex: 0,
  },
  collarStopper: {
    width: 14,
    height: 94,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    marginRight: 2,
  },
  collarDetail: {
    width: 4,
    height: '80%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 1,
  },
  platesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 3,
  },
  plateItem: {
    borderRadius: 3,
    borderWidth: 1,
    marginHorizontal: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  plateText: {
    fontWeight: 'bold',
    transform: [{ rotate: '-90deg' }],
  },
  outerClamp: {
    width: 10,
    height: 48,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
    marginLeft: 3,
  },
  emptyContainer: {
    paddingHorizontal: 20,
    zIndex: 2,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  sleeveEnd: {
    width: 32,
    height: 18,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    zIndex: 1,
  },
  captionText: {
    fontSize: 11,
    marginTop: 6,
    letterSpacing: 0.3,
  },
});

export default PlateVisualizer;
