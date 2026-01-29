/**
 * Bottom modal / bottom sheet
 * Full width, auto height, rounded top corners, anchored to bottom
 */

import React from 'react';
import {
  View,
  Modal as RNModal,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomModalProps } from '../../types/common';
import { COLORS } from '../../constants/colors';
import { MODAL } from '../../constants/modal';
import { normalizeWidth, normalizeHeight } from '../../utils/responsive';

export const BottomModal: React.FC<BottomModalProps> = ({
  visible,
  onClose,
  children,
}) => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, normalizeHeight(12));
  const topRadius = normalizeWidth(MODAL.BOTTOM_MODAL_TOP_RADIUS);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View
              style={[
                styles.container,
                {
                  paddingBottom: bottomInset,
                  borderTopLeftRadius: topRadius,
                  borderTopRightRadius: topRadius,
                },
              ]}
            >
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  container: {
    width: '100%',
    backgroundColor: COLORS.background,
    paddingHorizontal: normalizeWidth(20),
    paddingTop: normalizeHeight(20),
    ...(Platform.OS === 'ios' && {
      shadowColor: COLORS.black,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    }),
    ...(Platform.OS === 'android' && { elevation: 8 }),
  },
});

export default BottomModal;
