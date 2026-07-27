# Mythgate 5e Companion Privacy Policy

Last updated: 2026-07-27.

This document describes what data the Mythgate 5e Companion app ("the app") collects, where it goes, and who can see it. It describes only what the app actually does in code — no promises about practices that aren't implemented.

## 1. What works locally, without an account

The app can be used fully without signing in. Without an account, character data, character-creation drafts, custom coins, and theme/language preferences are stored **only on your device** (the app's local storage) and are never sent anywhere. Uninstalling the app removes this data.

The app also keeps a small technical log of its own activity locally on the device (e.g. which screens were opened, whether a sync conflict occurred) — with no email, character names, or note text, only event types and timestamps. This log is currently **not sent anywhere**; it exists only for local diagnostics. If a future version starts sending some of these events to Firebase Analytics/Crashlytics, we will update this policy and add a consent toggle in Settings before that version ships.

## 2. What is collected when you sign in with Google

Sign-in is handled through Google Sign-In and Firebase Authentication. We receive your email, profile name, and avatar link from Google. This data is stored in your profile document in the Firestore cloud database (`users` collection): `uid`, `email`, display name, profile photo link, and profile creation/update timestamps.

Separately, the `emailIndex` collection stores an "email → uid" lookup, used only so another player can find you by email to add you as a co-editor of a character sheet.

## 3. Character sheets: what is stored and who sees it

If you're signed in, a character sheet syncs to Firestore (`characterSheets` collection). The document holds the full sheet content: character name, race, class, ability scores, hit points, inventory, spells, notes, backstory, and other fields from the character editor. If you added a character portrait, a reference to that image is included in the document as well.

**Character sheet content becomes visible to people you (or the sheet owner) invited as co-editors.** Adding a co-editor works by email: the app looks the user up by email through `emailIndex` and adds their `uid` to that sheet's `editors` list. A co-editor can see and edit the entire sheet they were added to, the same as the owner.

**On shared sheets, the DM sees the change log.** Every sheet keeps a `changeHistory` field — a list of entries recording who (`uid`) changed which tab and which fields, and when. This log is visible to everyone with access to the sheet (owners and editors), including a DM who has been granted access. This exists to detect other people's changes during a live session and to show history on the DM screen.

If you run a campaign as a DM, the `dmCampaigns` and `dmCampaignNotes` collections work the same way as `characterSheets`: campaign owners and editors can see and edit its content.

## 4. Third parties

The app uses the following third-party services to power its cloud features:

- **Google Sign-In** — account sign-in;
- **Firebase Authentication** — account management;
- **Firebase Firestore** — storing and syncing character sheets, DM campaigns, and user profiles.

These services belong to Google. Data is shared with them only to the extent described above. The app currently **does not use** Firebase Analytics or Crashlytics — these tools are not present in the code. If they are added in a future version, we will update this policy before that version is released.

Data in Firestore is protected by the default security Google Cloud/Firebase infrastructure provides (encryption at the provider's infrastructure level). The app does not add its own additional encryption on top of that standard protection.

## 5. Account deletion

You can delete your account from **Settings → Danger Zone → Delete Account**. Before deleting, the app shows a preview of exactly what will happen to your cloud data and requires you to re-confirm sign-in with Google.

After confirmation:

- character sheets and DM campaigns where you are the **sole owner** are deleted entirely;
- sheets and campaigns with **other co-owners** are not deleted — you either transfer ownership to another co-owner/editor (your choice) or simply stop being a co-owner; the document and other people's data remain untouched;
- if you were only an editor on someone else's sheet or campaign, you are removed from the editors list; the document itself is not changed or deleted;
- your `connections` records (sharing links) are deleted;
- the `emailIndex` entry pointing to your account is deleted;
- your profile (`users/{uid}`) and your Firebase Authentication account are deleted.

Deletion is irreversible. If a network failure leaves your sign-in account active after your cloud data has already been removed, the app will show a separate notice — in that case, try again or contact support.

## 6. Contact

If you have questions about this policy or how your data is handled, contact app support through the contact details listed on the app's Google Play store page.
