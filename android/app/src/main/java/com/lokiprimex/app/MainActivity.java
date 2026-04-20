package com.lokiprimex.app;

import android.os.Build;
import android.os.Bundle;
import android.graphics.Color;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.activity.EdgeToEdge;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;
import android.content.Intent;

public class MainActivity extends BridgeActivity {

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
        registerPlugin(AssistantSettingsPlugin.class);
        registerPlugin(AssistantModePlugin.class);

        try {
            if (getSupportActionBar() != null) {
                getSupportActionBar().hide();
            }
            if (getActionBar() != null) {
                getActionBar().hide();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Ensure the native WebView background is transparent so the web background shows through
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().setBackgroundColor(Color.TRANSPARENT);
        }

        // Enforce true edge-to-edge for API 35 (Android 15) and below.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        Window window = getWindow();

        // Aggressively force layout to extend into the cutout/notch area
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams layoutParams = window.getAttributes();
            layoutParams.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(layoutParams);
        }

        // Force system bars to be completely transparent
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            // Clear translucent flags first to avoid interference
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);

            // Required for setStatusBarColor to work
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);

            window.setStatusBarColor(Color.TRANSPARENT);
            window.setNavigationBarColor(Color.TRANSPARENT);
        }

        // Prevent Android 10+ from artificially adding grey overlays for contrast
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }
    }
}
