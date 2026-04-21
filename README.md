# SkillUp

> A location-based mobile marketplace connecting service seekers with skilled professionals across South Africa.

**[View Landing Page →](https://wmhlanga-code.github.io/Skill-Up-App/)**

---

## Overview

SkillUp bridges the gap between people who need everyday services — plumbing, haircuts, tutoring, car repairs — and the skilled professionals who provide them. Open the app, see providers near you on a map, check their ratings and pricing, and book instantly.

## Features

| Seekers | Providers |
|---|---|
| Browse nearby providers on a live map | Toggle availability on/off |
| Filter by category, distance & rating | Manage incoming booking requests |
| In-app messaging + WhatsApp shortcut | Edit services and pricing |
| Save favourites | View dashboard stats (views, jobs, rating) |
| Leave reviews after completed jobs | AI assistant for pricing guidance & bio writing |
| AI assistant for finding the right help | Real-time notifications |

## Tech Stack

- **Framework:** React Native + Expo (iOS, Android, Web)
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based)
- **Styling:** NativeWind (Tailwind CSS for RN)
- **State:** Zustand
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **AI:** Groq API (context-aware assistant)
- **Maps:** React Native Maps + Expo Location
- **Forms:** React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js ≥ 18
- Expo CLI (`npm install -g expo-cli`)
- A Supabase project
- A Groq API key

### Installation

```bash
git clone https://github.com/wmhlanga-code/Skill-Up-App.git
cd Skill-Up-App/skillup
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your keys:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### Run

```bash
npx expo start
```

Press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

### Database

Apply migrations in order from `supabase/migrations/`:

```bash
supabase db push
```

## Project Structure

```
skillup/
├── app/               # Expo Router screens
│   ├── (auth)/        # Login, signup, role selection
│   ├── (tabs)/        # Seeker tabs (home, map, bookings, chat, profile)
│   ├── (provider)/    # Provider tabs (dashboard, profile, messages)
│   └── provider/[id]  # Provider detail page
├── components/        # Reusable UI components
├── hooks/             # Custom React hooks
├── store/             # Zustand state slices
├── lib/               # Supabase client, location, WhatsApp utils
├── constants/         # Design tokens, categories
├── types/             # TypeScript type definitions
└── supabase/          # Database migrations
```

## Service Categories

Trades · Beauty · Automotive · Cleaning · Tech · Garden · Education · Other

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

## License

MIT
