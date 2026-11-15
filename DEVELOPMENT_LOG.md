# Development recovery log

Branch: feature/mobile-expo-refresh
User request: adapt the UniTask web repository to Expo mobile, retain JavaScript/JSX, fix existing issues, make logical commits and push regularly, run localhost web preview, document with real screenshots.

## Completed
- Inspected clean main branch and existing Expo SDK 58 / React Native 0.88 dependencies.
- Read SDK 58 documentation and Expo documentation index.
- Created feature/mobile-expo-refresh; downloading web source into ignored .reference/UniTask.

## Next
1. Inspect web source and remaining mobile screens.
2. Fix route location, JSX validation, storage/startup and UI issues.
3. Run lint, typecheck, browser workflow checks and capture screenshots.
4. Update README, commit logical changes, push feature branch, leave Expo web running.

## Recovery
Read this file, git status, git log, then inspect any running Expo process before restarting. Never commit credentials, node_modules, or reference checkout. Update this file at each milestone.

## Implementation checkpoint
- Moved routes and supporting code into src; enabled checking JavaScript/JSX.
- Refreshed campus home and task cards; lint tool installation in progress.
- Initial recovery commit pushed successfully (32aab3d).
