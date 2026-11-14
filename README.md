# UniTask

Offline campus task marketplace built with Expo Router + SQLite (no backend).
Features: 5 tabs, seeded sample data, search/category filter, create / edit / delete
your own tasks, status changes, favorites.

## Run
Requires Node 20+ and the **Expo Go** app (or an Android emulator / iOS simulator).

```
npm install
npx expo install --fix     # aligns package versions with the installed Expo SDK
npx expo-doctor            # optional sanity check
npx expo start --clear
```
Scan the QR code with Expo Go (Android) or the Camera app (iOS), or press `a` / `i`
for an emulator/simulator. Phone can't connect? Use `npx expo start --tunnel`.

Use a phone or emulator. Web (`w`) is not recommended: expo-sqlite on web is experimental.

## Reset data
Clear the app's storage / reinstall Expo Go app data to re-seed the sample tasks.
