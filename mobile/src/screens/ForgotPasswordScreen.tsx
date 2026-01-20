/**
 * Forgot Password Screen Component
 * Request new password via SMS using driver code and phone number
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../typography';
import { IMAGES } from '../constants/images';
import { COLORS } from '../constants/colors';
import { normalizeWidth, normalizeHeight, normalizeFont } from '../utils/responsive';
import { useToast } from '../contexts';
import { useSMS } from '../hooks/useSMS';
import { isValidPhoneNumber } from '../utils/validators';
import { formatPhoneNumber } from '../utils/formatters';
import { FONT_FAMILY, FONT_SIZES } from '../constants/typography';

interface ForgotPasswordScreenProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { sendSMS, openSMS, isAvailable } = useSMS();
  const [driverCode, setDriverCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'success'>('input');

  // Animation values
  const backButtonAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const input1Anim = useRef(new Animated.Value(0)).current;
  const input2Anim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const successFadeAnim = useRef(new Animated.Value(0)).current;
  const successScaleAnim = useRef(new Animated.Value(0.8)).current;

  // Pre-compute interpolations for better performance
  const backButtonTranslateX = useMemo(
    () =>
      backButtonAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-20, 0],
      }),
    [backButtonAnim]
  );

  const titleTranslateY = useMemo(
    () =>
      titleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-20, 0],
      }),
    [titleAnim]
  );

  const subtitleTranslateY = useMemo(
    () =>
      subtitleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-10, 0],
      }),
    [subtitleAnim]
  );

  const input1TranslateY = useMemo(
    () =>
      input1Anim.interpolate({
        inputRange: [0, 1],
        outputRange: [20, 0],
      }),
    [input1Anim]
  );

  const input2TranslateY = useMemo(
    () =>
      input2Anim.interpolate({
        inputRange: [0, 1],
        outputRange: [20, 0],
      }),
    [input2Anim]
  );

  const buttonScale = useMemo(
    () =>
      buttonAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.9, 1],
      }),
    [buttonAnim]
  );

  const buttonTranslateY = useMemo(
    () =>
      buttonAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [20, 0],
      }),
    [buttonAnim]
  );

  useEffect(() => {
    if (step === 'input') {
      // Reset animations
      backButtonAnim.setValue(0);
      titleAnim.setValue(0);
      subtitleAnim.setValue(0);
      input1Anim.setValue(0);
      input2Anim.setValue(0);
      buttonAnim.setValue(0);

      // Animate form elements with stagger
      Animated.sequence([
        Animated.parallel([
          Animated.timing(backButtonAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(titleAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(100),
        Animated.timing(subtitleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.delay(100),
        Animated.timing(input1Anim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.delay(100),
        Animated.timing(input2Anim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.delay(100),
        Animated.timing(buttonAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (step === 'success') {
      // Success screen animations
      Animated.parallel([
        Animated.timing(successFadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(successScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [step]);

  const handleRequestPassword = useCallback(async () => {
    if (!driverCode.trim()) {
      showToast({
        message: 'Please enter your driver code',
        type: 'error',
        position: 'top',
      });
      return;
    }

    if (!phoneNumber.trim()) {
      showToast({
        message: 'Please enter your phone number',
        type: 'error',
        position: 'top',
      });
      return;
    }

    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    if (!isValidPhoneNumber(cleanedPhone)) {
      showToast({
        message: 'Please enter a valid phone number',
        type: 'error',
        position: 'top',
      });
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement actual API call to request password reset
      // const response = await requestPasswordResetAPI(driverCode, cleanedPhone);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Generate temporary password (in real app, this comes from backend)
      const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
      
      // Format phone number for SMS
      const formattedPhone = cleanedPhone.startsWith('+') 
        ? cleanedPhone 
        : `+1${cleanedPhone}`;
      
      // Send SMS with password
      if (isAvailable) {
        const message = `Your DRYBROS Driver password has been reset. Your temporary password is: ${tempPassword}. Please change it after logging in.`;
        const sent = await sendSMS([formattedPhone], message);
        
        if (sent) {
          setStep('success');
          showToast({
            message: 'Password sent to your phone via SMS',
            type: 'success',
            position: 'top',
          });
        } else {
          // Fallback: Open SMS app
          openSMS(formattedPhone, message);
          setStep('success');
          showToast({
            message: 'Please check your messages app',
            type: 'info',
            position: 'top',
          });
        }
      } else {
        // Open SMS app as fallback
        const message = `Your DRYBROS Driver password has been reset. Your temporary password is: ${tempPassword}. Please change it after logging in.`;
        openSMS(formattedPhone, message);
        setStep('success');
        showToast({
          message: 'SMS app opened. Please send the message.',
          type: 'info',
          position: 'top',
        });
      }
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
    } catch (error: any) {
      showToast({
        message: error.message || 'Failed to send password. Please try again.',
        type: 'error',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  }, [driverCode, phoneNumber, showToast, isAvailable, sendSMS, openSMS, onSuccess]);

  const handlePhoneNumberChange = useCallback((text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const handlePhoneSubmit = useCallback(() => {
    Keyboard.dismiss();
    handleRequestPassword();
  }, [handleRequestPassword]);

  if (step === 'success') {
    return (
      <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
      >
        <StatusBar style="light" />
        
        {/* Background Container - Full Screen */}
        <View style={styles.backgroundContainer}>
          <Image
            source={IMAGES.bannerBg}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          {/* Gradient Overlay for Keyboard Area */}
          <LinearGradient
            colors={['rgba(26, 27, 41, 0)', '#1A1B29']}
            locations={[0, 0.2144]}
            style={styles.gradientOverlay1}
          />
          <LinearGradient
            colors={['rgba(42, 51, 179, 0)', 'rgba(42, 51, 179, 0.4)']}
            locations={[0.5519, 0.9766]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.gradientOverlay2}
          />
        </View>

        {/* Pattern Overlay - Only in logo area */}
        <View style={styles.patternOverlay}>
          <Image
            source={IMAGES.pattern}
            style={styles.patternImage}
            resizeMode="cover"
          />
        </View>

        <View style={[styles.content, { paddingTop: insets.top + normalizeHeight(40) }]}>
          <Animated.View 
            style={[
              styles.successCard,
              {
                opacity: successFadeAnim,
                transform: [{ scale: successScaleAnim }],
              }
            ]}
          >
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
            <Text variant="h4" weight="bold" style={styles.successTitle}>
              Password Sent!
            </Text>
            <Text variant="body" style={styles.successMessage}>
              Your new password has been sent to your phone via SMS. Please check your messages.
            </Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.8}
            >
              <Text variant="h6" weight="semiBold" style={styles.backButtonText}>
                Back to Login
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      enabled={Platform.OS === 'ios'}
    >
      <StatusBar style="light" />
      
      {/* Background Container - Full Screen */}
      <View style={styles.backgroundContainer}>
        <Image
          source={IMAGES.bannerBg}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        {/* Gradient Overlay for Keyboard Area */}
        <LinearGradient
          colors={['rgba(26, 27, 41, 0)', '#1A1B29']}
          locations={[0, 0.2144]}
          style={styles.gradientOverlay1}
        />
        <LinearGradient
          colors={['rgba(42, 51, 179, 0)', 'rgba(42, 51, 179, 0.4)']}
          locations={[0.5519, 0.9766]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.gradientOverlay2}
        />
      </View>

      {/* Pattern Overlay - Only in logo area */}
      <View style={styles.patternOverlay}>
        <Image
          source={IMAGES.pattern}
          style={styles.patternImage}
          resizeMode="cover"
        />
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          scrollEnabled={true}
          alwaysBounceVertical={false}
          nestedScrollEnabled={true}
        >
          <View style={[styles.content, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, normalizeHeight(20)) }]}>
            {/* Back Button */}
            <Animated.View 
              style={[
                styles.backButtonSection,
                {
                  opacity: backButtonAnim,
                  transform: [{ translateX: backButtonTranslateX }],
                }
              ]}
            >
              <TouchableOpacity
                onPress={onBack}
                style={styles.backButtonContainer}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="arrow-back"
                  size={normalizeWidth(24)}
                  color={COLORS.white}
                />
              </TouchableOpacity>
            </Animated.View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              {/* Title */}
              <Animated.View
                style={{
                  opacity: titleAnim,
                  transform: [{ translateY: titleTranslateY }],
                }}
              >
                <Text variant="h4" weight="bold" style={styles.title}>
                  Forgot Password
                </Text>
              </Animated.View>
              
              <Animated.View
                style={{
                  opacity: subtitleAnim,
                  transform: [{ translateY: subtitleTranslateY }],
                }}
              >
                <Text variant="body" style={styles.subtitle}>
                  Enter your driver code and phone number to receive a new password via SMS
                </Text>
              </Animated.View>

              {/* Driver Code Input */}
              <Animated.View 
                style={[
                  styles.inputWrapper,
                  {
                    opacity: input1Anim,
                    transform: [{ translateY: input1TranslateY }],
                  }
                ]}
              >
                <View style={styles.inputFieldContainer}>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Enter Driver Code"
                    placeholderTextColor="#B4B7E0"
                    value={driverCode}
                    onChangeText={setDriverCode}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="default"
                    keyboardAppearance="dark"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={dismissKeyboard}
                  />
                </View>
              </Animated.View>

              {/* Phone Number Input */}
              <Animated.View 
                style={[
                  styles.inputWrapper,
                  {
                    opacity: input2Anim,
                    transform: [{ translateY: input2TranslateY }],
                  }
                ]}
              >
                <View style={styles.inputFieldContainer}>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Enter Phone Number"
                    placeholderTextColor="#B4B7E0"
                    value={phoneNumber}
                    onChangeText={handlePhoneNumberChange}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardAppearance="dark"
                    returnKeyType="done"
                    onSubmitEditing={handlePhoneSubmit}
                  />
                </View>
              </Animated.View>

              {/* Request Password Button */}
              <Animated.View
                style={{
                  opacity: buttonAnim,
                  transform: [
                    { scale: buttonScale },
                    { translateY: buttonTranslateY },
                  ],
                }}
              >
                <TouchableOpacity
                  style={[styles.requestButton, loading && styles.requestButtonDisabled]}
                  onPress={handleRequestPassword}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text variant="h6" weight="semiBold" style={styles.requestButtonText}>
                    {loading ? 'Sending...' : 'Send Password via SMS'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1B29',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  backgroundContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: '#1A1B29',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay1: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  gradientOverlay2: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  patternOverlay: {
    position: 'absolute',
    width: '100%',
    height: '40%',
    top: 0,
    left: 0,
    opacity: 0.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternImage: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: normalizeWidth(24),
    backgroundColor: 'transparent',
  },
  backButtonSection: {
    paddingTop: normalizeHeight(20),
    paddingBottom: normalizeHeight(120),
    alignItems: 'flex-start',
  },
  backButtonContainer: {
    padding: normalizeWidth(8),
  },
  formContainer: {
    justifyContent: 'flex-start',
    paddingTop: normalizeHeight(80),
    paddingBottom: normalizeHeight(40),
  },
  title: {
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: normalizeHeight(8),
    fontSize: normalizeFont(FONT_SIZES['2xl']),
    fontFamily: FONT_FAMILY.bold,
  },
  subtitle: {
    color: '#B4B7E0',
    textAlign: 'center',
    marginBottom: normalizeHeight(40),
    fontSize: normalizeFont(FONT_SIZES.base),
    fontFamily: FONT_FAMILY.regular,
  },
  inputWrapper: {
    marginBottom: normalizeHeight(24),
  },
  inputFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.white,
    paddingBottom: normalizeHeight(8),
  },
  inputField: {
    flex: 1,
    color: COLORS.white,
    fontSize: normalizeFont(FONT_SIZES.base),
    fontFamily: FONT_FAMILY.regular,
    paddingVertical: normalizeHeight(8),
  },
  requestButton: {
    backgroundColor: COLORS.white,
    paddingVertical: normalizeHeight(18),
    borderRadius: normalizeWidth(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: normalizeHeight(32),
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestButtonDisabled: {
    opacity: 0.6,
  },
  requestButtonText: {
    color: '#1A1B29',
    fontSize: normalizeFont(16),
    fontFamily: FONT_FAMILY.satoshiBold,
    fontWeight: '700',
    lineHeight: normalizeFont(16),
    letterSpacing: 0,
  },
  successCard: {
    padding: normalizeWidth(32),
    borderRadius: normalizeWidth(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  successIcon: {
    width: normalizeWidth(80),
    height: normalizeWidth(80),
    borderRadius: normalizeWidth(40),
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: normalizeHeight(24),
  },
  successIconText: {
    fontSize: normalizeWidth(40),
    color: COLORS.white,
    fontWeight: 'bold',
  },
  successTitle: {
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: normalizeHeight(12),
    fontSize: normalizeFont(FONT_SIZES['2xl']),
    fontFamily: FONT_FAMILY.bold,
  },
  successMessage: {
    color: '#B4B7E0',
    textAlign: 'center',
    marginBottom: normalizeHeight(32),
    lineHeight: normalizeHeight(24),
    fontSize: normalizeFont(FONT_SIZES.base),
    fontFamily: FONT_FAMILY.regular,
  },
  backButton: {
    backgroundColor: COLORS.white,
    paddingVertical: normalizeHeight(18),
    paddingHorizontal: normalizeWidth(32),
    borderRadius: normalizeWidth(12),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    color: '#1A1B29',
    fontSize: normalizeFont(16),
    fontFamily: FONT_FAMILY.satoshiBold,
    fontWeight: '700',
    lineHeight: normalizeFont(16),
    letterSpacing: 0,
  },
});

export default ForgotPasswordScreen;
