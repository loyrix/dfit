#!/bin/sh

# Load selected Flutter --dart-define values from the repo .env when building
# from Xcode. This keeps Xcode's Run button aligned with `flutter run` without
# checking local secret/config values into the project.

ENV_FILE="${SRCROOT}/../../../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "warning: Repo .env not found at ${ENV_FILE}; skipping Flutter dart defines." >&2
  return 0 2>/dev/null || exit 0
fi

decode_define() {
  printf '%s' "$1" | base64 -D 2>/dev/null
}

encode_define() {
  printf '%s=%s' "$1" "$2" | base64 | tr -d '\n'
}

read_env_value() {
  key="$1"
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

append_dart_define_from_env() {
  key="$1"
  value="$(read_env_value "$key")"
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
  echo "Loaded Flutter dart define ${key} from repo .env"
}

append_dart_define_from_env "LOGMYPLATE_API_BASE_URL"
append_dart_define_from_env "LOGMYPLATE_GOOGLE_WEB_CLIENT_ID"
append_dart_define_from_env "LOGMYPLATE_GOOGLE_IOS_CLIENT_ID"
append_dart_define_from_env "LOGMYPLATE_FIREBASE_API_KEY"
append_dart_define_from_env "LOGMYPLATE_FIREBASE_PROJECT_ID"
append_dart_define_from_env "LOGMYPLATE_FIREBASE_MESSAGING_SENDER_ID"
append_dart_define_from_env "LOGMYPLATE_FIREBASE_APP_ID"
append_dart_define_from_env "LOGMYPLATE_FIREBASE_IOS_APP_ID"
append_dart_define_from_env "LOGMYPLATE_FIREBASE_STORAGE_BUCKET"
append_dart_define_from_env "LOGMYPLATE_FIREBASE_MEASUREMENT_ID"
append_dart_define_from_env "LOGMYPLATE_FIREBASE_IOS_BUNDLE_ID"
append_dart_define_from_env "LOGMYPLATE_FIREBASE_IOS_CLIENT_ID"
