import { useRouter } from "expo-router";
import { ScrollView } from "react-native";

import { PlaceholderCard } from "@/modules/placeholder-screen/components/placeholder-card/placeholder-card";
import { styles } from "@/modules/placeholder-screen/styles";

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
      contentContainerStyle={styles.content}
      style={styles.screen}
    >
      <PlaceholderCard
        description={description}
        onBack={() => router.replace("/inbox")}
        title={title}
      />
    </ScrollView>
  );
}
