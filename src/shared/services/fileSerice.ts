import * as DocumentPicker from 'expo-document-picker';
import type { CharacterEntity } from '@/domain/types';
import { MonsterDto } from '@/types/Monster';
import useCharacterStore from '@/context/Character-store';
import { characterMapper } from '@/domain/mappers';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

class FileService {
  static async importCharacterFromFile(): Promise<CharacterEntity | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        // copy the selected file to app cache so we can read it reliably on
        // both development and release builds
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return null;

      const uri = result.assets[0].uri;
      // Use FileSystem API to read the file instead of fetch which fails for
      // content URIs on Android release builds
      let jsonString: string;
      if (typeof FileSystem.readAsStringAsync === 'function') {
        jsonString = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      } else {
        const response = await fetch(uri);
        jsonString = await response.text();
      }
      const jsonData = JSON.parse(jsonString);

      if (!jsonData.id) jsonData.id = Date.now().toString();

      return characterMapper.draftToEntity(jsonData);
    } catch (error) {
      console.error('Error importing character:', error);
      return null;
    }
  }

  static async importMonsterFromFile(): Promise<MonsterDto | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return null;

      const uri = result.assets[0].uri;
      let jsonString: string;
      if (typeof FileSystem.readAsStringAsync === 'function') {
        jsonString = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      } else {
        const response = await fetch(uri);
        jsonString = await response.text();
      }
      const jsonData = JSON.parse(jsonString);

      if (!jsonData.id) jsonData.id = Date.now().toString();

      return jsonData;
    } catch (error) {
      console.error('Error importing monster:', error);
      return null;
    }
  }

  static async importMonsterBookFromFile(): Promise<MonsterDto[] | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return null;

      const uri = result.assets[0].uri;
      let jsonString: string;
      if (typeof FileSystem.readAsStringAsync === 'function') {
        jsonString = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      } else {
        const response = await fetch(uri);
        jsonString = await response.text();
      }
      const jsonData = JSON.parse(jsonString);

      let monsters: MonsterDto[] | null = null;

      if (Array.isArray(jsonData)) {
        monsters = jsonData as MonsterDto[];
      } else if (Array.isArray(jsonData.monsters)) {
        monsters = jsonData.monsters as MonsterDto[];
      } else if (jsonData.name) {
        monsters = [jsonData as MonsterDto];
      }

      if (!monsters) return null;

      return monsters.map((m) => ({ ...m, id: m.id || Date.now().toString() }));
    } catch (error) {
      console.error('Error importing monster book:', error);
      return null;
    }
  }

  static async importCurrentCharacter(id: string): Promise<CharacterEntity | null> {
    try {
      const character = await this.importCharacterFromFile();
      if (!character) return null;

      const { characters, saveCharacters } = useCharacterStore.getState();
      const index = characters.findIndex((c) => c.id === id);
      if (index === -1) return null;

      const updatedCharacters = [...characters];
      updatedCharacters[index] = characterMapper.draftToEntity(character);
      await saveCharacters(updatedCharacters);
      return character;
    } catch {
      return null;
    }
  }

  static async exportCharacter(character: CharacterEntity) {
    try {
      const jsonString = JSON.stringify(character, null, 2);
      if (typeof window !== 'undefined' && window.document) {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${character.name.replace(/\s+/g, '_') || 'character'}.json`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
      const fileName = `${character.name.replace(/\s+/g, '_') || 'character'}.json`;
      const cacheDirectory = FileSystem.cacheDirectory || FileSystem.documentDirectory;
      if (!cacheDirectory) throw new Error('No writable directory available');
      const fileUri = `${cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, jsonString, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error('Error exporting character:', error);
    }
  }

  static async exportMonster(monster: MonsterDto) {
    try {
      const jsonString = JSON.stringify(monster, null, 2);
      if (typeof window !== 'undefined' && window.document) {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${monster.name.replace(/\s+/g, '_') || 'monster'}.json`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
      const fileName = `${monster.name.replace(/\s+/g, '_') || 'monster'}.json`;
      const cacheDirectory = FileSystem.cacheDirectory || FileSystem.documentDirectory;
      if (!cacheDirectory) throw new Error('No writable directory available');
      const fileUri = `${cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error('Error exporting monster:', error);
    }
  }
}

export default FileService;


