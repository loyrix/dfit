#!/bin/sh

# Load selected Flutter --dart-define values when building from Xcode. Repo
# .env values win first; Firebase iOS values can also be derived from the
# bundled GoogleService-Info.plist.

ENV_FILE="${SRCROOT}/../../../.env"
FIREBASE_IOS_PLIST="${SRCROOT}/Runner/GoogleService-Info.plist"

if [ ! -f "$ENV_FILE" ]; then
  echo "warning: Repo .env not found at ${ENV_FILE}; checking bundled Firebase config only." >&2
fi

decode_define() {
  printf '%s' "$1" | base64 -D 2>/dev/null
}

encode_define() {
  printf '%s=%s' "$1" "$2" | base64 | tr -d '\n'
}

read_env_value() {
  key="$1"
  if [ ! -f "$ENV_FILE" ]; then
    printf ''
    return
  fi

  value=$(
    awk -v key="$key" '
      /^[[:space:]]*#/ { next }
      /^[[:space:]]*$/ { next }
      index($0, key "=") == 1 {
        sub("^[^=]*=", "", $0)
        print
        exit
      }
      index($0, "export " key "=") == 1 {
        sub("^export [^=]*=", "", $0)
        print
        exit
      }
    ' "$ENV_FILE"
  )

  case "$value" in
    \"*\")
      value="${value#\"}"
      value="${value%\"}"
      ;;
    \'*\')
      value="${value#\'}"
      value="${value%\'}"
      ;;
  esac

  printf '%s' "$value"
}

read_plist_value() {
  plist_key="$1"
  if [ ! -f "$FIREBASE_IOS_PLIST" ]; then
    printf ''
    return
  fi

  /usr/libexec/PlistBuddy -c "Print :${plist_key}" "$FIREBASE_IOS_PLIST" 2>/dev/null || true
}

has_dart_define_key() {
  key="$1"
  old_ifs="$IFS"
  IFS=','
  for encoded in ${DART_DEFINES:-}; do
    decoded="$(decode_define "$encoded")"
    case "$decoded" in
      "$key="*)
        IFS="$old_ifs"
        return 0
        ;;
    esac
  done
  IFS="$old_ifs"
  return 1
}

append_dart_define() {
  key="$1"
  value="$2"
  source="$3"
  if [ -z "$value" ]; then
    return
  fi
  if has_dart_define_key "$key"; then
    return
  fi

  encoded="$(encode_define "$key" "$value")"
  if [ -z "${DART_DEFINES:-}" ]; then
    DART_DEFINES="$encoded"
  else
    DART_DEFINES="$DART_DEFINES,$encoded"
  fi
  export DART_DEFINES
  echo "Loaded Flutter dart define ${key} from ${source}"
}

append_dart_define_from_env() {
  key="$1"
  value="$(read_env_value "$key")"
  append_dart_define "$key" "$value" "repo .env"
}

append_dart_define_from_ios_firebase_plist() {
  key="$1"
  plist_key="$2"
  value="$(read_plist_value "$plist_key")"
  append_dart_define "$key" "$value" "GoogleService-Info.plist"
}

append_dart_define_from_env "LOGMYPLATE_API_BASE_URL"
append_dart_define_from_env "LOGMYPLATE_GOOGLE_WEB_CLIENT_ID"
append_dart_define_from_env "LOGMYPLATE_GOOGLE_IOS_CLIENT_ID"
append_dart_define_from_env "LOGMYPLATE_REVENUECAT_IOS_API_KEY"
append_dart_define_from_env "LOGMYPLATE_REVENUECAT_ANDROID_API_KEY"
append_dart_define_from_env "LOGMYPLATE_REVENUECAT_TEST_API_KEY"
append_dart_define_from_env "LOGMYPLATE_REVENUECAT_OFFERING_ID"
append_dart_define_from_env "LOGMYPLATE_REVENUECAT_ENTITLEMENT_ID"
append_dart_define_from_env "LOGMYPLATE_FIREBASE_API_KEY"
append_dart_define_from_env "LOGMYPLATE_FIREBASE_PROJECT_ID"
append_dart_define_from_env "LOGMYPLATE_FIREBASE_MESSAGING_SENDER_ID"
append_dart_define_from_env "LOGMYPLATE_FIREBASE_APP_ID"
append_dart_define_from_env "LOGMYPLATE_FIREBASE_IOS_APP_ID"
append_dart_define_from_env "LOGMYPLATE_FIREBASE_STORAGE_BUCKET"
append_dart_define_from_env "LOGMYPLATE_FIREBASE_MEASUREMENT_ID"
append_dart_define_from_env "LOGMYPLATE_FIREBASE_IOS_BUNDLE_ID"
append_dart_define_from_env "LOGMYPLATE_FIREBASE_IOS_CLIENT_ID"

append_dart_define_from_ios_firebase_plist "LOGMYPLATE_FIREBASE_API_KEY" "API_KEY"
append_dart_define_from_ios_firebase_plist "LOGMYPLATE_FIREBASE_PROJECT_ID" "PROJECT_ID"
append_dart_define_from_ios_firebase_plist "LOGMYPLATE_FIREBASE_MESSAGING_SENDER_ID" "GCM_SENDER_ID"
append_dart_define_from_ios_firebase_plist "LOGMYPLATE_FIREBASE_APP_ID" "GOOGLE_APP_ID"
append_dart_define_from_ios_firebase_plist "LOGMYPLATE_FIREBASE_IOS_APP_ID" "GOOGLE_APP_ID"
append_dart_define_from_ios_firebase_plist "LOGMYPLATE_FIREBASE_STORAGE_BUCKET" "STORAGE_BUCKET"
append_dart_define_from_ios_firebase_plist "LOGMYPLATE_FIREBASE_IOS_BUNDLE_ID" "BUNDLE_ID"
