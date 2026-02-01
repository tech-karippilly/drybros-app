/**
 * TripRequestModal
 * Centered modal for new trip assignment with Accept / Reject / View Trip actions.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from './Modal';
import { PrimaryButton } from './PrimaryButton';
import { Text } from '../../typography';
import {
  TRIP_REQUEST_COLORS,
  TRIP_REQUEST_ICON,
  TRIP_REQUEST_LAYOUT,
  TRIP_REQUEST_STRINGS,
} from '../../constants';
import { normalizeHeight, normalizeWidth } from '../../utils/responsive';

export type TripRequestModalProps = {
  visible: boolean;
  tripId: string;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  onViewTrip: () => void;
  disabled?: boolean;
};

export function TripRequestModal({
  visible,
  tripId,
  onClose,
  onAccept,
  onReject,
  onViewTrip,
  disabled = false,
}: TripRequestModalProps) {
  const sizes = useMemo(() => {
    const outer = normalizeWidth(TRIP_REQUEST_LAYOUT.ICON_OUTER_SIZE);
    const middle = normalizeWidth(TRIP_REQUEST_LAYOUT.ICON_MIDDLE_SIZE);
    const inner = normalizeWidth(TRIP_REQUEST_LAYOUT.ICON_INNER_SIZE);
    const iconSize = normalizeWidth(TRIP_REQUEST_LAYOUT.ICON_SIZE);
    return { outer, middle, inner, iconSize };
  }, []);

  const contentGap = normalizeHeight(TRIP_REQUEST_LAYOUT.CONTENT_GAP);
  const buttonRowGap = normalizeWidth(TRIP_REQUEST_LAYOUT.BUTTON_ROW_GAP);
  const buttonTopMargin = normalizeHeight(TRIP_REQUEST_LAYOUT.BUTTON_TOP_MARGIN);
  const actionsVerticalGap = normalizeHeight(TRIP_REQUEST_LAYOUT.ACTIONS_VERTICAL_GAP);
  const actionBtnHeight = normalizeHeight(TRIP_REQUEST_LAYOUT.ACTION_BUTTON_HEIGHT);
  const viewBtnHeight = normalizeHeight(TRIP_REQUEST_LAYOUT.VIEW_BUTTON_HEIGHT);
  const messageTopMargin = normalizeHeight(TRIP_REQUEST_LAYOUT.MESSAGE_TOP_MARGIN);
  const messageMaxWidth = normalizeWidth(TRIP_REQUEST_LAYOUT.MESSAGE_MAX_WIDTH);

  return (
    <Modal visible={visible} onClose={onClose} showCloseButton={false}>
      <View style={[styles.content, { gap: contentGap }]}>
        <View style={styles.iconWrap}>
          <View
            style={[
              styles.ring,
              {
                width: sizes.outer,
                height: sizes.outer,
                borderRadius: sizes.outer / 2,
                backgroundColor: TRIP_REQUEST_COLORS.RING_OUTER_BG,
              },
            ]}
          />
          <View
            style={[
              styles.ring,
              {
                width: sizes.middle,
                height: sizes.middle,
                borderRadius: sizes.middle / 2,
                backgroundColor: TRIP_REQUEST_COLORS.RING_MIDDLE_BG,
              },
            ]}
          />
          <View
            style={[
              styles.innerCircle,
              {
                width: sizes.inner,
                height: sizes.inner,
                borderRadius: sizes.inner / 2,
                backgroundColor: TRIP_REQUEST_COLORS.ICON_INNER_BG,
              },
            ]}
          >
            <Ionicons name={TRIP_REQUEST_ICON.NAME} size={sizes.iconSize} color={TRIP_REQUEST_COLORS.ICON} />
          </View>
        </View>

        <View style={styles.copyWrap}>
          <Text variant="h4" weight="semiBold" align="center" style={{ color: TRIP_REQUEST_COLORS.TITLE }}>
            {TRIP_REQUEST_STRINGS.TITLE}
          </Text>
          <Text
            variant="body"
            align="center"
            style={[
              styles.message,
              { color: TRIP_REQUEST_COLORS.MESSAGE, marginTop: messageTopMargin, maxWidth: messageMaxWidth },
            ]}
          >
            {TRIP_REQUEST_STRINGS.ASSIGNED_MESSAGE(tripId)}
          </Text>
        </View>

        <View style={[styles.actions, { marginTop: buttonTopMargin, gap: actionsVerticalGap }]}>
          <View style={[styles.row, { gap: buttonRowGap }]}>
            <View style={styles.flex}>
              <PrimaryButton
                label={TRIP_REQUEST_STRINGS.ACCEPT}
                onPress={onAccept}
                backgroundColor={TRIP_REQUEST_COLORS.ACCEPT_BG}
                textColor={TRIP_REQUEST_COLORS.ACCEPT_TEXT}
                height={actionBtnHeight}
                disabled={disabled}
              />
            </View>
            <View style={styles.flex}>
              <PrimaryButton
                label={TRIP_REQUEST_STRINGS.REJECT}
                onPress={onReject}
                backgroundColor={TRIP_REQUEST_COLORS.REJECT_BG}
                textColor={TRIP_REQUEST_COLORS.REJECT_TEXT}
                height={actionBtnHeight}
                disabled={disabled}
              />
            </View>
          </View>

          <PrimaryButton
            label={TRIP_REQUEST_STRINGS.VIEW_TRIP}
            onPress={onViewTrip}
            backgroundColor={TRIP_REQUEST_COLORS.VIEW_BG}
            textColor={TRIP_REQUEST_COLORS.VIEW_TEXT}
            height={viewBtnHeight}
            disabled={disabled}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  innerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    // dynamic layout values set inline from constants
  },
  actions: {
    alignSelf: 'stretch',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
});

export default TripRequestModal;

