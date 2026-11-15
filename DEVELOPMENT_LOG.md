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

- Inspected web API contracts: auth, owner CRUD, hiring, ratings and notifications. Adding optional online mode using EXPO_PUBLIC_API_URL; session token is memory-only. Offline SQLite demo retained.

- Online screens implemented: auth, owner CRUD, hire, reviews, notification polling/read actions. Live API not configured; online verification remains required.
- Browser tooling installation and Expo web startup in progress. Search uses debounce and FlatList.

- Fixed lint findings and one-time seeding. JSX typecheck passed before latest fixes; rerun final checks.
- Commits pushed: 32aab3d, bda05c4, 2d10ae2. Expo startup session 17658 on port 8081; browser download session 55717.

## Validation checkpoint
- npx tsc --noEmit passed; npx expo install --check reports dependencies up to date.
- Browser workflow initially failed with ERR_CONNECTION_REFUSED: Expo startup stalled before listening. Debug restart session 90430; investigate before declaring done.
- README and Playwright workflow written; screenshots not captured yet. Installed Edge is available for browser testing.
- Next: resolve Expo startup, run browser test, inspect screenshots, run final lint/typecheck, update this log and README validation results, commit/push.

- Final expo lint and tsc checks passed (session 46147 exit 0). Browser is installed; first workflow failure was unavailable server, not a UI assertion. Reference checkout excluded from Metro crawl.

- Expo Doctor: 20/20 checks passed. API transport contract test passed (mock fetch; not live backend).
- Windows Metro watcher stalls after crawl; testing CI=1 EXPO_OFFLINE=1 startup, max-workers 2, session 59472. Next poll this session, then run npx playwright test.
