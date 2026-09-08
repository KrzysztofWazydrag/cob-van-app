# Cob Van App

Interactive Expo prototype for iOS, Android, and web.

## What is included

- Customer home with live ETA, breakfast cutoff, menu categories, low-stock prompts, and van tracking
- Product customisation with sauce, quantity, and `Reserve mine`
- Build-your-own cob, baguette, or wrap with live filling prices and a clear order summary
- Working Home, Favourites, and Orders customer tabs
- One distinct local food photo for every menu item
- New reservations appear immediately in the current-stop driver order list
- Van crew order flow: `Reserved → Preparing → Ready → Collected`
- Each order shows customer, number, item, quantity, options, price, and status
- Van crew view with next stop, arrival action, order list, and stock split
- Reserved vs walk-in stock visibility to reduce waste
- One-tap walk-up sales and collection both keep physical/reserved stock accurate
- Expo Go-compatible OpenStreetMap tracking view with a moving van marker
- Local arrival notification when the driver starts Stop Mode

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

This is a front-end product prototype with realistic local data. The map movement and service time are simulated, and map tiles require an internet connection. Real driver GPS, remote push delivery, authentication, and Supabase persistence belong to a later backend-connected phase.

Remote push notifications and background driver location require an Expo development build. Expo Go supports the prototype's map and order flow; notification integration is skipped there so the app can run without the unsupported Android push module.
