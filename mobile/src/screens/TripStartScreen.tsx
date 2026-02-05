/**
 * Trip Start screen
 * Collects odometer reading + required photos (odometer/front/back) before starting a trip.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type * as ImagePicker from 'expo-image-picker';

import { Text } from '../typography';
import { BottomModal, Input, PrimaryButton } from '../components/ui';
import { useToast } from '../contexts';
import { useCamera } from '../hooks/useCamera';
import {
  COLORS,
  IMAGES,
  TRIP_STACK_ROUTES,
  TRIP_START_COLORS,
  TRIP_START_LAYOUT,
  TRIP_START_STRINGS,
  type TripItem,
} from '../constants';
import { normalizeHeight, normalizeWidth } from '../utils/responsive';
import type { TripStackParamList } from '../navigation/TripStackNavigator';
import { startTripInitiateApi, startTripVerifyApi } from '../services/api/trips';
import { startTripLocationTracking } from '../services/tripLocationTracking';

type Props = NativeStackScreenProps<TripStackParamList, typeof TRIP_STACK_ROUTES.TRIP_START>;

type PhotoKey = 'odometerPic' | 'carFrontPic' | 'carBackPic' | 'selfiePic';

export type TripStartPayload = {
  odometerValue: number;
  odometerPic: string;
  carFrontPic: string;
  carBackPic: string;
  driverSelfie: string;
};

function getPhotoLabel(key: PhotoKey): string {
  switch (key) {
    case 'odometerPic':
      return TRIP_START_STRINGS.ODOMETER_PHOTO_LABEL;
    case 'carFrontPic':
      return TRIP_START_STRINGS.CAR_FRONT_PHOTO_LABEL;
    case 'carBackPic':
      return TRIP_START_STRINGS.CAR_BACK_PHOTO_LABEL;
    case 'selfiePic':
    default:
      return TRIP_START_STRINGS.SELFIE_PHOTO_LABEL;
  }
}

export function TripStartScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { takePicture, pickImage, loading: cameraLoading } = useCamera();

  const trip: TripItem | undefined = route.params?.trip;

  const [odometerText, setOdometerText] = useState<string>('');
  const [photos, setPhotos] = useState<Partial<Record<PhotoKey, ImagePicker.ImagePickerAsset>>>(
    {}
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const [activePhotoKey, setActivePhotoKey] = useState<PhotoKey>('odometerPic');
  const [token, setToken] = useState<string | null>(null);
  const [otpText, setOtpText] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const openPicker = useCallback((key: PhotoKey) => {
    setActivePhotoKey(key);
    setPickerVisible(true);
  }, []);

  const closePicker = useCallback(() => setPickerVisible(false), []);

  const setPhoto = useCallback((key: PhotoKey, asset: ImagePicker.ImagePickerAsset) => {
    setPhotos((prev) => ({ ...prev, [key]: asset }));
  }, []);

  const onTakePhoto = useCallback(async () => {
    const asset = await takePicture();
    if (asset) setPhoto(activePhotoKey, asset);
    closePicker();
  }, [activePhotoKey, closePicker, setPhoto, takePicture]);

  const onPickFromGallery = useCallback(async () => {
    const asset = await pickImage();
    if (asset) setPhoto(activePhotoKey, asset);
    closePicker();
  }, [activePhotoKey, closePicker, pickImage, setPhoto]);

  const canSubmit = useMemo(() => {
    const value = Number(odometerText);
    return (
      Number.isFinite(value) &&
      value > 0 &&
      Boolean(photos.odometerPic?.uri) &&
      Boolean(photos.carFrontPic?.uri) &&
      Boolean(photos.carBackPic?.uri) &&
      Boolean(photos.selfiePic?.uri)
    );
  }, [odometerText, photos]);

  const initiate = useCallback(async () => {
    if (!trip?.id) {
      showToast({ message: TRIP_START_STRINGS.ERROR_TRIP_MISSING, type: 'error', position: 'top' });
      return;
    }

    const value = Number(odometerText);
    if (!odometerText.trim()) {
      showToast({ message: TRIP_START_STRINGS.ERROR_ODOMETER_REQUIRED, type: 'error', position: 'top' });
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      showToast({ message: TRIP_START_STRINGS.ERROR_ODOMETER_INVALID, type: 'error', position: 'top' });
      return;
    }
    if (!photos.odometerPic?.uri) {
      showToast({ message: TRIP_START_STRINGS.ERROR_ODOMETER_PHOTO_REQUIRED, type: 'error', position: 'top' });
      return;
    }
    if (!photos.carFrontPic?.uri) {
      showToast({ message: TRIP_START_STRINGS.ERROR_CAR_FRONT_PHOTO_REQUIRED, type: 'error', position: 'top' });
      return;
    }
    if (!photos.carBackPic?.uri) {
      showToast({ message: TRIP_START_STRINGS.ERROR_CAR_BACK_PHOTO_REQUIRED, type: 'error', position: 'top' });
      return;
    }
    if (!photos.selfiePic?.uri) {
      showToast({ message: TRIP_START_STRINGS.ERROR_SELFIE_PHOTO_REQUIRED, type: 'error', position: 'top' });
      return;
    }

    const payload: TripStartPayload = {
      odometerValue: value,
      odometerPic: photos.odometerPic.uri,
      carFrontPic: photos.carFrontPic.uri,
      carBackPic: photos.carBackPic.uri,
      driverSelfie: photos.selfiePic.uri,
    };

    console.log('[TripStart] Payload being sent:', JSON.stringify(payload, null, 2));

    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await startTripInitiateApi(trip.id, payload);
      setToken(res.token);
      showToast({ message: TRIP_START_STRINGS.OTP_SENT, type: 'success', position: 'top' });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        TRIP_START_STRINGS.ERROR_INITIATE_FAILED;
      showToast({ message: msg, type: 'error', position: 'top' });
    } finally {
      setSubmitting(false);
    }
  }, [odometerText, photos, showToast, submitting, trip?.id]);

  const verify = useCallback(async () => {
    if (!trip?.id) {
      showToast({ message: TRIP_START_STRINGS.ERROR_TRIP_MISSING, type: 'error', position: 'top' });
      return;
    }
    if (!token) return;
    if (!otpText.trim()) {
      showToast({ message: TRIP_START_STRINGS.ERROR_OTP_REQUIRED, type: 'error', position: 'top' });
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      await startTripVerifyApi(trip.id, { token, otp: otpText.trim() });
      // Start location tracking immediately after trip starts
      await startTripLocationTracking(trip.id);
      showToast({ message: TRIP_START_STRINGS.SUCCESS, type: 'success', position: 'top' });
      navigation.goBack();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        TRIP_START_STRINGS.ERROR_VERIFY_FAILED;
      showToast({ message: msg, type: 'error', position: 'top' });
    } finally {
      setSubmitting(false);
    }
  }, [navigation, otpText, showToast, submitting, token, trip?.id]);

  const screenPaddingTop = insets.top;
  const screenPaddingBottom = Math.max(insets.bottom, normalizeHeight(TRIP_START_LAYOUT.BOTTOM_PADDING));

  return (
    <View style={[styles.container, { paddingTop: screenPaddingTop }]}>
      <StatusBar style="dark" backgroundColor={COLORS.white} />

      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={styles.headerIconBtn}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="chevron-left" size={normalizeWidth(28)} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text variant="body" weight="semiBold" style={styles.headerTitle}>
          {TRIP_START_STRINGS.TITLE}
        </Text>
        <View style={styles.headerSideSpacer} />
      </View>
      <View style={styles.headerDivider} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: screenPaddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topCard}>
          <Image source={IMAGES.icon} style={styles.carImage} resizeMode="contain" />
          <Text variant="body" weight="semiBold" style={styles.title}>
            {trip?.tripIdLabel ?? TRIP_START_STRINGS.TITLE}
          </Text>
          <Text variant="caption" style={styles.subtitle}>
            {TRIP_START_STRINGS.SUBTITLE}
          </Text>
        </View>

        <View style={styles.formCard}>
          {!token ? (
            <>
              <Input
                label={TRIP_START_STRINGS.ODOMETER_VALUE_LABEL}
                value={odometerText}
                onChangeText={setOdometerText}
                placeholder={TRIP_START_STRINGS.ODOMETER_VALUE_PLACEHOLDER}
                helperText={TRIP_START_STRINGS.ODOMETER_VALUE_HELPER}
                keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
              />

              <Text variant="body" weight="semiBold" style={styles.photoSectionTitle}>
                {TRIP_START_STRINGS.PHOTO_SECTION_TITLE}
              </Text>

              <View style={styles.photoGrid}>
                <PhotoTile
                  label={TRIP_START_STRINGS.SELFIE_PHOTO_LABEL}
                  asset={photos.selfiePic}
                  onPress={() => openPicker('selfiePic')}
                />
                <PhotoTile
                  label={TRIP_START_STRINGS.ODOMETER_PHOTO_LABEL}
                  asset={photos.odometerPic}
                  onPress={() => openPicker('odometerPic')}
                />
                <PhotoTile
                  label={TRIP_START_STRINGS.CAR_FRONT_PHOTO_LABEL}
                  asset={photos.carFrontPic}
                  onPress={() => openPicker('carFrontPic')}
                />
                <PhotoTile
                  label={TRIP_START_STRINGS.CAR_BACK_PHOTO_LABEL}
                  asset={photos.carBackPic}
                  onPress={() => openPicker('carBackPic')}
                />
              </View>

              <View style={styles.actionRow}>
                <PrimaryButton
                  label={TRIP_START_STRINGS.SUBMIT}
                  onPress={initiate}
                  backgroundColor={TRIP_START_COLORS.PRIMARY_BG}
                  textColor={TRIP_START_COLORS.PRIMARY_TEXT}
                  height={normalizeHeight(TRIP_START_LAYOUT.ACTION_BTN_HEIGHT)}
                  disabled={!canSubmit || cameraLoading || submitting}
                />
              </View>
            </>
          ) : (
            <>
              <Text variant="body" weight="semiBold" style={styles.photoSectionTitle}>
                {TRIP_START_STRINGS.OTP_TITLE}
              </Text>
              <Input
                label={TRIP_START_STRINGS.OTP_LABEL}
                value={otpText}
                onChangeText={setOtpText}
                placeholder={TRIP_START_STRINGS.OTP_PLACEHOLDER}
                helperText={TRIP_START_STRINGS.OTP_HELPER}
                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
              />

              <View style={styles.actionRow}>
                <PrimaryButton
                  label={TRIP_START_STRINGS.VERIFY}
                  onPress={verify}
                  backgroundColor={TRIP_START_COLORS.PRIMARY_BG}
                  textColor={TRIP_START_COLORS.PRIMARY_TEXT}
                  height={normalizeHeight(TRIP_START_LAYOUT.ACTION_BTN_HEIGHT)}
                  disabled={cameraLoading || submitting}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <BottomModal visible={pickerVisible} onClose={closePicker}>
        <View style={styles.pickerSheet}>
          <Text variant="body" weight="semiBold" style={styles.pickerTitle}>
            {getPhotoLabel(activePhotoKey)}
          </Text>
          <View style={styles.pickerButtons}>
            <PrimaryButton
              label={TRIP_START_STRINGS.TAKE_PHOTO}
              onPress={onTakePhoto}
              backgroundColor={TRIP_START_COLORS.PRIMARY_BG}
              textColor={TRIP_START_COLORS.PRIMARY_TEXT}
              height={normalizeHeight(TRIP_START_LAYOUT.ACTION_BTN_HEIGHT)}
              disabled={cameraLoading}
            />
            <PrimaryButton
              label={TRIP_START_STRINGS.CHOOSE_FROM_GALLERY}
              onPress={onPickFromGallery}
              backgroundColor={TRIP_START_COLORS.SECONDARY_BG}
              textColor={TRIP_START_COLORS.SECONDARY_TEXT}
              height={normalizeHeight(TRIP_START_LAYOUT.ACTION_BTN_HEIGHT)}
              disabled={cameraLoading}
            />
          </View>
        </View>
      </BottomModal>
    </View>
  );
}

function PhotoTile({
  label,
  asset,
  onPress,
}: {
  label: string;
  asset?: ImagePicker.ImagePickerAsset;
  onPress: () => void;
}) {
  const hasImage = Boolean(asset?.uri);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.photoTile}
    >
      <View style={styles.photoTileHeader}>
        <Text variant="caption" style={styles.photoLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text variant="caption" style={styles.photoAction}>
          {hasImage ? TRIP_START_STRINGS.CHANGE_PHOTO : TRIP_START_STRINGS.ADD_PHOTO}
        </Text>
      </View>

      <View style={styles.photoPreview}>
        {hasImage ? (
          <Image source={{ uri: asset!.uri }} style={styles.photoImage} resizeMode="cover" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <MaterialCommunityIcons
              name="camera-outline"
              size={normalizeWidth(26)}
              color={TRIP_START_COLORS.PHOTO_PLACEHOLDER_ICON}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TRIP_START_COLORS.SCREEN_BG },

  header: {
    height: normalizeHeight(TRIP_START_LAYOUT.HEADER_HEIGHT),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: normalizeWidth(TRIP_START_LAYOUT.SCREEN_HORIZONTAL_PADDING),
  },
  headerIconBtn: {
    width: normalizeWidth(44),
    height: normalizeHeight(44),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: normalizeWidth(TRIP_START_LAYOUT.HEADER_TITLE_FONT_SIZE),
    textAlign: 'center',
  },
  headerSideSpacer: { width: normalizeWidth(44), height: normalizeHeight(44) },
  headerDivider: { height: StyleSheet.hairlineWidth, backgroundColor: TRIP_START_COLORS.BORDER },

  scrollContent: {
    paddingHorizontal: normalizeWidth(TRIP_START_LAYOUT.SCREEN_HORIZONTAL_PADDING),
    paddingTop: normalizeHeight(TRIP_START_LAYOUT.CONTENT_TOP_PADDING),
    gap: normalizeHeight(TRIP_START_LAYOUT.CONTENT_GAP),
  },

  topCard: {
    backgroundColor: TRIP_START_COLORS.CARD_BG,
    borderRadius: normalizeWidth(TRIP_START_LAYOUT.CARD_RADIUS),
    padding: normalizeWidth(TRIP_START_LAYOUT.CARD_PADDING),
    alignItems: 'center',
  },
  carImage: {
    width: normalizeWidth(TRIP_START_LAYOUT.CAR_IMAGE_SIZE),
    height: normalizeWidth(TRIP_START_LAYOUT.CAR_IMAGE_SIZE),
    borderRadius: normalizeWidth(TRIP_START_LAYOUT.CAR_IMAGE_RADIUS),
  },
  title: { color: COLORS.textPrimary, marginTop: normalizeHeight(10) },
  subtitle: { color: TRIP_START_COLORS.SUBTITLE, textAlign: 'center', marginTop: normalizeHeight(6) },

  formCard: {
    backgroundColor: TRIP_START_COLORS.CARD_BG,
    borderRadius: normalizeWidth(TRIP_START_LAYOUT.CARD_RADIUS),
    padding: normalizeWidth(TRIP_START_LAYOUT.CARD_PADDING),
  },
  photoSectionTitle: { color: COLORS.textPrimary, marginBottom: normalizeHeight(12) },

  photoGrid: { gap: normalizeHeight(TRIP_START_LAYOUT.PHOTO_TILE_GAP) },
  photoTile: {
    backgroundColor: TRIP_START_COLORS.PHOTO_TILE_BG,
    borderRadius: normalizeWidth(TRIP_START_LAYOUT.PHOTO_TILE_RADIUS),
    overflow: 'hidden',
    padding: normalizeWidth(14),
  },
  photoTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: normalizeWidth(10),
  },
  photoLabel: { color: COLORS.textPrimary, flex: 1 },
  photoAction: { color: COLORS.primary },
  photoPreview: {
    marginTop: normalizeHeight(10),
    height: normalizeHeight(TRIP_START_LAYOUT.PHOTO_TILE_HEIGHT),
    borderRadius: normalizeWidth(TRIP_START_LAYOUT.PHOTO_TILE_RADIUS),
    overflow: 'hidden',
    backgroundColor: COLORS.white,
  },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoImage: { width: '100%', height: '100%' },

  actionRow: { marginTop: normalizeHeight(10) },

  pickerSheet: { paddingBottom: normalizeHeight(10) },
  pickerTitle: { color: COLORS.textPrimary, textAlign: 'center' },
  pickerButtons: { marginTop: normalizeHeight(16), gap: normalizeHeight(12) },
});

export default TripStartScreen;

