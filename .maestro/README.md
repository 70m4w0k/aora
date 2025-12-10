# Maestro E2E Tests

This directory contains end-to-end tests for the Tipi app using [Maestro](https://maestro.mobile.dev/).

## Prerequisites

1. **Install Maestro CLI**
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```
   
   Or on Windows (using PowerShell):
   ```powershell
   (New-Object Net.WebClient).DownloadString("https://get.maestro.mobile.dev") | bash
   ```

2. **Install Maestro Studio** (Optional but recommended)
   - Download from: https://maestro.mobile.dev/getting-started/installing-maestro-studio
   - Useful for recording and debugging tests visually

## Running Tests

### Run all tests
```bash
maestro test .maestro/
```

### Run a specific test
```bash
maestro test .maestro/landing-page.yaml
```

### Run tests on a specific device
```bash
# iOS Simulator
maestro test .maestro/landing-page.yaml --device "iPhone 15 Pro"

# Android Emulator
maestro test .maestro/landing-page.yaml --device "emulator-5554"
```

### Run tests with app launch
```bash
# Launch app first, then run tests
maestro test .maestro/landing-page.yaml --launcher "expo"
```

## Test Structure

- `landing-page.yaml` - Tests the landing page and basic navigation
- `config.yaml` - Global Maestro configuration

## Writing Tests

Maestro tests are written in YAML format. Key commands:

- `launchApp` - Launch the app
- `tapOn: "text"` - Tap on element with text
- `assertVisible: "text"` - Assert element is visible
- `inputText: "text"` - Input text into field
- `scroll` - Scroll the screen
- `takeScreenshot: "name"` - Take a screenshot
- `delay: 1000` - Wait for specified milliseconds

See [Maestro Documentation](https://maestro.mobile.dev/) for full command reference.

## App Configuration

The app ID is configured in each test file:
- iOS: `com.tipi.app`
- Android: `com.tipi.app`

Make sure these match your `app.json` configuration.

## Tips

1. **Use Maestro Studio** for visual test recording and debugging
2. **Add delays** after navigation or animations to ensure elements are loaded
3. **Use regex** for flexible text matching: `text: ".*Get Started.*"`
4. **Take screenshots** at key points for debugging
5. **Test on real devices** when possible, not just simulators

## CI/CD Integration

Maestro can be integrated into CI/CD pipelines. See:
- https://maestro.mobile.dev/advanced/ci-cd

## Troubleshooting

### App not launching
- Ensure the app is built and installed on the device/emulator
- Check that the app ID matches your configuration
- Try launching the app manually first

### Elements not found
- Use Maestro Studio to inspect the UI hierarchy
- Add delays after navigation
- Check if text matches exactly (case-sensitive)
- Use regex patterns for flexible matching

### Tests timing out
- Increase timeout in `config.yaml`
- Add explicit delays for slow operations
- Check network connectivity if testing API calls



