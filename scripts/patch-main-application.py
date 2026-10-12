"""Rewrite MainApplication.kt for Expo SDK 57 / RN 0.79 (no ReactNativeHostWrapper)."""
import sys

kt_path, pkg = sys.argv[1], sys.argv[2]
content = f"""package {pkg}

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
import expo.modules.ApplicationLifecycleDispatcher

class MainApplication : Application(), ReactApplication {{

  override val reactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {{
      override fun getPackages(): List<ReactPackage> = PackageList(this).packages

      override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

      override fun getUseDeveloperSupport(): Boolean = false

      override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
    }}

  override fun onCreate() {{
    super.onCreate()
    SoLoader.init(this, false)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {{
      load()
    }}
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }}
}}
"""
with open(kt_path, "w") as f:
    f.write(content)
print("MainApplication.kt written successfully")
