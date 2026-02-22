# Stokie - CLAUDE.md

## What Is Stokie

Stokie is a social party game app for friend groups. Groups ("Circles") get daily prompts throughout the week, members earn points by answering, and at the end of the week everyone gathers for a "Fireside" review session to see responses, vote, and crown a weekly winner. The winner picks next week's prompt.

- **Bundle ID**: `com.swirth4.gagul`
- **Display Name**: Stokie
- **Internal slug**: vibecheck
- **GitHub**: `Hail2theheat/gagul`
- **App Store ID**: 6758123304
- **EAS Project ID**: `c9e33c6a-11cb-4308-85a5-6a30830de4e6`
- **Supabase Project**: `jssuzpodzgwfrpzmtpva`
- **Apple ID**: wirthlin08@hotmail.com

## Target Audience

Friend groups who want low-commitment daily engagement, casual social gamers, people who enjoy Jackbox-style party games.

## Design Philosophy

- **Retro pixel aesthetic** inspired by 8-bit/16-bit games
- **Cozy campfire/forest/night sky** theme throughout
- Warm color palette: dark navy bg (#0B1026), cream text (#FFF8DC), fire accents
- Pixel art rendered as code (Views, not image assets) for performance
- Fonts: Paaxel (pixel headings), Bitova (body), Nunito (fallback)
- Spring-physics animations, haptic feedback, optimistic updates
- Playful competition without being toxic

## Tech Stack

- **React Native 0.81.5** via **Expo SDK 54**, **Expo Router** (file-based routing)
- **TypeScript** throughout
- **Supabase** (PostgreSQL, Auth, Storage, Edge Functions, Realtime)
- **TanStack React Query** for server state/caching
- **react-native-reanimated** + **react-native-gesture-handler** for animations
- **expo-camera**, **expo-image-picker**, **expo-av** for media
- **Expo Push Notifications** via `exp.host` API
- **EAS Build** + **EAS Update** (OTA) for deployment

## Architecture Patterns

- **Service layer**: All Supabase calls in `lib/services/*`
- **Hooks layer**: `lib/hooks/*` wraps services with React Query
- **RPC-first**: Complex logic lives in PostgreSQL functions (single round trips)
- **Database triggers** for automatic point calculation
- **Signed URLs** for private media (1-hour expiry)
- **Week-based grouping**: All prompts tagged with `week_of` (Monday date)

## Features Built

### Core
- Email/password auth via Supabase
- Profile with username + customizable pixel art character avatar (skin, hair, shirt, pants, shoes, accessories, poses)
- Custom emoji reactions (6 customizable slots)
- Create/join groups via 6-char invite codes
- Group member list with pixel avatars
- Group streak tracking + fire streak badges

### Prompt System (6 types)
- **Short Text** (1-50 words), **Long Text** (40-200 words)
- **Photo** (camera or gallery upload)
- **Multiple Choice**, **Quiz** (with correct answer)
- **Quiplash** (head-to-head comedy battles, voting)
- Special variants: "Most Likely To...", "Majority Guess"
- Automated daily scheduling with category rotation: text -> text_silly -> multiple_choice -> photo -> quiplash -> text
- 24-hour expiration, prompt rating (thumbs up/down)

### Quiplash
- Auto 2-person matchups per group
- Both answer same prompt, others vote on funniest
- Winners get bonus points
- Swipe or tap voting UI

### Points & Leaderboard
- 10 pts answering, 5 pts voting, 20 pts quiplash win
- Weekly leaderboard per group
- Total points across all groups in profile

### Fireside (End-of-Week Review)
- Chronological presentation of all week's prompts/responses
- MC results with percentages, quiz correct answers, quiplash vote counts
- Photo gallery display
- Real-time commenting (Supabase Realtime)
- Reaction bar with custom emojis
- Leaderboard reveal + winner announcement
- Winner prompt selection (pick from 3 or create custom)

### Push Notifications
- Edge function `send-notifications`: fires when new prompts go live
- Edge function `send-reminders`: fires 5h after prompt (configurable), supports custom title/body/force_all
- Invalid token cleanup (DeviceNotRegistered)
- Expo push batching (100 per request)

### UI/UX
- Animated splash with mountain lake scene
- Pixel art: campfire, pine trees, lake with fish + Loch Ness monster, night sky with moon/stars/shooting stars/fireflies, mountains, wildflowers
- Tree stumps as buttons
- Countdown timers, word counters, pull-to-refresh
- Offline banner (ping-based detection)
- Error boundaries + crash logging to Supabase

## Features Planned / Not Yet Built

1. **Telephone Game** - Components built (DrawingCanvas, VoiceRecorder, VideoRecorder, TelephoneCard) but not integrated into main flow. Chain-based: draw -> describe -> draw -> describe. Needs auto-setup, chain viewing in Fireside.
2. **Explore Tab** - Tab exists but is a placeholder. Likely for discovering public groups or trending prompts.
3. **Audio/Video Prompts** - Player components exist but not in prompt rotation yet.
4. **Group Admin Features** - No kick members, delete group, or transfer ownership.
5. **Prompt Recommendations** - Table created (migration 113) but no logic.
6. **NSFW Filter Toggle** - Flag exists on prompts but no UI.
7. **Character Progression** - Points exist but no unlockable items/rewards.
8. **Public Leaderboards** - Total points tracked but not displayed publicly.
9. **Offline Prompt Queue** - Can't answer prompts offline.

## Known Issues

- Photo uploads may have memory issues with very large images (no compression before upload)
- Quiplash matchups need even member count (odd member gets skipped)
- No duplicate group membership prevention
- Push notification denial has no re-prompt flow
- Heavy animations may lag on older devices

## Key Database Tables

profiles, groups, group_members, prompts, group_prompts (scheduling), responses, prompt_ratings, quiplash_assignments, quiplash_votes, weekly_points, weekly_winners, fireside_comments, push_tokens, group_schedule_state, crash_logs

## Key RPC Functions

get_group_status, submit_prompt_rating, assign_quiplash_prompts, get_my_quiplash, get_quiplash_matchups, submit_quiplash_vote, get_weekly_leaderboard, calculate_quiplash_winners, finalize_week, winner_choose_prompt, get_fireside_data, add_fireside_comment, get_multiple_choice_results, get_next_category, has_profile, get_my_profile, get_prompts_needing_notification, mark_prompt_notified, get_prompts_needing_reminder, mark_prompt_reminded, get_non_responder_push_tokens, get_group_push_tokens

## Deployment

- **OTA updates**: `eas update --branch production --platform ios` (JS-only changes)
- **New builds**: `eas build --platform ios --profile production` (native changes)
- **Edge functions**: `npx supabase functions deploy <function-name>` (from vibecheck dir)
- **Edge function auth**: Use JWT-format service_role key from `npx supabase projects api-keys` (NOT the sb_publishable_/sb_secret_ format keys)
- Update channel: production, runtime version policy: appVersion (1.0.3)

## Important Bugs Fixed (for context)

- Hooks ordering crash in QuiplashVotingCard (hooks after early returns)
- Photo uploads saving as 0 bytes (SDK 54 File API migration)
- Group streak inflation (recalculation fix)
- Fire transitions covering main screen (z-index)
- Offline banner not working with OTA (switched to ping-based)
- Quiplash points not awarding (trigger fix)
- Duplicate prompts in seed data

## Dev Notes

- Windows dev environment (MSYS/Git Bash) - use `/c/Users/steph/vibecheck` paths in bash
- Web export crashes (AsyncStorage/window SSR issues) - use `--platform ios` for OTA updates
- 119 SQL migrations total
- React 19.1.0 with React Compiler experiments enabled
- Typed routes enabled in Expo Router
