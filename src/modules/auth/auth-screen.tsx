import { Eye, EyeSlash } from "phosphor-react-native";
import { ScrollView, View } from "react-native";

import { AuthFormError } from "@/modules/auth/components/auth-form-error/auth-form-error";
import { AuthSubmitAction } from "@/modules/auth/components/auth-submit-action/auth-submit-action";
import { AuthSwitchLink } from "@/modules/auth/components/auth-switch-link/auth-switch-link";
import { AuthText } from "@/modules/auth/components/auth-text/auth-text";
import { BrandMark } from "@/modules/auth/components/brand-mark/brand-mark";
import { FormField } from "@/modules/auth/components/form-field/form-field";
import { RouteStep } from "@/modules/auth/components/route-step/route-step";
import { useAuthForm } from "@/modules/auth/hooks/use-auth-form";
import { styles } from "@/modules/auth/styles";

export type AuthScreenProps = { variant: "sign-in" | "sign-up" };

export function AuthScreen({ variant }: AuthScreenProps) {
  const form = useAuthForm(variant);

  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      style={styles.screen}
    >
      <View style={[styles.layout, form.isCompact && styles.layoutCompact]}>
        {!form.isCompact ? (
          <View style={styles.routePanel}>
            <BrandMark inverted />
            <View style={styles.routeCopy}>
              <View style={styles.routeHeadingGroup}>
                <AuthText variant="route-title">Keep the route clear.</AuthText>
                <AuthText variant="route-description">
                  One quiet place for the work ahead, without the noise around it.
                </AuthText>
              </View>
              <View style={styles.routeSteps}>
                <RouteStep label="Capture what matters" index={0} />
                <RouteStep label="Follow the next clear step" index={1} />
                <RouteStep label="Close the loop" index={2} />
              </View>
            </View>
            <AuthText variant="route-footer">TodoDodo · Quiet route</AuthText>
          </View>
        ) : null}

        <View style={[styles.formPanel, form.isCompact && styles.formPanelCompact]}>
          <View style={styles.formContainer}>
            {form.isCompact ? <BrandMark /> : null}
            <View style={styles.formHeadingGroup}>
              <AuthText variant={form.isCompact ? "compact-title" : "form-title"}>
                {form.isSignUp ? "Create your account" : "Welcome back"}
              </AuthText>
              <AuthText variant="form-description">
                {form.isSignUp
                  ? "Start a calmer route through your day."
                  : "Sign in to continue to your tasks."}
              </AuthText>
            </View>

            <View style={styles.formFields}>
              {form.formError ? <AuthFormError message={form.formError} /> : null}
              <FormField
                autoCapitalize="none"
                autoComplete="email"
                error={form.fieldErrors.email}
                keyboardType="email-address"
                label="Email"
                onChangeText={form.setEmail}
                onSubmitEditing={() => form.passwordRef.current?.focus()}
                placeholder="you@example.com"
                returnKeyType="next"
                value={form.email}
              />
              <FormField
                autoCapitalize="none"
                autoComplete={form.isSignUp ? "new-password" : "current-password"}
                error={form.fieldErrors.password}
                inputRef={form.passwordRef}
                label="Password"
                onChangeText={form.setPassword}
                onSubmitEditing={() =>
                  form.isSignUp ? form.confirmationRef.current?.focus() : void form.submit()
                }
                placeholder={form.isSignUp ? "At least 8 characters" : "Your password"}
                returnKeyType={form.isSignUp ? "next" : "go"}
                secureTextEntry={!form.passwordVisible}
                trailingAction={{
                  label: form.passwordVisible ? "Hide password" : "Show password",
                  onPress: form.togglePasswordVisibility,
                  icon: form.passwordVisible ? EyeSlash : Eye,
                }}
                value={form.password}
              />
              {form.isSignUp ? (
                <FormField
                  autoCapitalize="none"
                  autoComplete="new-password"
                  error={form.fieldErrors.passwordConfirmation}
                  inputRef={form.confirmationRef}
                  label="Confirm password"
                  onChangeText={form.setPasswordConfirmation}
                  onSubmitEditing={() => void form.submit()}
                  placeholder="Repeat your password"
                  returnKeyType="go"
                  secureTextEntry={!form.passwordVisible}
                  value={form.passwordConfirmation}
                />
              ) : null}
              <AuthSubmitAction
                isSignUp={form.isSignUp}
                onPress={() => void form.submit()}
                submitting={form.submitting}
              />
            </View>
            <AuthSwitchLink isSignUp={form.isSignUp} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
