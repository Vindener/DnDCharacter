import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CharacterContext = createContext();

export const CharacterProvider = ({ children }) => {
  const [characters, setCharacters] = useState([]);
  const MAX_CHARACTERS = 15;

  useEffect(() => {
    setCharacters([]);
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('characters');
      if (jsonValue != null) {
        const parsed = JSON.parse(jsonValue);
        const filtered = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        setCharacters(filtered);
      }
    } catch (e) {
      console.error('Failed to load characters:', e);
    }
  };

  const saveCharacters = async (newCharacters) => {
    try {
      await AsyncStorage.setItem('characters', JSON.stringify(newCharacters));
    } catch (e) {
      console.error('Failed to save characters:', e);
    }
  };

  const addCharacter = (character) => {
    if (characters.length >= MAX_CHARACTERS) return;
    const updated = [...characters, character];
    setCharacters(updated);
    saveCharacters(updated);
  };

  const updateCharacter = (index, updatedCharacter) => {
    const updated = characters.map((char, i) => (i === index ? updatedCharacter : char));
    setCharacters(updated);
    saveCharacters(updated);
  };

  const removeCharacter = (index) => {
    const updated = characters.filter((_, i) => i !== index);
    setCharacters(updated);
    saveCharacters(updated);
  };

  return (
    <CharacterContext.Provider
      value={{
        characters,
        addCharacter,
        updateCharacter,
        removeCharacter,
        maxCharacters: MAX_CHARACTERS,
      }}
    >
      {children}
    </CharacterContext.Provider>
  );
};

export const useCharacters = () => useContext(CharacterContext);
