# Cob Van App

Interactive Expo prototype for iOS, Android, and web.

## What is included

- Customer home with live ETA, today's menu, low-stock prompts, and van tracking
- Product customisation with sauce, quantity, and `Reserve mine`
- Reservation confirmation state
- Van crew view with next stop, navigation/arrival action, packing checklist, and stock split
- Reserved vs walk-in stock visibility to reduce waste

Tap the **JP** avatar to open the van crew view, and **CV** to return to the customer view.

## Run locally

```bash
npm install
npm start
```

Then scan the QR code with Expo Go, or press `w` for the browser preview.

Useful alternatives:

```bash
npm run android
npm run ios
npm run web
```

## Current scope

This is a front-end product prototype with realistic local data. Push notifications, authentication, payments, live van location, and Supabase persistence are the next backend-connected phase.
