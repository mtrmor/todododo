import {
  ArrowRight,
  Check,
  Eye,
  EyeSlash,
  PathIcon,
  WarningCircle,
} from "phosphor-react-native";
import { Link, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { colors, fonts, getErrorMessage, useAuth } from "@/core";

export type AuthScreenProps = {
  variant: "sign-in" | "sign-up";
};

type FieldErrors = Partial<
  Record<"email" | "password" | "passwordConfirmation", string>
>;

export function AuthScreen({ variant }: AuthScreenProps) {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { status, signIn, signUp } = useAuth();
  const passwordRef = useRef<TextInput>(null);
  const confirmationRef = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const isSignUp = variant === "sign-up";
  const isCompact = width < 760;

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/inbox");
    }
  }, [router, status]);

  function validate() {
    const nextErrors: FieldErrors = {};
    const normalizedEmail = email.trim();

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (password.length < 8) {
      nextErrors.password = "Use at least 8 characters.";
    }
    if (isSignUp && passwordConfirmation !== password) {
      nextErrors.passwordConfirmation = "Passwords do not match.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (submitting || !validate()) {
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (isSignUp) {
        await signUp(email.trim(), password);
      } else {
        await signIn(email.trim(), password);
      }
      router.replace("/inbox");
    } catch (error) {
      setFormError(
        getErrorMessage(
          error,
          isSignUp
            ? "Your account could not be created. Try again."
            : "Your email or password was not accepted.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: colors.railFog }}
    >
      <View
        style={{
          flex: 1,
          minHeight: isCompact ? 700 : 760,
          flexDirection: isCompact ? "column" : "row",
        }}
      >
        {!isCompact ? (
          <View
            style={{
              width: "42%",
              minWidth: 390,
              justifyContent: "space-between",
              overflow: "hidden",
              paddingHorizontal: 54,
              paddingVertical: 48,
              backgroundColor: colors.ink,
            }}
          >
            <BrandMark inverted />

            <View style={{ maxWidth: 400, gap: 28 }}>
              <View style={{ gap: 13 }}>
                <Text
                  selectable
                  style={{
                    color: colors.paper,
                    fontFamily: fonts.heading,
                    fontSize: 43,
                    fontWeight: "700",
                    letterSpacing: -1.7,
                    lineHeight: 49,
                  }}
                >
                  Keep the route clear.
                </Text>
                <Text
                  selectable
                  style={{
                    maxWidth: 350,
                    color: colors.inkOnDarkMuted,
                    fontFamily: fonts.body,
                    fontSize: 16,
                    lineHeight: 25,
                  }}
                >
                  One quiet place for the work ahead, without the noise around it.
                </Text>
              </View>

              <View style={{ gap: 11 }}>
                <RouteStep label="Capture what matters" index={0} />
                <RouteStep label="Follow the next clear step" index={1} />
                <RouteStep label="Close the loop" index={2} />
              </View>
            </View>

            <Text
              style={{
                color: colors.inkOnDarkMuted,
                fontFamily: fonts.body,
                fontSize: 12,
              }}
            >
              TodoDodo · Quiet route
            </Text>
          </View>
        ) : null}

        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: isCompact ? 20 : 48,
            paddingVertical: isCompact ? 28 : 54,
            backgroundColor: colors.paper,
          }}
        >
          <View style={{ width: "100%", maxWidth: 420, gap: 31 }}>
            {isCompact ? <BrandMark /> : null}

            <View style={{ gap: 9 }}>
              <Text
                selectable
                style={{
                  color: colors.ink,
                  fontFamily: fonts.heading,
                  fontSize: isCompact ? 30 : 34,
                  fontWeight: "700",
                  letterSpacing: -0.9,
                  lineHeight: isCompact ? 38 : 42,
                }}
              >
                {isSignUp ? "Create your account" : "Welcome back"}
              </Text>
              <Text
                selectable
                style={{
                  color: colors.mutedInk,
                  fontFamily: fonts.body,
                  fontSize: 15,
                  lineHeight: 22,
                }}
              >
                {isSignUp
                  ? "Start a calmer route through your day."
                  : "Sign in to continue to your tasks."}
              </Text>
            </View>

            <View style={{ gap: 18 }}>
              {formError ? (
                <View
                  accessibilityLiveRegion="polite"
                  accessibilityRole="alert"
                  style={{
                    minHeight: 48,
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 9,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: colors.dangerLine,
                    borderRadius: 12,
                    borderCurve: "continuous",
                    backgroundColor: colors.dangerSurface,
                  }}
                >
                  <WarningCircle
                    aria-hidden
                    color={colors.danger}
                    size={18}
                    weight="fill"
                  />
                  <Text
                    selectable
                    style={{
                      flex: 1,
                      color: colors.danger,
                      fontFamily: fonts.body,
                      fontSize: 13,
                      lineHeight: 19,
                    }}
                  >
                    {formError}
                  </Text>
                </View>
              ) : null}

              <FormField
                autoCapitalize="none"
                autoComplete="email"
                error={fieldErrors.email}
                keyboardType="email-address"
                label="Email"
                onChangeText={(value) => {
                  setEmail(value);
                  if (fieldErrors.email) setFieldErrors((current) => ({ ...current, email: undefined }));
                }}
                onSubmitEditing={() => passwordRef.current?.focus()}
                placeholder="you@example.com"
                returnKeyType="next"
                value={email}
              />

              <FormField
                autoCapitalize="none"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                error={fieldErrors.password}
                inputRef={passwordRef}
                label="Password"
                onChangeText={(value) => {
                  setPassword(value);
                  if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: undefined }));
                }}
                onSubmitEditing={() =>
                  isSignUp ? confirmationRef.current?.focus() : void handleSubmit()
                }
                placeholder={isSignUp ? "At least 8 characters" : "Your password"}
                returnKeyType={isSignUp ? "next" : "go"}
                secureTextEntry={!passwordVisible}
                trailingAction={{
                  label: passwordVisible ? "Hide password" : "Show password",
                  onPress: () => setPasswordVisible((current) => !current),
                  icon: passwordVisible ? EyeSlash : Eye,
                }}
                value={password}
              />

              {isSignUp ? (
                <FormField
                  autoCapitalize="none"
                  autoComplete="new-password"
                  error={fieldErrors.passwordConfirmation}
                  inputRef={confirmationRef}
                  label="Confirm password"
                  onChangeText={(value) => {
                    setPasswordConfirmation(value);
                    if (fieldErrors.passwordConfirmation) {
                      setFieldErrors((current) => ({
                        ...current,
                        passwordConfirmation: undefined,
                      }));
                    }
                  }}
                  onSubmitEditing={() => void handleSubmit()}
                  placeholder="Repeat your password"
                  returnKeyType="go"
                  secureTextEntry={!passwordVisible}
                  value={passwordConfirmation}
                />
              ) : null}

              <Pressable
                accessibilityLabel={isSignUp ? "Create account" : "Sign in"}
                accessibilityRole="button"
                disabled={submitting}
                onPress={() => void handleSubmit()}
                style={({ pressed }) => ({
                  minHeight: 48,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 9,
                  paddingHorizontal: 18,
                  borderRadius: 12,
                  borderCurve: "continuous",
                  backgroundColor: pressed
                    ? colors.routeVioletPressed
                    : colors.routeViolet,
                  opacity: submitting ? 0.72 : 1,
                  cursor: submitting ? "auto" : "pointer",
                  outlineColor: colors.focusRing,
                  outlineOffset: 2,
                })}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.paper} size="small" />
                ) : (
                  <>
                    <Text
                      style={{
                        color: colors.paper,
                        fontFamily: fonts.body,
                        fontSize: 14,
                        fontWeight: "600",
                      }}
                    >
                      {isSignUp ? "Create account" : "Sign in"}
                    </Text>
                    <ArrowRight
                      aria-hidden
                      color={colors.paper}
                      size={17}
                      weight="bold"
                    />
                  </>
                )}
              </Pressable>
            </View>

            <View
              style={{
                minHeight: 44,
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                selectable
                style={{
                  color: colors.mutedInk,
                  fontFamily: fonts.body,
                  fontSize: 14,
                  lineHeight: 21,
                }}
              >
                {isSignUp ? "Already have an account? " : "New to TodoDodo? "}
              </Text>
              <Link href={isSignUp ? "/sign-in" : "/sign-up"} asChild>
                <Pressable
                  accessibilityLabel={isSignUp ? "Sign in" : "Create an account"}
                  accessibilityRole="link"
                  style={({ pressed }) => ({
                    minHeight: 44,
                    justifyContent: "center",
                    opacity: pressed ? 0.6 : 1,
                    cursor: "pointer",
                    outlineColor: colors.focusRing,
                  })}
                >
                  <Text
                    style={{
                      color: colors.routeViolet,
                      fontFamily: fonts.body,
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    {isSignUp ? "Sign in" : "Create an account"}
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function BrandMark({ inverted = false }: { inverted?: boolean }) {
  return (
    <View
      accessibilityLabel="TodoDodo"
      accessibilityRole="header"
      style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 10,
          borderCurve: "continuous",
          backgroundColor: inverted
            ? colors.routeViolet
            : colors.lavenderSelection,
        }}
      >
        <PathIcon
          aria-hidden
          color={inverted ? colors.paper : colors.routeViolet}
          size={20}
          weight="bold"
        />
      </View>
      <Text
        style={{
          color: inverted ? colors.paper : colors.ink,
          fontFamily: fonts.heading,
          fontSize: 17,
          fontWeight: "700",
          letterSpacing: -0.3,
        }}
      >
        TodoDodo
      </Text>
    </View>
  );
}

function RouteStep({ label, index }: { label: string; index: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
      <View
        style={{
          width: 24,
          height: 24,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          borderCurve: "continuous",
          backgroundColor:
            index === 1 ? colors.routeViolet : colors.inkRaised,
        }}
      >
        <Check
          aria-hidden
          color={index === 1 ? colors.paper : colors.inkOnDarkMuted}
          size={13}
          weight="bold"
        />
      </View>
      <Text
        style={{
          color: colors.paper,
          fontFamily: fonts.body,
          fontSize: 14,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

type IconComponent = typeof Eye;

type FormFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  onSubmitEditing: () => void;
  error?: string;
  inputRef?: React.RefObject<TextInput | null>;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: "email" | "current-password" | "new-password";
  keyboardType?: "default" | "email-address";
  returnKeyType?: "next" | "go";
  secureTextEntry?: boolean;
  trailingAction?: {
    icon: IconComponent;
    label: string;
    onPress: () => void;
  };
};

function FormField({
  label,
  value,
  placeholder,
  onChangeText,
  onSubmitEditing,
  error,
  inputRef,
  autoCapitalize,
  autoComplete,
  keyboardType,
  returnKeyType,
  secureTextEntry,
  trailingAction,
}: FormFieldProps) {
  const TrailingIcon = trailingAction?.icon;

  return (
    <View style={{ gap: 7 }}>
      <Text
        style={{
          color: colors.ink,
          fontFamily: fonts.body,
          fontSize: 13,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
      <View style={{ position: "relative", justifyContent: "center" }}>
        <TextInput
          accessibilityLabel={label}
          aria-invalid={Boolean(error)}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          ref={inputRef}
          returnKeyType={returnKeyType}
          secureTextEntry={secureTextEntry}
          selectionColor={colors.routeViolet}
          style={{
            minHeight: 48,
            paddingHorizontal: 14,
            paddingRight: trailingAction ? 50 : 14,
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.softLine,
            borderRadius: 12,
            borderCurve: "continuous",
            backgroundColor: colors.paper,
            color: colors.ink,
            fontFamily: fonts.body,
            fontSize: 15,
            outlineColor: colors.focusRing,
            outlineOffset: 1,
          }}
          value={value}
        />
        {trailingAction && TrailingIcon ? (
          <Pressable
            accessibilityLabel={trailingAction.label}
            accessibilityRole="button"
            hitSlop={4}
            onPress={trailingAction.onPress}
            style={({ pressed }) => ({
              position: "absolute",
              right: 2,
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.62 : 1,
              cursor: "pointer",
              outlineColor: colors.focusRing,
            })}
          >
            <TrailingIcon
              aria-hidden
              color={colors.mutedInk}
              size={19}
              weight="regular"
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          selectable
          style={{
            color: colors.danger,
            fontFamily: fonts.body,
            fontSize: 12,
            lineHeight: 17,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
