import React from "react";
import TabNavigator from "./src/navigation/TabNavigator";
import { CharacterProvider } from "./src/context/CharacterContext";
import { ThemeProvider } from "./src/context/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <CharacterProvider>
        <TabNavigator />
      </CharacterProvider>
    </ThemeProvider>
  );
}
