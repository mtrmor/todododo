import { ArrowLeft, ClockCountdown } from "phosphor-react-native";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { colors, fonts, shadows } from "@/platform";

export type PlaceholderScreenProps = {
  title: string;
  description?: string;
};

export function PlaceholderScreen({
  title,
  description = "This area is planned for a later release.",
}: PlaceholderScreenProps) {
  const router = useRouter();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 48,
      }}
      style={{ flex: 1, backgroundColor: colors.paper }}
    >
      <View
        accessibilityRole="summary"
        style={{
          width: "100%",
          maxWidth: 460,
          alignItems: "center",
          gap: 16,
          paddingHorizontal: 28,
          paddingVertical: 36,
          borderWidth: 1,
          borderColor: colors.softLine,
          borderRadius: 20,
          borderCurve: "continuous",
          backgroundColor: colors.paper,
          boxShadow: shadows.subtle,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 18,
            borderCurve: "continuous",
            backgroundColor: colors.lavenderSelection,
          }}
        >
          <ClockCountdown
            aria-hidden
            color={colors.routeViolet}
            size={26}
            weight="duotone"
          />
        </View>

        <View style={{ alignItems: "center", gap: 7 }}>
          <Text
            selectable
            style={{
              color: colors.ink,
              fontFamily: fonts.heading,
              fontSize: 24,
              fontWeight: "700",
              letterSpacing: -0.5,
              textAlign: "center",
            }}
          >
            {title}
          </Text>
          <Text
            selectable
            style={{
              maxWidth: 330,
              color: colors.mutedInk,
              fontFamily: fonts.body,
              fontSize: 15,
              lineHeight: 22,
              textAlign: "center",
            }}
          >
            {description}
          </Text>
        </View>

        <Pressable
          accessibilityHint="Returns to your inbox"
          accessibilityLabel="Back to Inbox"
          accessibilityRole="button"
          onPress={() => router.replace("/inbox")}
          style={({ pressed }) => ({
            minHeight: 44,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingHorizontal: 18,
            borderRadius: 12,
            borderCurve: "continuous",
            backgroundColor: pressed
              ? colors.routeVioletPressed
              : colors.routeViolet,
            cursor: "pointer",
            outlineColor: colors.focusRing,
            outlineOffset: 2,
          })}
        >
          <ArrowLeft aria-hidden color={colors.paper} size={17} weight="bold" />
          <Text
            style={{
              color: colors.paper,
              fontFamily: fonts.body,
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            Back to Inbox
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
