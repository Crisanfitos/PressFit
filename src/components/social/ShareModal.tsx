import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../types/theme';
import { ShareService } from '../../services/ShareService';
import SocialCardCanvas, { SocialCardData, CardAspectRatio } from './SocialCardCanvas';
import { styles } from './ShareModal.styles';

export interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  data: SocialCardData | null;
  colors?: ThemeColors;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  data,
  colors: propColors,
}) => {
  const themeContext = useTheme();
  const colors = propColors || themeContext.theme.colors;
  const [aspectRatio, setAspectRatio] = useState<CardAspectRatio>('9:16');
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const cardRef = useRef<View>(null);

  if (!visible || !data) {
    return null;
  }

  const handleShare = async () => {
    if (isSharing || !data) return;
    setIsSharing(true);
    try {
      await ShareService.captureAndShare(cardRef, {
        data,
        title: data.workoutName ? `Entrenamiento: ${data.workoutName}` : '¡Entrenamiento completado en PressFit!',
      });
    } catch (error) {
      console.error('[ShareModal] Failed to share workout card:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
      testID="share-modal"
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                ¡Entrenamiento Completado!
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Comparte tu progreso y celebra tu esfuerzo
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.cardBackground }]}
              testID="share-modal-close-btn"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialIcons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* ── Format Selector Tabs ── */}
          <View style={styles.formatSelector}>
            <TouchableOpacity
              onPress={() => setAspectRatio('9:16')}
              style={[
                styles.formatTab,
                aspectRatio === '9:16' && [
                  styles.formatTabActive,
                  { backgroundColor: colors.primary },
                ],
              ]}
              testID="share-modal-format-story"
            >
              <MaterialIcons
                name="stay-current-portrait"
                size={18}
                color={aspectRatio === '9:16' ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.formatTabText,
                  { color: aspectRatio === '9:16' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Historia (9:16)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setAspectRatio('1:1')}
              style={[
                styles.formatTab,
                aspectRatio === '1:1' && [
                  styles.formatTabActive,
                  { backgroundColor: colors.primary },
                ],
              ]}
              testID="share-modal-format-square"
            >
              <MaterialIcons
                name="crop-square"
                size={18}
                color={aspectRatio === '1:1' ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.formatTabText,
                  { color: aspectRatio === '1:1' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Cuadrado (1:1)
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Card Preview Area ── */}
          <ScrollView
            style={styles.previewContainer}
            contentContainerStyle={styles.previewScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View
              ref={cardRef}
              collapsable={false}
              style={styles.cardCaptureWrapper}
              testID="share-card-capture-view"
            >
              <SocialCardCanvas
                data={data}
                aspectRatio={aspectRatio}
                testID="share-modal-canvas"
              />
            </View>
          </ScrollView>

          {/* ── Action Buttons Footer ── */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.shareButton,
                { backgroundColor: colors.primary, opacity: isSharing ? 0.8 : 1 },
              ]}
              onPress={handleShare}
              disabled={isSharing}
              testID="share-modal-share-btn"
            >
              {isSharing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialIcons name="share" size={20} color="#FFFFFF" />
                  <Text style={[styles.shareButtonText, { color: '#FFFFFF' }]}>
                    Compartir
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.doneButton,
                { borderColor: colors.border, backgroundColor: 'transparent' },
              ]}
              onPress={onClose}
              testID="share-modal-done-btn"
            >
              <Text style={[styles.doneButtonText, { color: colors.textSecondary }]}>
                Listo
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ShareModal;
