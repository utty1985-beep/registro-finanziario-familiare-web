# Android Wallet recovery V129 — 14 October 2026

Base: the user's uploaded V121 APK, package `it.registrofamiliare.app.notifiche2026.v2`.
New versionCode: 129; versionName: 3.5.9.

The fix adds bounded rebind attempts after listener disconnection, rescans after a successful connection, and isolates each notification so a malformed extras bundle cannot abort a batch before the Wallet notification. A stale listener Binder is unbound and rebound. Source selections remain respected. The amount parser normalizes non-breaking spaces and direction marks while excluding balance amounts. Diagnostics distinguish a disconnected reader, an empty scan, a disabled Wallet source and a parsing failure.

The existing pending-payment storage, deduplication IDs, background upload and acknowledgement protocol are preserved. No permissions, backend schema or RPC changes are introduced. The web recovery control waits for the native scan rather than assuming it finished after 1.4 seconds. Financial calculations are retained from web V128. The APK's fallback HTML bundles the same dependency scripts inline.

`PaymentNotificationListener.java` is an ABI-only compile stub: NEVER include that class or its Companion class in the APK. Patch the existing V121 smali with `patch_native.py`. Package only WalletRecovery and WalletAmountParser classes and their nested classes from D8 output.

Build tools used: ECJ 3.39.0, R8/D8 8.7.18, android-all 14-robolectric-10818077 as compile-only API, Apktool 3.0.3 for disassembly and Apktool 2.11.1 for assembly, uber-apk-signer 1.3.0. The assembly from Apktool 3.0.3 produced an invalid DEX in this environment and was discarded. Verify DEX header, all original classes and all original method signatures before signing.

Signed using the existing private release key retrieved from the user's saved release archive. The key and its credentials must never be committed. Verified v2/v3 certificate SHA-256:
`65455faa4fd2fd5a5c198d42972fecf6b6df3dc5a0367a964f14b34986eeba4a`.

Validation: 26 money-parser regressions; 12 lifecycle/scan regressions with deterministic Android test doubles; 11 JS queue/viewer/recovery regressions; inline JS syntax; APK integrity, zip alignment and signatures; 1,063 original classes and every original method retained (1,071 classes after patch).

Final APK SHA-256: `2a66496095a04ef83b46aa77110ef13bb5785d5b0ae623cb9fb3cbd7dcbbc037`.
Physical-device capture and the specific Wallet payment are not verified remotely. Install V129 as an update and use Recover Wallet with the existing Wallet notification still visible.
