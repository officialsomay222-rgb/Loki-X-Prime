package com.lokiprimex.app;

import android.content.Intent;
import android.provider.Settings;
import android.util.Log;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AssistantSettings")
public class AssistantSettingsPlugin extends Plugin {

    @PluginMethod
    public void openAssistantSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_VOICE_INPUT_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            Log.e("AssistantSettings", "Failed to open voice input settings, trying default apps settings", e);
            try {
                Intent backupIntent = new Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS);
                backupIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(backupIntent);
                call.resolve();
            } catch (Exception ex) {
                Log.e("AssistantSettings", "Failed to open default apps settings", ex);
                call.reject("Could not open settings");
            }
        }
    }
}
