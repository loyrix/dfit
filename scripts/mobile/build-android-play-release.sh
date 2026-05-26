#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/../.." && pwd)"
mobile_dir="$repo_root/apps/mobile"
android_dir="$mobile_dir/android"
key_properties="$android_dir/key.properties"
output_dir="$mobile_dir/build/playstore"

build_name=""
build_number=""
run_analyze=1
run_tests=1

usage() {
  cat <<'EOF'
Build a signed Android App Bundle for Google Play.

Usage:
  scripts/mobile/build-android-play-release.sh [options]

Options:
  --build-name VERSION       Android versionName, for example 1.0.0.
                             Defaults to the name in apps/mobile/pubspec.yaml.
  --build-number NUMBER      Android versionCode. Must be higher than every
                             version code already uploaded to Play Console.
                             Defaults to pubspec build number + 1.
  --output-dir DIR           Where to copy the upload-ready AAB.
                             Defaults to apps/mobile/build/playstore.
  --skip-analyze             Skip flutter analyze.
  --skip-tests               Skip flutter test.
  -h, --help                 Show this help.

Example:
  scripts/mobile/build-android-play-release.sh --build-number 11
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --build-name)
      build_name="${2:-}"
      shift 2
      ;;
    --build-number)
      build_number="${2:-}"
      shift 2
      ;;
    --output-dir)
      output_dir="${2:-}"
      shift 2
      ;;
    --skip-analyze)
      run_analyze=0
      shift
      ;;
    --skip-tests)
      run_tests=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

read_pubspec_version() {
  awk '/^version:/ { print $2; exit }' "$mobile_dir/pubspec.yaml"
}

pubspec_version="$(read_pubspec_version)"
if [[ -z "$pubspec_version" || "$pubspec_version" != *"+"* ]]; then
  echo "Could not read version: x.y.z+n from apps/mobile/pubspec.yaml" >&2
  exit 1
fi

pubspec_build_name="${pubspec_version%%+*}"
pubspec_build_number="${pubspec_version##*+}"

if [[ -z "$build_name" ]]; then
  build_name="$pubspec_build_name"
fi

if [[ -z "$build_number" ]]; then
  if ! [[ "$pubspec_build_number" =~ ^[0-9]+$ ]]; then
    echo "Pubspec build number is not numeric: $pubspec_build_number" >&2
    exit 1
  fi
  build_number="$((pubspec_build_number + 1))"
  echo "No --build-number supplied; using pubspec build number + 1: $build_number"
fi

if ! [[ "$build_number" =~ ^[0-9]+$ ]] || [[ "$build_number" -le 0 ]]; then
  echo "--build-number must be a positive integer." >&2
  exit 1
fi

if [[ ! -f "$key_properties" ]]; then
  cat >&2 <<EOF
Missing Android release signing file:
  $key_properties

Create it with storeFile, storePassword, keyAlias, and keyPassword before
building a Play Store release.
EOF
  exit 1
fi

read_key_property() {
  local key="$1"
  awk -F= -v wanted="$key" '
    $1 == wanted {
      value = $0
      sub("^[^=]*=", "", value)
      gsub(/^[ \t]+|[ \t]+$/, "", value)
      print value
      exit
    }
  ' "$key_properties"
}

for property in storeFile storePassword keyAlias keyPassword; do
  value="$(read_key_property "$property")"
  if [[ -z "$value" ]]; then
    echo "Missing $property in $key_properties" >&2
    exit 1
  fi
done

store_file="$(read_key_property storeFile)"
if [[ ! -f "$android_dir/$store_file" ]]; then
  echo "Missing Android keystore file: $android_dir/$store_file" >&2
  exit 1
fi

require_command flutter

echo "Building LogMyPlate Android Play release"
echo "Version name: $build_name"
echo "Version code: $build_number"
echo "Output dir:   $output_dir"

cd "$mobile_dir"

flutter pub get

if [[ "$run_analyze" -eq 1 ]]; then
  flutter analyze
else
  echo "Skipping flutter analyze"
fi

if [[ "$run_tests" -eq 1 ]]; then
  flutter test
else
  echo "Skipping flutter test"
fi

flutter build appbundle --release \
  --build-name="$build_name" \
  --build-number="$build_number"

built_aab="$mobile_dir/build/app/outputs/bundle/release/app-release.aab"
if [[ ! -f "$built_aab" ]]; then
  echo "Expected AAB was not created: $built_aab" >&2
  exit 1
fi

if command -v jarsigner >/dev/null 2>&1; then
  jarsigner -verify "$built_aab"
else
  echo "Skipping jarsigner verification; jarsigner was not found."
fi

mkdir -p "$output_dir"
upload_aab="$output_dir/logmyplate-$build_name+$build_number-play-release.aab"
cp "$built_aab" "$upload_aab"

if command -v shasum >/dev/null 2>&1; then
  shasum -a 256 "$upload_aab" > "$upload_aab.sha256"
fi

echo
echo "Upload this AAB to Google Play:"
echo "$upload_aab"
echo
echo "Reminder: Play version codes cannot be reused. If Play rejects this build,"
echo "rerun with a higher --build-number."
