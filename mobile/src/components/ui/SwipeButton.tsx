/**
 * Swipe button / swipe-to-confirm
 * Full width/height by props, rounded track, circular thumb with >> icon, gradient label
 */

import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  StyleSheet,
  Dimensions,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { SwipeButtonProps } from '../../types/common';
import { COLORS } from '../../constants/colors';
import { getFontFamily } from '../../constants/typography';
import { SWIPE_BUTTON } from '../../constants/swipeButton';
import {
  normalizeWidth,
  normalizeHeight,
  normalizeFont,
} from '../../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const SwipeButton: React.FC<SwipeButtonProps> = ({
  label,
  onSwipeComplete,
  width = '100%',
  height,
  trackColor = COLORS.gray200,
  thumbColor = COLORS.white,
  gradientColors = SWIPE_BUTTON.LABEL_GRADIENT_COLORS,
  disabled = false,
  style,
}) => {
  const trackHeight = normalizeHeight(SWIPE_BUTTON.TRACK_HEIGHT);
  const trackRadius = normalizeWidth(SWIPE_BUTTON.TRACK_BORDER_RADIUS);
  const trackPaddingT = normalizeHeight(SWIPE_BUTTON.TRACK_PADDING_TOP);
  const trackPaddingR = normalizeWidth(SWIPE_BUTTON.TRACK_PADDING_RIGHT);
  const trackPaddingB = normalizeHeight(SWIPE_BUTTON.TRACK_PADDING_BOTTOM);
  const trackPaddingL = normalizeWidth(SWIPE_BUTTON.TRACK_PADDING_LEFT);
  const trackGap = normalizeWidth(SWIPE_BUTTON.TRACK_GAP);
  const thumbSize = normalizeWidth(SWIPE_BUTTON.THUMB_SIZE);
  const thumbRadius = normalizeWidth(SWIPE_BUTTON.THUMB_BORDER_RADIUS) / 2;
  const thumbPadding = normalizeWidth(SWIPE_BUTTON.THUMB_PADDING);
  const labelFontSize = normalizeFont(SWIPE_BUTTON.LABEL_FONT_SIZE);

  const [trackInnerWidth, setTrackInnerWidth] = useState(
    typeof width === 'number' ? width - trackPaddingL - trackPaddingR : SCREEN_WIDTH - trackPaddingL - trackPaddingR - normalizeWidth(80)
  );
  const containerHeight = typeof height === 'number' ? height : trackHeight;
  const trackInnerHeight = containerHeight - trackPaddingT - trackPaddingB;
  const maxThumbX = Math.max(0, trackInnerWidth - thumbSize - trackGap);
  const maxThumbXRef = useRef(maxThumbX);
  maxThumbXRef.current = maxThumbX;

  const thumbX = useRef(new Animated.Value(0)).current;

  const animateThumb = useCallback(
    (toValue: number, useSpring = false) => {
      if (useSpring) {
        Animated.spring(thumbX, {
          toValue,
          useNativeDriver: true,
          speed: 24,
          bounciness: 8,
        }).start();
      } else {
        Animated.timing(thumbX, {
          toValue,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    },
    [thumbX]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        if (disabled) return;
        const max = maxThumbXRef.current;
        const newX = Math.max(0, Math.min(gestureState.dx, max));
        thumbX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (disabled) return;
        const max = maxThumbXRef.current;
        const currentX = gestureState.dx;
        const threshold = max * SWIPE_BUTTON.COMPLETE_THRESHOLD;
        if (currentX >= threshold) {
          animateThumb(max, false);
          onSwipeComplete?.();
        } else {
          animateThumb(0, true);
        }
      },
    })
  ).current;

  const onTrackInnerLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number } } }) => {
      const w = e.nativeEvent.layout.width;
      if (typeof width === 'string' && w > 0) setTrackInnerWidth(w);
    },
    [width]
  );

  const containerStyle: ViewStyle = {
    width: typeof width === 'number' ? width : '100%',
    height: containerHeight,
  };

  const labelTextStyle = {
    fontFamily: getFontFamily('satoshiVariable'),
    fontWeight: '500' as const,
    fontStyle: 'normal' as const,
    letterSpacing: 0,
    fontSize: labelFontSize,
    lineHeight: labelFontSize * (SWIPE_BUTTON.LABEL_LINE_HEIGHT_PERCENT / 100),
  };

  return (
    <View style={[containerStyle, style]}>
      <View
        style={[
          styles.track,
          {
            height: containerHeight,
            borderRadius: trackRadius,
            paddingTop: trackPaddingT,
            paddingRight: trackPaddingR,
            paddingBottom: trackPaddingB,
            paddingLeft: trackPaddingL,
            backgroundColor: trackColor,
          },
        ]}
      >
        <View
          onLayout={onTrackInnerLayout}
          style={[
            styles.trackInner,
            {
              height: trackInnerHeight,
              gap: trackGap,
            },
          ]}
        >
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.thumb,
              {
                width: thumbSize,
                height: thumbSize,
                borderRadius: thumbRadius,
                padding: thumbPadding,
                backgroundColor: thumbColor,
                transform: [{ translateX: thumbX }],
              },
            ]}
          >
            <MaterialCommunityIcons
              name="chevron-double-right"
              size={normalizeWidth(18)}
              color={COLORS.gray700}
            />
          </Animated.View>
          <View style={styles.labelWrap}>
            <MaskedView
              maskElement={
                <View style={styles.labelMask}>
                  <Text style={labelTextStyle}>{label}</Text>
                </View>
              }
            >
              <LinearGradient
                colors={[...gradientColors]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientFill}
              >
                <Text style={[labelTextStyle, styles.labelInvisible]}>{label}</Text>
              </LinearGradient>
            </MaskedView>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  trackInner: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  thumb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  labelMask: {
    backgroundColor: 'transparent',
  },
  labelInvisible: {
    opacity: 0,
  },
  gradientFill: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default SwipeButton;
