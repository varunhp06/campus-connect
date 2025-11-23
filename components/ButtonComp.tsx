import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  ImageSourcePropType,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from "react-native";
import HapticPressable from "./HapticPressable";
import { Router } from "expo-router";

interface Utility {
  id: string;
  route?: string;
  color: string;
  icon?: ImageSourcePropType;
  title: string;
  description: string;
  status?: string;
  params?: any; // Add this line
}

interface Theme {
  inputBackground: string;
  inputBorder: string;
  placeholder: string;
}

interface ButtonProps {
  utility: Utility;
  theme: Theme;
  router: Router;
}

function ButtonComp({ utility, theme, router }: ButtonProps) {
  const handlePress = () => {
    if (!utility.route) {
      alert("Coming soon 🚧");
      return;
    }

    if (utility.params) {
      router.push({
        pathname: utility.route,
        params: utility.params
      });
    } else {
      router.push(utility.route);
    }
  };

  return (
    <HapticPressable
      disabled={
        utility.status ? utility.status.toLowerCase() === "offline" : false
      }
      style={({ pressed }) => [
        styles.utilityCard,
        {
          backgroundColor: theme.inputBackground,
          borderColor: theme.inputBorder,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      onPress={handlePress}
    >
      <View
        style={[styles.utilityBorder, { backgroundColor: utility.color }]}
      />
      {utility.icon && (
        <Image
          source={utility.icon}
          style={styles.utilityImage}
          resizeMode="contain"
        />
      )}
      <View style={[styles.utilityContent, { marginLeft: utility.icon ? 0 : 12, marginRight: utility.icon ? 0 : 12 }]}>
        <Text style={[styles.utilityTitle, { color: utility.color }]}>
          {utility.title}
        </Text>
        <Text style={[styles.utilityDescription, { color: theme.placeholder }]}>
          {utility.description}
        </Text>
      </View>
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  utilityCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    position: "relative",
    overflow: "hidden",
    minHeight: 80,
    minWidth: "100%",
  } as ViewStyle,
  utilityBorder: {
    position: "absolute",
    left: 8,
    top: 8,
    bottom: 8,
    width: 6,
    borderRadius: 8,
    margin: 2,
  } as ViewStyle,

  utilityImage: {
    width: 48,
    height: 48,
    marginLeft: 8,
    marginRight: 16,
  } as ImageStyle,
  utilityContent: {
    flex: 1,
  } as ViewStyle,
  utilityTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  } as TextStyle,
  utilityDescription: {
    fontSize: 10,
    lineHeight: 18,
  } as TextStyle,
});

export default ButtonComp;