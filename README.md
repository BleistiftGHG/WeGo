# WeGo

Carpooling app for school classes. Students and teachers share rides, matched by route and class code.

> School project, work in progress.

## Features

- Class-code onboarding
- Map view with live location
- Ride matching with nearby drivers (mock data for now)
- Burger menu with swipe gestures
- Profile and settings: theme (dark / light / system), language (English / Deutsch), notifications, units, haptics
- i18n with automatic device language detection

## Tech stack

- [Expo](https://expo.dev) (SDK 58) with Expo Router
- React Native, TypeScript
- `react-native-maps`, `expo-location`
- `i18next`, `react-i18next`, `expo-localization`
- `react-native-gesture-handler`
- `@react-native-async-storage/async-storage`

## Getting started

```bash
git clone https://github.com/BleistiftGHG/WeGo.git
cd WeGo
npm install
npx expo start -c
```

Open the app in Expo Go or a development build.

For Android maps, a Google Maps API key is required. Put it in a local `.env` file (not committed).

## Project structure

```
src/
├── app/            Routes (Expo Router)
│   ├── (tabs)/     Map, Rides, Messages
│   ├── index.tsx   Onboarding
│   ├── matching.tsx
│   └── profile.tsx
├── components/     Reusable UI
├── constants/      Theme, map style, mock drivers
├── context/        Settings and theme provider
├── hooks/          useUserLocation
├── i18n/           Translations (en, de)
└── lib/            Storage helpers
```

## Roadmap

- [ ] Backend and auth (replace hardcoded class codes)
- [ ] Offer a ride (start, destination, time, seats)
- [ ] Search and book rides
- [ ] Rides tab: own rides, requests, history
- [ ] Messages between driver and passenger
- [ ] Editable profile (name, photo, vehicle)
- [ ] Push notifications
- [ ] Privacy and safety (GDPR, report/block)

## License

MIT, see [LICENSE](LICENSE).