# SureVey Mobile

Mobile app rieng cho role `Customer` va `Collaborator`. Role `Admin` co the dang nhap nhung se thay man hinh yeu cau dung web dashboard.

## Chay local

```bash
npm install
npm run start
```

Neu chay tren dien thoai that, backend local khong nen de `localhost`; hay cau hinh IP LAN hoac dung cac service Render mac dinh trong `.env`.

## Cau hinh API

Copy `.env.example` thanh `.env` neu can doi backend:

```bash
EXPO_PUBLIC_API_GATEWAY_URL=
EXPO_PUBLIC_USER_API_URL=https://suresurvey-user-service.onrender.com
EXPO_PUBLIC_SURVEY_API_URL=https://suresurvey-survey-service.onrender.com
EXPO_PUBLIC_WALLET_API_URL=https://suresurvey-wallet-service.onrender.com
```

Neu co API Gateway, dien `EXPO_PUBLIC_API_GATEWAY_URL`; app se giu prefix `/user`, `/survey`, `/wallet` nhu frontend web.

## Xuat APK de gui tester

Lua chon de de nhat la EAS cloud build:

```bash
npm install
npx eas login
npm run eas:apk
```

Sau khi build xong, EAS tra ve link download file `.apk`.

Neu muon build local tren may nay:

```bash
npm install
npm run prebuild:android
npm run apk:release
```

File APK se nam o:

```text
mobile/android/app/build/outputs/apk/release/app-release.apk
```

Build local can:

- Node.js `^20.19.4` hoac `^22.13.0` tro len.
- `JAVA_HOME` tro toi thu muc JDK/JBR co `bin/java.exe`.
- `ANDROID_HOME` hoac `ANDROID_SDK_ROOT` tro toi Android SDK.

Tai thoi diem scaffold, may hien tai co `ANDROID_HOME=D:\Android\Sdk`, nhung `JAVA_HOME=D:\Android\AndroidStudio\jbr` khong ton tai nen chua xuat duoc APK local. Sau khi cai JDK/Android Studio hoac sua `JAVA_HOME`, chay lai:

```bash
npm run apk:release
```
