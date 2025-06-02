import { View, Button, StyleSheet, Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { shareAsync } from "expo-sharing";

const Test = () => {
  const downloadFromURL = async () => {
    const filename = "small.mp4";
    const result = await FileSystem.downloadAsync(
      "http://techslides.com/demos/sample-videos/small.mp4",
      FileSystem.documentDirectory + filename
    );
    console.log(result);

    save(result.uri, filename, result.headers["Content-Type"]);
  };

  const downloadFromAPI = async () => {
    const filename = "miss.pdf";
    const localhost = Platform.OS === "android" ? "10.0.2.2" : "127.0.0.1";
  };

  const save = async (uri, filename, mimetype) => {
    if (Platform.OS === "android") {
      const permissions =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          filename,
          mimetype
        )
          .then(async (uri) => {
            await FileSystem.writeAsStringAsync(uri, base64, {
              encoding: FileSystem.EncodingType.Base64,
            });
          })
          .catch((e) => console.log(e));
      } else {
        shareAsync(uri);
      }
    } else {
      shareAsync(uri);
    }
  };
  return (
    <View style={styles.container}>
      <Button title="Download form URL" onPress={downloadFromURL} />
      <Button title="Download form API" onPress={downloadFromAPI} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 20, marginBottom: 20 },
  diceButton: {
    backgroundColor: "#6200EE",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  diceText: { color: "white", fontSize: 18 },
  result: { fontSize: 24, marginTop: 20, fontWeight: "bold" },
});

export default Test;
