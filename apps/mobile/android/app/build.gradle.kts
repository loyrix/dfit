import groovy.json.JsonSlurper
import java.util.Base64
import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val logmyplateAndroidApplicationId = "com.logmyplate.app"
val androidGoogleServicesFile = project.file("google-services.json")

val flutterDartDefineKeysFromEnv =
    listOf(
        "LOGMYPLATE_API_BASE_URL",
        "LOGMYPLATE_GOOGLE_WEB_CLIENT_ID",
        "LOGMYPLATE_GOOGLE_ANDROID_CLIENT_ID",
        "LOGMYPLATE_REVENUECAT_IOS_API_KEY",
        "LOGMYPLATE_REVENUECAT_ANDROID_API_KEY",
        "LOGMYPLATE_REVENUECAT_TEST_API_KEY",
        "LOGMYPLATE_REVENUECAT_OFFERING_ID",
        "LOGMYPLATE_REVENUECAT_ENTITLEMENT_ID",
        "LOGMYPLATE_FIREBASE_API_KEY",
        "LOGMYPLATE_FIREBASE_PROJECT_ID",
        "LOGMYPLATE_FIREBASE_MESSAGING_SENDER_ID",
        "LOGMYPLATE_FIREBASE_APP_ID",
        "LOGMYPLATE_FIREBASE_ANDROID_APP_ID",
        "LOGMYPLATE_FIREBASE_STORAGE_BUCKET",
        "LOGMYPLATE_FIREBASE_MEASUREMENT_ID",
        "LOGMYPLATE_FIREBASE_ANDROID_CLIENT_ID",
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

fun stringValue(value: Any?): String? =
    (value as? String)?.trim()?.takeIf { it.isNotEmpty() }

fun androidGoogleServicesJson(): Map<*, *>? =
    if (!androidGoogleServicesFile.isFile) {
        null
    } else {
        runCatching { JsonSlurper().parse(androidGoogleServicesFile) as? Map<*, *> }.getOrNull()
    }

fun androidGoogleServicesClient(): Map<*, *>? {
    val json = androidGoogleServicesJson() ?: return null
    val clients = json["client"] as? List<*> ?: return null
    return clients
        .filterIsInstance<Map<*, *>>()
        .firstOrNull { client ->
            val clientInfo = client["client_info"] as? Map<*, *>
            val androidInfo = clientInfo?.get("android_client_info") as? Map<*, *>
            stringValue(androidInfo?.get("package_name")) == logmyplateAndroidApplicationId
        }
}

fun googleServicesFirebaseValue(key: String): String? {
    val json = androidGoogleServicesJson() ?: return null
    val projectInfo = json["project_info"] as? Map<*, *> ?: return null
    val client = androidGoogleServicesClient() ?: return null
    val clientInfo = client["client_info"] as? Map<*, *>
    val apiKeys = client["api_key"] as? List<*>
    val firstApiKey = apiKeys?.filterIsInstance<Map<*, *>>()?.firstOrNull()

    return when (key) {
        "LOGMYPLATE_FIREBASE_API_KEY" -> stringValue(firstApiKey?.get("current_key"))
        "LOGMYPLATE_FIREBASE_PROJECT_ID" -> stringValue(projectInfo["project_id"])
        "LOGMYPLATE_FIREBASE_MESSAGING_SENDER_ID" -> stringValue(projectInfo["project_number"])
        "LOGMYPLATE_FIREBASE_APP_ID",
        "LOGMYPLATE_FIREBASE_ANDROID_APP_ID" -> stringValue(clientInfo?.get("mobilesdk_app_id"))
        "LOGMYPLATE_FIREBASE_STORAGE_BUCKET" -> stringValue(projectInfo["storage_bucket"])
        else -> null
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
val envDartDefineKeys = existingDartDefineKeys(envDartDefines.joinToString(","))
val googleServicesDartDefines =
    flutterDartDefineKeysFromEnv.mapNotNull { key ->
        val value = googleServicesFirebaseValue(key) ?: return@mapNotNull null
        if (key in existingDartDefineKeys || key in envDartDefineKeys) return@mapNotNull null
        encodeDartDefine(key, value)
    }
val effectiveDartDefines =
    (listOf(existingDartDefines).filter { it.isNotBlank() } + envDartDefines + googleServicesDartDefines)
        .joinToString(",")

if (envDartDefines.isNotEmpty() || googleServicesDartDefines.isNotEmpty()) {
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
    namespace = logmyplateAndroidApplicationId
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
        applicationId = logmyplateAndroidApplicationId
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = 24
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
