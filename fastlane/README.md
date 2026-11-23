fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios upload_screenshots

```sh
[bundle exec] fastlane ios upload_screenshots
```

Upload screenshots only for current Deliverfile app_version (no metadata, no IPA)

### ios deliver_metadata

```sh
[bundle exec] fastlane ios deliver_metadata
```

Upload App Store Connect metadata and screenshots (no IPA, no submit)

### ios upload_ipa

```sh
[bundle exec] fastlane ios upload_ipa
```

Archive Release and upload IPA to App Store Connect (no metadata, no submit)

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
