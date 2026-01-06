import React from "react";
import { StyleSheet, View } from "react-native";
import HomeScreen from "./home";

const App = () => {
  return (
    <View style={styles.container}>
      <HomeScreen />
    </View>
  );
};

// Basic styling for the container
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#020817",
  },
});

export default App;
