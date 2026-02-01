/**
 * Login Screen Component
 * Driver login with driver code and password
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
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
import { getFontFamily, FONT_SIZES } from '../constants/typography';
import { loginApi } from '../services/api/auth';
import { LOGIN_REMEMBER_ME_LABEL } from '../constants/auth';
import {
  disableRememberMe,
  enableRememberMe,
  loadRememberMeState,
} from '../services/storage/rememberMe';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
  onForgotPassword?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onForgotPassword,
}) => {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [driverCode, setDriverCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [rememberMeHydrated, setRememberMeHydrated] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const brandFadeAnim = useRef(new Animated.Value(0)).current;
  const brandSlideAnim = useRef(new Animated.Value(-30)).current;
  const input1Anim = useRef(new Animated.Value(0)).current;
  const input2Anim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const forgotPasswordAnim = useRef(new Animated.Value(0)).current;

  // Pre-compute interpolations for better performance
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

  const forgotPasswordTranslateY = useMemo(
    () =>
      forgotPasswordAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [10, 0],
      }),
    [forgotPasswordAnim]
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
    // Branding animation
    Animated.parallel([
      Animated.timing(brandFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(brandSlideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Form animations with stagger
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(input1Anim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(input2Anim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(forgotPasswordAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(100),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { enabled, credentials } = await loadRememberMeState();
      if (cancelled) return;

      setRememberMe(enabled);
      if (credentials) {
        setDriverCode(credentials.driverCode);
        setPassword(credentials.password);
      }
      setRememberMeHydrated(true);
    })().catch(() => {
      // Non-blocking: login screen should still work if storage read fails.
      setRememberMeHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // If the user disables "Remember me", clear any saved credentials immediately.
    if (!rememberMeHydrated) return;
    if (!rememberMe) {
      disableRememberMe().catch(() => {
        // Best-effort cleanup.
      });
    }
  }, [rememberMe, rememberMeHydrated]);

  const handleLogin = useCallback(async () => {
    if (!driverCode.trim()) {
      showToast({
        message: 'Please enter your driver code',
        type: 'error',
        position: 'top',
      });
      return;
    }

    if (!password.trim()) {
      showToast({
        message: 'Please enter your password',
        type: 'error',
        position: 'top',
      });
      return;
    }

    setLoading(true);
    try {
      await loginApi({
        driverCode: driverCode.trim(),
        password: password.trim(),
      });

      if (rememberMe) {
        await enableRememberMe({
          driverCode: driverCode.trim(),
          password: password.trim(),
        });
      } else {
        await disableRememberMe();
      }
      
      showToast({
        message: 'Login successful!',
        type: 'success',
        position: 'top',
      });
      
      onLoginSuccess?.();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Login failed. Please try again.';
      showToast({
        message: errorMessage,
        type: 'error',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  }, [driverCode, password, rememberMe, showToast, onLoginSuccess]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const toggleRememberMe = useCallback(() => {
    setRememberMe((prev) => !prev);
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const handlePasswordSubmit = useCallback(() => {
    Keyboard.dismiss();
    handleLogin();
  }, [handleLogin]);

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
          <View style={[
            styles.content,
            {
              paddingTop: insets.top,
              paddingBottom: Math.max(insets.bottom, normalizeHeight(20)),
            },
          ]}>
        {/* Branding Section */}
        <Animated.View 
          style={[
            styles.brandingContainer,
            {
              opacity: brandFadeAnim,
              transform: [{ translateY: brandSlideAnim }],
            }
          ]}
        >
          <View style={styles.brandingTextContainer}>
            <View style={styles.brandingTextRow}>
              <Text style={styles.brandingTextRed}>DRY</Text>
              <Text style={styles.brandingTextWhite}>BROS</Text>
            </View>
            <Text variant="h5" weight="medium" style={styles.driverText}>
              DRIVER
            </Text>
          </View>
        </Animated.View>

        {/* Form Section */}
        <Animated.View 
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
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

          {/* Password Input */}
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
                placeholder="Enter Password"
                placeholderTextColor="#B4B7E0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardAppearance="dark"
                returnKeyType="done"
                onSubmitEditing={handlePasswordSubmit}
              />
              <TouchableOpacity
                onPress={togglePasswordVisibility}
                style={styles.passwordToggle}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={normalizeWidth(20)}
                  color={COLORS.white}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Remember Me */}
          <TouchableOpacity
            onPress={toggleRememberMe}
            activeOpacity={0.8}
            style={styles.rememberMeRow}
          >
            <Ionicons
              name={rememberMe ? 'checkbox-outline' : 'square-outline'}
              size={normalizeWidth(18)}
              color={COLORS.white}
            />
            <Text variant="caption" style={styles.rememberMeText}>
              {LOGIN_REMEMBER_ME_LABEL}
            </Text>
          </TouchableOpacity>

          {/* Forgot Password Link */}
          <Animated.View
            style={{
              opacity: forgotPasswordAnim,
              transform: [{ translateY: forgotPasswordTranslateY }],
            }}
          >
            <TouchableOpacity
              onPress={onForgotPassword}
              style={styles.forgotPasswordContainer}
            >
              <Text variant="caption" style={styles.forgotPasswordText}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Login Button */}
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
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text variant="h6" weight="semiBold" style={styles.loginButtonText}>
                {loading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
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
  brandingContainer: {
    paddingTop: normalizeHeight(60),
    paddingBottom: normalizeHeight(120),
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandingTextContainer: {
    alignItems: 'center',
  },
  brandingTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalizeHeight(8),
  },
  brandingTextRed: {
    fontSize: normalizeFont(FONT_SIZES['5xl']),
    fontFamily: getFontFamily('bold'),
    color: COLORS.error,
  },
  brandingTextWhite: {
    fontSize: normalizeFont(FONT_SIZES['5xl']),
    fontFamily: getFontFamily('bold'),
    color: COLORS.white,
  },
  driverText: {
    color: COLORS.white,
    letterSpacing: normalizeWidth(4),
    marginTop: normalizeHeight(4),
  },
  formContainer: {
    justifyContent: 'flex-start',
    paddingTop: normalizeHeight(80),
    paddingBottom: normalizeHeight(40),
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
    fontFamily: getFontFamily('regular'),
    paddingVertical: normalizeHeight(8),
  },
  passwordToggle: {
    padding: normalizeWidth(8),
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginBottom: normalizeHeight(24),
    marginTop: normalizeHeight(-8),
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: normalizeHeight(-6),
    marginBottom: normalizeHeight(18),
    gap: normalizeWidth(8),
  },
  rememberMeText: {
    color: COLORS.white,
    opacity: 0.85,
  },
  forgotPasswordText: {
    color: '#B4B7E0',
  },
  loginButton: {
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
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#1A1B29',
    fontSize: normalizeFont(16),
    fontFamily: getFontFamily('satoshiBold'),
    fontWeight: '700',
    lineHeight: normalizeFont(16),
    letterSpacing: 0,
  },
});

export default LoginScreen;
