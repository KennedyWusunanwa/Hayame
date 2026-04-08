plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.serialization")
    id("org.jetbrains.kotlin.plugin.compose")
}

if (file("google-services.json").exists()) {
    apply(plugin = "com.google.gms.google-services")
}

android {
    namespace = "com.hayame.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.hayame.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        val apiBase = (project.findProperty("HAYAME_API_BASE_URL") as String?)?.trim()
            ?: "https://www.hayamegh.com"
        val supabaseUrl = (project.findProperty("HAYAME_SUPABASE_URL") as String?)?.trim()
            ?: "https://osvjxsbsuixfsgadzxzo.supabase.co"
        val supabaseAnonKey = (project.findProperty("HAYAME_SUPABASE_ANON_KEY") as String?)?.trim()
            ?: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdmp4c2JzdWl4ZnNnYWR6eHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3ODEwMjAsImV4cCI6MjA4MjM1NzAyMH0.C-S46gCdGSD4Bm7JZoACyMmb9hh3Mk7joGdTtEh50kc"
        val supabaseAvatarBucket = (project.findProperty("HAYAME_SUPABASE_AVATAR_BUCKET") as String?)?.trim()
            ?: ""
        val supabaseStorageBucket = (project.findProperty("HAYAME_SUPABASE_STORAGE_BUCKET") as String?)?.trim() ?: "car-photos"
        val supabaseHostIdBucket = (project.findProperty("HAYAME_SUPABASE_HOST_ID_BUCKET") as String?)?.trim() ?: "host-ids"

        buildConfigField("String", "API_BASE_URL", "\"$apiBase\"")
        buildConfigField("String", "SUPABASE_URL", "\"$supabaseUrl\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"$supabaseAnonKey\"")
        buildConfigField("String", "SUPABASE_AVATAR_BUCKET", "\"$supabaseAvatarBucket\"")
        buildConfigField("String", "SUPABASE_STORAGE_BUCKET", "\"$supabaseStorageBucket\"")
        buildConfigField("String", "SUPABASE_HOST_ID_BUCKET", "\"$supabaseHostIdBucket\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2025.01.01")
    implementation(composeBom)
    androidTestImplementation(composeBom)

    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.13.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.activity:activity-compose:1.10.1")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
    implementation("androidx.navigation:navigation-compose:2.8.8")
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    implementation("io.coil-kt:coil-compose:2.7.0")

    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")

    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-kotlinx-serialization:2.11.0")

    implementation("androidx.browser:browser:1.8.0")

    implementation("com.google.firebase:firebase-messaging-ktx:24.1.0")

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
