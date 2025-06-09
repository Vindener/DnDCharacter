import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

type CharacterData = {
  id?: string;
  name: string;
  [key: string]: any;
};

export const importCharacterFromFile = async (): Promise<CharacterData | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: false,
      multiple: false,
    });

    if (result.canceled || !result.assets?.length) {
      return null;
    }

    const base64uri = result.assets[0].uri;
    const base64Data = base64uri.split(',')[1];
    const binary = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const decodedString = new TextDecoder('utf-8').decode(binary);
    const jsonData = JSON.parse(decodedString);

    if (!jsonData.id) jsonData.id = Date.now().toString();

    return jsonData;
  } catch (e: any) {
    return null;
  }
};
