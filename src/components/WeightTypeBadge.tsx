import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TipoPeso, TIPO_PESO_LABELS, TIPO_PESO_SHORT_LABELS, TIPO_PESO_ICONS } from '../types/setTypes';

interface WeightTypeBadgeProps {
  tipoPeso: TipoPeso;
  editable?: boolean;
  onSelect?: (tipo: TipoPeso) => void;
  colors: any;
}

const WEIGHT_TYPE_OPTIONS: TipoPeso[] = ['total', 'por_lado', 'corporal'];

export const WeightTypeBadge = ({ tipoPeso, editable = false, onSelect, colors }: WeightTypeBadgeProps) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const handleSelect = (tipo: TipoPeso) => {
    setMenuVisible(false);
    if (tipo !== tipoPeso) {
      onSelect?.(tipo);
    }
  };

  const badge = (
    <View style={[styles.badge, { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}40` }]}>
      <MaterialIcons
        name={TIPO_PESO_ICONS[tipoPeso] as any}
        size={12}
        color={colors.primary}
      />
      <Text style={[styles.badgeText, { color: colors.primary }]}>
        {TIPO_PESO_SHORT_LABELS[tipoPeso]}
      </Text>
      {editable && (
        <MaterialIcons name="arrow-drop-down" size={14} color={colors.primary} />
      )}
    </View>
  );

  if (!editable) return badge;

  return (
    <>
      <TouchableOpacity onPress={() => setMenuVisible(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        {badge}
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Tipo de Peso</Text>
            {WEIGHT_TYPE_OPTIONS.map((tipo) => {
              const isSelected = tipo === tipoPeso;
              return (
                <TouchableOpacity
                  key={tipo}
                  style={[
                    styles.menuItem,
                    { borderColor: colors.border },
                    isSelected && { backgroundColor: `${colors.primary}15` },
                  ]}
                  onPress={() => handleSelect(tipo)}
                >
                  <MaterialIcons
                    name={TIPO_PESO_ICONS[tipo] as any}
                    size={20}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                  <View style={styles.menuItemText}>
                    <Text style={[styles.menuItemLabel, { color: isSelected ? colors.primary : colors.text }]}>
                      {TIPO_PESO_LABELS[tipo]}
                    </Text>
                    <Text style={[styles.menuItemDesc, { color: colors.textSecondary }]}>
                      {tipo === 'total' && 'Peso total de la barra/mancuerna'}
                      {tipo === 'por_lado' && 'Peso por cada lado (sin contar barra)'}
                      {tipo === 'corporal' && 'Ejercicio con peso del cuerpo'}
                    </Text>
                  </View>
                  {isSelected && (
                    <MaterialIcons name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  menu: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  menuItemDesc: {
    fontSize: 12,
    marginTop: 2,
  },
});
