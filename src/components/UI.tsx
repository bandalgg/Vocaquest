import React, { PropsWithChildren } from "react";
import {
  Text,
  View,
  Pressable,
  TextInput,
  TextInputProps,
  ScrollView,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../store/useAppStore";
export const light = {
  bg: "#F5F6F2",
  card: "#FFFFFF",
  ink: "#183D38",
  muted: "#7A8A84",
  line: "#E1E8E0",
  accent: "#147D68",
  soft: "#E5F3DD",
  gold: "#E5B95B",
  red: "#B94A4A",
};
export const dark = {
  bg: "#101E1C",
  card: "#1B302B",
  ink: "#ECF5E9",
  muted: "#9FAFA6",
  line: "#324B42",
  accent: "#79CFAC",
  soft: "#294639",
  gold: "#E5B95B",
  red: "#FF9292",
};
export const useTheme = () =>
  useAppStore((s) => s.settings.dark) ? dark : light;
export type IconName = React.ComponentProps<typeof Ionicons>["name"];
export function Icon({
  name,
  size = 22,
  color,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const t = useTheme();
  return <Ionicons name={name} size={size} color={color ?? t.ink} />;
}
export function Txt({
  children,
  size = 15,
  bold = false,
  color,
  style,
}: {
  children: React.ReactNode;
  size?: number;
  bold?: boolean;
  color?: string;
  style?: any;
}) {
  const t = useTheme();
  return (
    <Text
      style={[
        {
          fontSize: size,
          fontWeight: bold ? "700" : "400",
          color: color ?? t.ink,
          lineHeight: size * 1.48,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Row({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[{ flexDirection: "row", alignItems: "center", gap: 12 }, style]}
    >
      {children}
    </View>
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.card,
          borderRadius: 24,
          padding: 20,
          borderWidth: 1,
          borderColor: t.line,
          gap: 12,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
  icon,
  style,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: IconName;
  style?: ViewStyle;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 52,
          borderRadius: 16,
          paddingHorizontal: 18,
          paddingVertical: 14,
          backgroundColor: secondary ? t.soft : t.accent,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        },
        style,
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          color={
            secondary
              ? t.ink
              : useAppStore.getState().settings.dark
                ? "#10291F"
                : "#FFFFFF"
          }
        />
      )}
      <Txt
        bold
        color={
          secondary
            ? t.ink
            : useAppStore.getState().settings.dark
              ? "#10291F"
              : "#FFFFFF"
        }
      >
        {title}
      </Txt>
    </Pressable>
  );
}
export function Chip({
  title,
  selected,
  onPress,
}: {
  title: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={{
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: selected ? t.accent : t.card,
        borderWidth: 1,
        borderColor: selected ? t.accent : t.line,
      }}
    >
      <Txt
        size={13}
        bold
        color={
          selected
            ? useAppStore.getState().settings.dark
              ? "#10291F"
              : "#fff"
            : t.ink
        }
      >
        {title}
      </Txt>
    </Pressable>
  );
}
export function Field({
  label,
  ...props
}: TextInputProps & { label?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 7 }}>
      {label && (
        <Txt size={13} bold>
          {label}
        </Txt>
      )}
      <TextInput
        placeholderTextColor={t.muted}
        accessibilityLabel={props.accessibilityLabel ?? label}
        {...props}
        style={[
          {
            fontSize: 17,
            color: t.ink,
            backgroundColor: t.card,
            borderColor: t.line,
            borderWidth: 1,
            borderRadius: 15,
            padding: 16,
            minHeight: 54,
          },
          props.style,
        ]}
      />
    </View>
  );
}
export function Progress({ value, color }: { value: number; color?: string }) {
  const t = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(Math.max(0, Math.min(1, value)) * 100),
      }}
      style={{
        height: 8,
        backgroundColor: t.line,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: 8,
          width: `${Math.min(100, Math.max(0, value * 100))}%`,
          backgroundColor: color ?? t.accent,
          borderRadius: 8,
        }}
      />
    </View>
  );
}
export function Page({
  children,
  title,
  subtitle,
  right,
  scroll = true,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  scroll?: boolean;
}) {
  const t = useTheme();
  const content = (
    <View
      style={{
        width: "100%",
        maxWidth: 650,
        alignSelf: "center",
        padding: 22,
        gap: 20,
        paddingBottom: 36,
      }}
    >
      {(title || right) && (
        <Row style={{ justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            {subtitle && (
              <Txt
                size={12}
                color={t.muted}
                bold
                style={{ letterSpacing: 2, marginBottom: 5 }}
              >
                {subtitle}
              </Txt>
            )}
            {title && (
              <Txt size={29} bold>
                {title}
              </Txt>
            )}
          </View>
          {right}
        </Row>
      )}
      {children}
    </View>
  );
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </KeyboardAvoidingView>
  );
}
export function Back({
  onPress,
  label = "돌아가기",
}: {
  onPress: () => void;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{ padding: 10, alignSelf: "flex-start" }}
    >
      <Row>
        <Icon name="arrow-back" />
        <Txt bold>{label}</Txt>
      </Row>
    </Pressable>
  );
}
export const wrap = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
} as ViewStyle;
export function Empty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <Icon name="leaf-outline" size={32} />
      <Txt size={19} bold>
        {title}
      </Txt>
      <Txt>{description}</Txt>
    </Card>
  );
}
