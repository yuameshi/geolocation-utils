# Geolocation Utils

## About Prebuilt Packages

Get prebuilt packages for Android on [Github Actions](https://github.com/yuameshi/geolocation-utils/actions), iOS packages are not available.

## Platform Specific Features

- **Satellites Details**: Due to strict privacy policies on iOS, detailed satellite information is not accessible. This feature is only available on Android devices.
- **Location Sharing by Bluetooth**: This feature allows users to share their GNSS location data via Bluetooth. It is currently only supported on Android 12 or higher.

## Building the Project

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

1. Clone the repository
2. Run `npm install` to install dependencies

- Android
    1.  Run `cd android && ./gradlew clean` to clean the Android build (if applicable)
    2.  Run `./gradlew assembleRelease` to build the release APK (Android)
    3.  or Run `./gradlew bundleRelease` to build the release AAB (Android App Bundle)
    4.  The generated APK or AAB will be located in following path:
    - APK: `android/app/build/outputs/apk/release/`
    - AAB: `android/app/build/outputs/bundle/release/`
- Build instructions for iOS is not available yet, but you can open the project in Xcode and follow the standard iOS build process.

## Starting Development

1. Clone the repository
2. Run `npm install` to install dependencies
3. Connect your Android device or start an emulator, or iOS device/simulator
4. Run `npm run android` or `npm run ios` to start the app
