import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { GradientBackground } from '@/components/GradientBackground';
import { GlowCard } from '@/components/GlowCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { GoogleIcon } from '@/components/GoogleIcon';
import { Logo } from '@/components/Logo';
import { useColors } from '@/hooks/useColors';
import { useProgress } from '@/context/ProgressContext';
import { APP_NAME } from '@/constants/app';

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useProgress();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const isRegister = mode === 'register';
  const passwordsMatch = password === confirm;
  const showMismatch = isRegister && confirm.length > 0 && !passwordsMatch;

  const canSubmit =
    email.trim().length > 2 &&
    password.trim().length >= 4 &&
    (!isRegister ||
      (name.trim().length > 1 && confirm.length >= 4 && passwordsMatch));

  const submit = () => {
    // Frontend-only prototype: no real auth. This creates/confirms the local
    // device profile (see CLAUDE.md local-first model) and enters the app.
    completeOnboarding(isRegister && name.trim().length > 0 ? name.trim() : null);
    router.replace('/home');
  };

  const submitGoogle = () => {
    // Google Sign-In is not implemented (no real OAuth) — do not silently
    // treat this as a working login method (WL-002). Same demo-Alert
    // pattern already used for "Şifreni mi unuttun?" on this screen.
    Alert.alert(
      'Google ile Giriş',
      'Google ile giriş bu sürümde henüz aktif değil. E-posta ile devam edebilirsin.',
    );
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setConfirm('');
  };

  return (
    <GradientBackground>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 44, paddingBottom: insets.bottom + 36 },
        ]}
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <Logo />
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            {isRegister
              ? `${APP_NAME} yolculuğuna başla.`
              : `${APP_NAME}'a tekrar hoş geldin.`}
          </Text>
        </View>

        {/* Mode switch */}
        <View style={[styles.switch, { backgroundColor: colors.secondary }]}>
          {(['login', 'register'] as Mode[]).map((m) => {
            const active = mode === m;
            return (
              <Pressable
                key={m}
                onPress={() => switchMode(m)}
                accessibilityRole="tab"
                accessibilityLabel={m === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
                accessibilityState={{ selected: active }}
                style={[
                  styles.switchBtn,
                  {
                    backgroundColor: active ? colors.primary : 'transparent',
                    borderRadius: colors.radius - 8,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.switchText,
                    { color: active ? colors.primaryForeground : colors.mutedForeground },
                  ]}
                >
                  {m === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <GlowCard style={styles.form}>
          {isRegister ? (
            <Field
              icon="user"
              placeholder="Adın"
              value={name}
              onChangeText={setName}
              textContentType="name"
            />
          ) : null}
          <Field
            icon="mail"
            placeholder="E-posta"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <Field
            icon="lock"
            placeholder="Şifre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {isRegister ? (
            <>
              <Field
                icon="lock"
                placeholder="Şifre (Tekrar)"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                error={showMismatch}
              />
              {showMismatch ? (
                <View style={styles.hintRow}>
                  <Feather name="alert-circle" size={13} color={colors.destructive} />
                  <Text style={[styles.hintText, { color: colors.destructive }]}>
                    Şifreler eşleşmiyor.
                  </Text>
                </View>
              ) : null}
            </>
          ) : null}

          {!isRegister ? (
            <Pressable
              style={styles.forgot}
              onPress={() =>
                Alert.alert(
                  'Şifre Sıfırlama',
                  'Bu bir demo — şifre sıfırlama e-postası gönderildiğini varsayabilirsin.',
                )
              }
              accessibilityRole="button"
              accessibilityLabel="Şifreni mi unuttun?"
            >
              <Text style={[styles.forgotText, { color: colors.accent }]}>
                Şifreni mi unuttun?
              </Text>
            </Pressable>
          ) : null}

          <PrimaryButton
            label={isRegister ? 'Hesap Oluştur' : 'Giriş Yap'}
            icon="arrow-right"
            onPress={submit}
            disabled={!canSubmit}
            testID="auth-submit"
            style={{ marginTop: isRegister ? 4 : 2 }}
          />
        </GlowCard>

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>
            veya
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        <Pressable
          onPress={submitGoogle}
          testID="auth-google"
          accessibilityRole="button"
          accessibilityLabel={isRegister ? 'Google ile kayıt ol' : 'Google ile giriş yap'}
          style={({ pressed }) => [
            styles.googleBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.borderStrong,
              borderRadius: colors.radius,
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.99 : 1 }],
            },
          ]}
        >
          <GoogleIcon size={22} />
          <Text style={[styles.googleText, { color: colors.foreground }]}>
            {isRegister ? 'Google ile kayıt ol' : 'Google ile giriş yap'}
          </Text>
        </Pressable>

        {isRegister ? (
          <Text style={[styles.terms, { color: colors.mutedForeground }]}>
            Kayıt olarak{' '}
            <Text
              style={[styles.termsLink, { color: colors.accent }]}
              onPress={() => router.push('/legal/terms')}
            >
              Kullanım Koşulları
            </Text>
            {' '}ve{' '}
            <Text
              style={[styles.termsLink, { color: colors.accent }]}
              onPress={() => router.push('/legal/privacy')}
            >
              Gizlilik Politikası
            </Text>
            'nı kabul etmiş olursun.
          </Text>
        ) : null}

        <Pressable
          style={styles.skip}
          onPress={submit}
          accessibilityRole="button"
          accessibilityLabel="Şimdilik geç"
        >
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
            Şimdilik geç
          </Text>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </GradientBackground>
  );
}

function Field({
  icon,
  secureTextEntry,
  error,
  ...props
}: {
  icon: keyof typeof Feather.glyphMap;
  error?: boolean;
} & React.ComponentProps<typeof TextInput>) {
  const colors = useColors();
  const [hidden, setHidden] = useState(true);
  const secure = !!secureTextEntry;
  return (
    <View
      style={[
        fieldStyles.wrap,
        {
          backgroundColor: colors.input,
          borderColor: error ? colors.destructive : colors.border,
          borderRadius: colors.radius - 8,
        },
      ]}
    >
      <Feather name={icon} size={18} color={colors.mutedForeground} />
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        style={[fieldStyles.input, { color: colors.foreground }]}
        autoCapitalize="none"
        secureTextEntry={secure && hidden}
        accessibilityLabel={typeof props.placeholder === 'string' ? props.placeholder : undefined}
        {...props}
      />
      {secure ? (
        <Pressable
          onPress={() => setHidden((h) => !h)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={hidden ? 'Şifreyi göster' : 'Şifreyi gizle'}
        >
          <Feather
            name={hidden ? 'eye-off' : 'eye'}
            size={18}
            color={colors.mutedForeground}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    height: '100%',
  },
});

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
  },
  brand: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  tagline: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  switch: {
    flexDirection: 'row',
    padding: 5,
    borderRadius: 18,
    marginBottom: 18,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  switchText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  form: {
    gap: 14,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -6,
  },
  hintText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12.5,
  },
  forgot: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 22,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 56,
    borderWidth: 1,
  },
  googleText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  terms: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 18,
    paddingHorizontal: 12,
  },
  termsLink: {
    fontFamily: 'Inter_600SemiBold',
  },
  skip: {
    alignItems: 'center',
    marginTop: 22,
  },
  skipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
});
