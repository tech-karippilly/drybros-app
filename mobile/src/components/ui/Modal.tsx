/**
 * Modal component
 */

import React from 'react';
import {
  View,
  Modal as RNModal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { ModalProps } from '../../types/common';
import { COLORS } from '../../constants/colors';
import { getFontFamily, FONT_SIZES } from '../../constants/typography';
import { normalizeWidth, normalizeHeight, normalizeFont } from '../../utils/responsive';
import { Text } from '../../typography';

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  children,
  title,
  showCloseButton = true,
}) => {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.container}>
              {(title || showCloseButton) && (
                <View style={styles.header}>
                  {title && (
                    <Text variant="h5" style={styles.title}>
                      {title}
                    </Text>
                  )}
                  {showCloseButton && (
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                      <Text style={styles.closeText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              <View style={styles.content}>{children}</View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: normalizeWidth(20),
  },
  container: {
    backgroundColor: COLORS.white,
    borderRadius: normalizeWidth(12),
    width: '100%',
    maxWidth: normalizeWidth(400),
    maxHeight: '80%',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: normalizeWidth(20),
    paddingTop: normalizeHeight(20),
    paddingBottom: normalizeHeight(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    flex: 1,
    color: COLORS.textPrimary,
  },
  closeButton: {
    width: normalizeWidth(32),
    height: normalizeWidth(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontFamily: getFontFamily('bold'),
    fontSize: normalizeFont(FONT_SIZES['3xl']),
    color: COLORS.textSecondary,
    lineHeight: normalizeFont(FONT_SIZES['3xl']),
  },
  content: {
    padding: normalizeWidth(20),
  },
});

export default Modal;