# Mokine Expo Go

This mobile app wraps the Mokine web app inside a WebView for quick mobile testing.

## Run

```bash
cd mokine-expo
npm start
```

Then scan the QR code with Expo Go.

## Important

On a real phone, `localhost` does not point to your PC.
Use your PC LAN IP in the app URL field, for example:

```text
http://192.168.1.50:3000/dashboard
```

The phone and your PC must be on the same Wi-Fi network.

## If the page does not load

- Start the web app first (`npm start` in the root project)
- Confirm your PC firewall allows port `3000`
- Use `http://<LAN-IP>:3000/dashboard` in the input field
