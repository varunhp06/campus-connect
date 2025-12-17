import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import { useTheme } from "./ThemeContext";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import HapticPressable from "./HapticPressable";
import CustomAlert from "./CustomAlert"; 

export const LoginForm: React.FC = () => {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
  });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  const closeAlert = () => {
    setAlertVisible(false);
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail || !password.trim()) {
      showAlert("Validation Error", "Please fill in all fields.");
      return;
    }
    if (!emailRegex.test(trimmedEmail)) {
      showAlert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      showAlert(
        "Weak Password",
        "Password must be at least 6 characters long."
      );
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
      showAlert("Login Failed", errorMessage);
      console.log("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showAlert("Reset Password", "Please enter your email address first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      showAlert(
        "Password Reset",
        "A password reset link has been sent to your email."
      );
    } catch (error: any) {
      let errorMessage = "Failed to send reset link.";
      if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "No user found with this email.";
      }
      showAlert("Error", errorMessage);
    }
  };

  return (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.connect, { color: theme.text }]}>
          <Text style={[styles.campus, { color: theme.primaryText }]}>
            CAMPUS
          </Text>
          CONNECT
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
              color: theme.text,
            },
          ]}
          placeholder="Email"
          placeholderTextColor={theme.placeholder}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!isLoading}
        />

        <View
          style={[
            styles.passwordContainer,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          <TextInput
            style={[styles.passwordInput, { color: theme.text }]}
            placeholder="Password"
            placeholderTextColor={theme.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            disabled={isLoading}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color={theme.placeholder}
            />
          </TouchableOpacity>
        </View>

        <HapticPressable
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          onPress={handleForgotPassword}
          disabled={isLoading}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </HapticPressable>
      </View>

      <HapticPressable
        style={({ pressed }) => [
          styles.button,
          isLoading && styles.buttonDisabled,
          { opacity: pressed && !isLoading ? 0.7 : 1 },
        ]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>SIGN IN</Text>
        )}
      </HapticPressable>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={closeAlert}
        onConfirm={closeAlert}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: "5%",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  connect: {
    fontFamily: "OpenSans_Light",
    fontSize: 30,
  },
  campus: {
    fontFamily: "OpenSans_Bold",
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  forgotText: {
    color: "#007AFF",
    fontSize: 14,
    textAlign: "right",
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#ffffff",
    fontFamily: "OpenSans_Bold",
    fontSize: 16,
  },
});