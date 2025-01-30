import React, { useState } from 'react';
import { Button, View, Text, PermissionsAndroid, Alert, Platform } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFetchBlob from 'react-native-blob-util';
import { mkdir } from 'react-native-fs'; // Import mkdir from react-native-fs

const App = () => {
  const [recording, setRecording] = useState(false);
  const audioRecorderPlayer = new AudioRecorderPlayer();

  const requestMicrophonePermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Access',
          message: 'This app needs access to your microphone to record audio.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'Allow',
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        startRecording();
      } else {
        Alert.alert('Microphone access denied.');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const startRecording = async () => {
    try {
      // Define the directory and file path
      const audioDir = Platform.OS === 'android'
        ? RNFetchBlob.fs.dirs.DownloadDir + '/VoiceRecorder'
        : RNFetchBlob.fs.dirs.DocumentDir + '/VoiceRecorder';

      const audioPath = audioDir + '/recorded_audio.mp4';

      // Ensure the directory exists
      await mkdir(audioDir, { recursive: true });

      setRecording(true);

      // Start recording
      await audioRecorderPlayer.startRecorder(audioPath);
      audioRecorderPlayer.addRecordBackListener((e) => {
        console.log('Recording:', e.currentPosition);
      });

      // Stop recording after 10 seconds
      setTimeout(() => {
        stopRecording(audioPath);
      }, 10000);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Failed to start recording.');
    }
  };

  const stopRecording = async (audioPath) => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setRecording(false);
      console.log('Recording stopped. File saved at:', audioPath);
      uploadAudio(audioPath);
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Failed to stop recording.');
    }
  };

  const uploadAudio = async (audioPath) => {
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: audioPath,
        type: 'audio/mp4',
        name: 'recorded_audio.mp4',
      });

      const response = await RNFetchBlob.fetch(
        'POST',
        'http://192.168.100.100:3000/upload',
        {
          'Content-Type': 'multipart/form-data',
        },
        [
          {
            name: 'audio',
            filename: 'recorded_audio.mp4',
            data: RNFetchBlob.wrap(audioPath),
          },
        ]
      );

      if (response.info().status === 200) {
        Alert.alert('Recording uploaded successfully.');
      } else {
        Alert.alert('Failed to upload recording.');
      }
    } catch (error) {
      console.error('Error uploading recording:', error);
      Alert.alert('Failed to upload recording.');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button
        title="Start Recording"
        onPress={requestMicrophonePermission}
        disabled={recording}
      />
      {recording && <Text>Recording in progress...</Text>}
    </View>
  );
};

export default App;