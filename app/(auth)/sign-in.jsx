import { useState } from "react";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  View, 
  Text, 
  ScrollView, 
  Alert, 
  Image, 
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform 
} from "react-native";

import { images, icons } from "../../constants";
import { getCurrentUser, signIn } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import { useTranslation } from "../../hooks/useTranslation";

const SignIn = () => {
  const { refreshUser, setIsLogged } = useGlobalContext();
  const t = useTranslation();
  const [isSubmitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const submit = async () => {
    if (form.email === "" || form.password === "") {
      return Alert.alert(t("common.error"), t("auth.signIn.fillAllFields"));
    }

    setSubmitting(true);

    try {
      await signIn(form.email, form.password);
      setIsLogged(true);
      await refreshUser(); // This will fetch user data and household if exists

      Alert.alert(t("common.success"), t("auth.signIn.signInSuccess"));
      router.replace("/home");
    } catch (error) {
      Alert.alert(t("common.error"), error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={images.logo}
              resizeMode="contain"
              style={styles.logo}
            />
          </View>
          
          <View style={styles.formContainer}>
            <Text style={styles.title}>{t("auth.signIn.title")}</Text>
            <Text style={styles.subtitle}>{t("auth.signIn.subtitle")}</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t("auth.signIn.email")}</Text>
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={(text) => setForm({ ...form, email: text })}
                placeholder={t("auth.signIn.emailPlaceholder")}
                placeholderTextColor="#999999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t("auth.signIn.password")}</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={form.password}
                  onChangeText={(text) => setForm({ ...form, password: text })}
                  placeholder={t("auth.signIn.passwordPlaceholder")}
                  placeholderTextColor="#999999"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Image
                    source={showPassword ? icons.eye : icons["eye-hide"]}
                    style={styles.passwordToggleIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity
              style={[
                styles.signInButton,
                isSubmitting && styles.signInButtonDisabled
              ]}
              onPress={submit}
              disabled={isSubmitting}
            >
              <Text style={styles.signInButtonText}>
                {isSubmitting ? t("auth.signIn.signingIn") : t("auth.signIn.signIn")}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>{t("auth.signIn.noAccount")}</Text>
              <Link href="/sign-up" asChild>
                <TouchableOpacity>
                  <Text style={styles.signUpLink}>{t("auth.signIn.signUp")}</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const COLORS = {
  bg: '#0A0A0C',
  card: '#18181B',
  border: '#3F3F46',
  accent: '#F43F5E',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  passwordContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  passwordToggle: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  passwordToggleIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.textMuted,
  },
  signInButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginRight: 4,
  },
  signUpLink: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default SignIn;
