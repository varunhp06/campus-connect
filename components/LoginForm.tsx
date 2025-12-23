import { Ionicons } from "@expo/vector-icons";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { auth } from "../firebaseConfig";
import HapticPressable from "./HapticPressable";
import { useTheme } from "./ThemeContext";
import { useToast } from "./ToastContext";

const { width, height } = Dimensions.get("window");

export const LoginForm: React.FC = () => {
  const { theme, isDarkMode } = useTheme();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Wave Animation Values
  const wave1Offset = useSharedValue(0);
  const wave2Offset = useSharedValue(0);
  const wave3Offset = useSharedValue(0);

  useEffect(() => {
    // Continuous wave animation loop
    const duration = 10000;
    
    wave1Offset.value = withRepeat(
      withTiming(-width, { duration: duration, easing: Easing.linear }),
      -1,
      false
    );
    
    wave2Offset.value = withRepeat(
      withTiming(-width, { duration: duration * 1.5, easing: Easing.linear }),
      -1,
      false
    );

    wave3Offset.value = withRepeat(
      withTiming(-width, { duration: duration * 2, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedWave1 = useAnimatedStyle(() => ({
    transform: [{ translateX: wave1Offset.value }]
  }));

  const animatedWave2 = useAnimatedStyle(() => ({
    transform: [{ translateX: wave2Offset.value }]
  }));

  const animatedWave3 = useAnimatedStyle(() => ({
    transform: [{ translateX: wave3Offset.value }]
  }));

  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !password.trim()) {
      return false;
    }
    if (!emailRegex.test(email)) {
      return false;
    }
    if (password.length < 6) {
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail || !password.trim()) {
      showToast("Please fill in all fields", "warning");
      return;
    }
    if (!emailRegex.test(trimmedEmail)) {
      showToast("Please enter a valid email address", "warning");
      return;
    }
    if (password.length < 6) {
      showToast("Password must be at least 6 characters long", "warning");
      return;
    }
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );
      console.log("User logged in successfully:", userCredential.user.uid);
    } catch (error: any) {
      let errorMessage = "An error occurred during login";
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Invalid email address";
          break;
        case "auth/user-disabled":
          errorMessage = "This account has been disabled";
          break;
        case "auth/user-not-found":
          errorMessage = "No account found with this email";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Try again later.";
          break;
        default:
          errorMessage = error.message;
      }
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showToast("Please enter your email address first", "warning");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      showToast("A password reset link has been sent to your email", "success");
    } catch (error: any) {
      let errorMessage = "Failed to send reset link.";
      if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "No user found with this email.";
      }
      showToast(errorMessage, "error");
    }
  };



  // SVG Wave Path - scalable
  const wavePath = `M0,64L48,58.7C96,53,192,43,288,48C384,53,480,75,576,80C672,85,768,75,864,64C960,53,1056,43,1152,42.7C1248,43,1344,53,1392,58.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z`;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        
        {/* Animated Waves Background */}
        <View style={styles.waveContainer}>
          <Animated.View style={[styles.wave, animatedWave3, { opacity: 0.3 }]}>
             <Svg height="100%" width={width * 4} viewBox="0 0 1440 320" preserveAspectRatio="none">
              <Path fill={theme.primary} d={wavePath} />
            </Svg>
          </Animated.View>
          <Animated.View style={[styles.wave, animatedWave2, { bottom: -20, opacity: 0.5 }]}>
            <Svg height="100%" width={width * 4} viewBox="0 0 1440 320" preserveAspectRatio="none">
              <Path fill={theme.primary} d={wavePath} />
            </Svg>
          </Animated.View>
          <Animated.View style={[styles.wave, animatedWave1, { bottom: -40, opacity: 0.8 }]}>
            <Svg height="100%" width={width * 4} viewBox="0 0 1440 320" preserveAspectRatio="none">
              <Path fill={theme.primary} d={wavePath} />
            </Svg>
          </Animated.View>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.contentContainer}
        >
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Welcome</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
              Sign in to continue
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.form}>
            {/* Email Input */}
            <View style={[styles.inputWrapper, { borderBottomColor: theme.primaryText }]}>
              <Ionicons name="mail-outline" size={20} color={theme.placeholder} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Email Address"
                placeholderTextColor={theme.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            {/* Password Input */}
            <View style={[styles.inputWrapper, { borderBottomColor: theme.primaryText }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.placeholder} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Password"
                placeholderTextColor={theme.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={theme.placeholder}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.forgotButton}
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              <Text style={[styles.forgotText, { color: theme.secondaryText }]}>Forgot Password?</Text>
            </TouchableOpacity>

            <HapticPressable
              style={({ pressed }) => [
                styles.loginButton,
                { backgroundColor: theme.primary },
                { opacity: pressed ? 0.9 : 1 },
                isLoading && styles.disabledButton
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </HapticPressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 250,
    overflow: 'hidden',
    zIndex: 1,
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: width * 4,
    height: '100%',
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontSize: 40,
    fontWeight: '300', // Light font weight for minimalist look
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    opacity: 0.7,
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    marginBottom: 24,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    paddingVertical: 4,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 40,
  },
  forgotText: {
    fontSize: 14,
  },
  loginButton: {
    height: 56,
    borderRadius: 28, // Pill shape
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});