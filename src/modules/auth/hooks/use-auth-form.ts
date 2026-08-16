import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { TextInput, useWindowDimensions } from "react-native";
import { useMutative } from "use-mutative";

import { getErrorMessage, useAuth } from "@/platform";

type FieldErrors = Partial<Record<"email" | "password" | "passwordConfirmation", string>>;

export function useAuthForm(variant: "sign-in" | "sign-up") {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { status, signIn, signUp } = useAuth();
  const passwordRef = useRef<TextInput>(null);
  const confirmationRef = useRef<TextInput>(null);
  const [email, setEmailValue] = useState("");
  const [password, setPasswordValue] = useState("");
  const [passwordConfirmation, setPasswordConfirmationValue] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useMutative<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const isSignUp = variant === "sign-up";

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/inbox");
    }
  }, [router, status]);

  function setField<K extends keyof FieldErrors>(
    field: K,
    setter: (value: string) => void,
    value: string,
  ) {
    setter(value);

    if (fieldErrors[field]) {
      setFieldErrors((draft) => {
        delete draft[field];
      });
    }
  }

  function validate() {
    const nextErrors: FieldErrors = {};

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
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

  async function submit() {
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

  return {
    isCompact: width < 760,
    isSignUp,
    email,
    password,
    passwordConfirmation,
    passwordVisible,
    submitting,
    fieldErrors,
    formError,
    passwordRef,
    confirmationRef,
    setEmail: (value: string) => setField("email", setEmailValue, value),
    setPassword: (value: string) => setField("password", setPasswordValue, value),
    setPasswordConfirmation: (value: string) =>
      setField("passwordConfirmation", setPasswordConfirmationValue, value),
    togglePasswordVisibility: () => setPasswordVisible((current) => !current),
    submit,
  };
}
