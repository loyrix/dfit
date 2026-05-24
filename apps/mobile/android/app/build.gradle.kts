import java.util.Base64

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val flutterDartDefineKeysFromEnv =
    listOf(
        "LOGMYPLATE_API_BASE_URL",
        "LOGMYPLATE_GOOGLE_WEB_CLIENT_ID",
        "LOGMYPLATE_GOOGLE_ANDROID_CLIENT_ID",
    )

fun normalizeEnvValue(rawValue: String): String {
    val trimmed = rawValue.trim()
    return when {
        trimmed.length >= 2 && trimmed.startsWith("\"") && trimmed.endsWith("\"") ->
            trimmed.substring(1, trimmed.length - 1)
        trimmed.length >= 2 && trimmed.startsWith("'") && trimmed.endsWith("'") ->
            trimmed.substring(1, trimmed.length - 1)
        else -> trimmed
    }
}

fun repoEnvValue(key: String): String? {
    val envFile = rootProject.file("../../../.env")
    if (!envFile.isFile) return null

    val keyPrefix = "$key="
    val exportKeyPrefix = "export $key="
    return envFile.useLines { lines ->
        lines
            .map { it.trim() }
            .firstNotNullOfOrNull { line ->
                when {
                    line.isBlank() || line.startsWith("#") -> null
                    line.startsWith(keyPrefix) -> normalizeEnvValue(line.substringAfter("="))
                    line.startsWith(exportKeyPrefix) -> normalizeEnvValue(line.substringAfter("="))
                    else -> null
                }
            }
    }
}

fun encodeDartDefine(key: String, value: String): String =
    Base64.getEncoder().encodeToString("$key=$value".toByteArray(Charsets.UTF_8))

fun dartDefineKey(encodedDefine: String): String? =
    runCatching {
        String(Base64.getDecoder().decode(encodedDefine), Charsets.UTF_8)
            .substringBefore("=", missingDelimiterValue = "")
            .takeIf { it.isNotBlank() }
    }.getOrNull()

fun existingDartDefineKeys(encodedDefines: String): Set<String> =
    encodedDefines
        .split(",")
        .mapNotNull { dartDefineKey(it.trim()) }
        .toSet()

val existingDartDefines = providers.gradleProperty("dart-defines").orNull?.trim().orEmpty()
val existingDartDefineKeys = existingDartDefineKeys(existingDartDefines)
val envDartDefines =
    flutterDartDefineKeysFromEnv.mapNotNull { key ->
        val value = repoEnvValue(key)?.takeIf { it.isNotBlank() } ?: return@mapNotNull null
        if (key in existingDartDefineKeys) return@mapNotNull null
        encodeDartDefine(key, value)
    }

if (envDartDefines.isNotEmpty()) {
    extensions.extraProperties.set(
        "dart-defines",
        (listOf(existingDartDefines).filter { it.isNotBlank() } + envDartDefines).joinToString(","),
    )
}

val androidDemoAdMobAppId = "ca-app-pub-3940256099942544~3347511713"
val androidProductionAdMobAppId = "ca-app-pub-6936425975956435~2270550089"
val productionAdMobAppId =
    providers.gradleProperty("LOGMYPLATE_ADMOB_ANDROID_APP_ID").orNull?.trim()
        ?.takeIf { it.isNotEmpty() } ?: androidProductionAdMobAppId

android {
    namespace = "com.logmyplate.app"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        applicationId = "com.logmyplate.app"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        manifestPlaceholders["logmyplateAdMobAppId"] = androidDemoAdMobAppId
    }

    buildTypes {
        debug {
            manifestPlaceholders["logmyplateAdMobAppId"] = androidDemoAdMobAppId
        }

        release {
            manifestPlaceholders["logmyplateAdMobAppId"] = productionAdMobAppId
            // TODO: Add your own signing config for the release build.
            // Signing with the debug keys for now, so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

flutter {
    source = "../.."
}
