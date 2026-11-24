# WeGo

WeGo is a school carpooling app for students and teachers. Members of a school can offer rides, request seats, and coordinate in a ride group chat.

> School project in active development. The app currently uses Supabase for shared data and anonymous sign-in; production readiness, privacy, and safety features are still in progress.

## Current features

- Join a school community with a class/school code and choose an editable display name
- Browse upcoming rides on a map, with nearby matching, driver names, distance, and meeting-point details
- Offer a ride with origin, destination, departure time, available seats, and an optional note
- Request a seat, cancel a request, and accept or decline requests as the driver
- View rides offered and rides joined in the Rides tab
- Group chat for rides with accepted requests, including live message updates
- Push-notification token registration for ride requests, confirmations, and chat messages
- Map controls for centering on the user's location, 3D tilt, north/compass, and satellite view
- Profile settings for theme, language, notifications, distance units, and haptics
- English and German translations, with device-language detection

Nearby place and school search uses OpenStreetMap services. Ride, profile, request, and chat data use Supabase. Push delivery also requires the corresponding Supabase functions and server-side configuration.

## Tech stack

- Expo SDK 58, Expo Router, React Native, and TypeScript
- Supabase (`@supabase/supabase-js`) for authentication, database access, RPCs, and Realtime
- `react-native-maps` and `expo-location`
- `i18next`, `react-i18next`, and `expo-localization`
- React Native Gesture Handler and Reanimated
- AsyncStorage for local settings and persisted Supabase sessions

## Getting started

### Prerequisites

- Node.js and npm
- A Supabase project configured with the tables, Row Level Security policies, and database functions used by the app
- For Android map tiles, a Google Maps API key configured for the native app/build

### Install and configure

```bash
git clone https://github.com/BleistiftGHG/WeGo.git
cd WeGo
npm install
```

Create a local `.env` file in the project root:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Use the public/anonymous key intended for client apps. Do not put a Supabase service-role key in the app or commit secrets.

The client expects Supabase support for anonymous authentication and calls RPCs including `join_class`, `my_school_id`, `set_display_name`, `visible_names`, `request_ride`, `respond_to_request`, `cancel_request`, `register_push_token`, and `set_push_enabled`. It also reads and writes the `schools`, `profiles`, `rides`, `ride_requests`, `messages`, and push-token data. The database schema, policies, and function definitions are not included in this repository, so the app cannot be fully configured from this checkout alone.

Start Expo:

```bash
npx expo start -c
```

Open the project in Expo Go or a development build. Native map configuration and push-notification behavior may require a development build and platform credentials. Push notifications can only be fully exercised on a supported physical device with permissions granted and the backend delivery path configured.

## Project structure

```
src/
├── app/                 Expo Router screens
│   ├── (tabs)/          Map, Rides, Messages
│   ├── chat/[id].tsx    Ride group chat
│   ├── index.tsx        Onboarding
│   ├── matching.tsx     Nearby ride search
│   ├── offer.tsx        Offer a ride
│   ├── profile.tsx      Profile and settings
│   └── schools.tsx      School selection
├── components/          Reusable UI and map components
├── constants/           Theme and map styling
├── context/             Settings and theme provider
├── hooks/               Location and push-notification hooks
├── i18n/                English and German translations
└── lib/                 Supabase helpers, chat, requests, places, storage
```

## Roadmap

- Add versioned Supabase migrations and document database setup
- Improve error, loading, and offline states across backend-driven screens
- Clarify account reset and anonymous-session lifecycle
- Add ride history and stronger privacy and safety features (including reporting and blocking)
- Expand automated checks for ride requests, authorization, chat, and push notifications
- Consider profile photos and vehicle details

## License

MIT. See [LICENSE](LICENSE).
