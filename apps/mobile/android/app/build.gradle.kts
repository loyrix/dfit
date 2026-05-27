import java.util.Base64
import java.util.Properties

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

fun dartDefineValue(encodedDefines: String, key: String): String? =
    encodedDefines
        .split(",")
        .firstNotNullOfOrNull { encodedDefine ->
            runCatching {
                val decoded = String(Base64.getDecoder().decode(encodedDefine.trim()), Charsets.UTF_8)
                val separator = decoded.indexOf("=")
                if (separator <= 0 || decoded.substring(0, separator) != key) {
                    null
                } else {
                    decoded.substring(separator + 1)
                }
            }.getOrNull()
        }

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
val effectiveDartDefines =
    (listOf(existingDartDefines).filter { it.isNotBlank() } + envDartDefines).joinToString(",")

if (envDartDefines.isNotEmpty()) {
    extensions.extraProperties.set(
        "dart-defines",
        effectiveDartDefines,
    )
}

fun configuredDartDefineValue(key: String): String? =
    dartDefineValue(effectiveDartDefines, key)?.trim()?.takeIf { it.isNotEmpty() }

fun requireReleaseDartDefine(key: String, message: String) {
    if (configuredDartDefineValue(key) == null) {
        throw GradleException(message)
    }
}

val androidDemoAdMobAppId = "ca-app-pub-3940256099942544~3347511713"
val androidProductionAdMobAppId = "ca-app-pub-6936425975956435~2270550089"
val productionAdMobAppId =
    providers.gradleProperty("LOGMYPLATE_ADMOB_ANDROID_APP_ID").orNull?.trim()
        ?.takeIf { it.isNotEmpty() } ?: androidProductionAdMobAppId
val releaseSigningPropertiesFile = rootProject.file("key.properties")
val releaseSigningProperties =
    Properties().apply {
        if (releaseSigningPropertiesFile.isFile) {
            releaseSigningPropertiesFile.inputStream().use { load(it) }
        }
    }

fun releaseSigningProperty(key: String): String? =
    releaseSigningProperties.getProperty(key)?.trim()?.takeIf { it.isNotEmpty() }

val releaseSigningConfigured =
    listOf("storeFile", "storePassword", "keyAlias", "keyPassword")
        .all { releaseSigningProperty(it) != null }

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

    signingConfigs {
        create("release") {
            if (releaseSigningConfigured) {
                storeFile = rootProject.file(releaseSigningProperty("storeFile")!!)
                storePassword = releaseSigningProperty("storePassword")
                keyAlias = releaseSigningProperty("keyAlias")
                keyPassword = releaseSigningProperty("keyPassword")
            }
        }
    }

    buildTypes {
        debug {
            manifestPlaceholders["logmyplateAdMobAppId"] = androidDemoAdMobAppId
        }

        release {
            manifestPlaceholders["logmyplateAdMobAppId"] = productionAdMobAppId
            if (releaseSigningConfigured) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }
}

gradle.taskGraph.whenReady {
    val releaseBuildRequested =
        allTasks.any { task ->
            task.name == "assembleRelease" ||
                task.name == "bundleRelease" ||
                task.name == "packageReleaseBundle"
        }
    if (releaseBuildRequested) {
        if (!releaseSigningConfigured) {
            throw GradleException(
                "Android release signing is not configured. Create apps/mobile/android/key.properties " +
                    "with storeFile, storePassword, keyAlias, and keyPassword before building a Play Store release.",
            )
        }
        requireReleaseDartDefine(
            "LOGMYPLATE_GOOGLE_WEB_CLIENT_ID",
            "Android Google sign-in is not configured. Set LOGMYPLATE_GOOGLE_WEB_CLIENT_ID " +
                "to the Web OAuth client ID so it can be passed as serverClientId.",
        )
        requireReleaseDartDefine(
            "LOGMYPLATE_GOOGLE_ANDROID_CLIENT_ID",
            "Android Google sign-in is missing its Android OAuth client marker. Set " +
                "LOGMYPLATE_GOOGLE_ANDROID_CLIENT_ID after creating the Android OAuth client " +
                "for package com.logmyplate.app and the current signing SHA.",
        )
    }
}

flutter {
    source = "../.."
}
