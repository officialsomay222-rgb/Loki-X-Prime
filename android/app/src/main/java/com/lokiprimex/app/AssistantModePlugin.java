package com.lokiprimex.app;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AssistantMode")
public class AssistantModePlugin extends Plugin {

    @PluginMethod
    public void checkAssistantMode(PluginCall call) {
        JSObject ret = new JSObject();
        boolean isAssistantMode = false;

        Intent intent = getActivity().getIntent();
        if (intent != null && intent.getBooleanExtra("assistant_mode", false)) {
            isAssistantMode = true;
        } else if (intent != null && Intent.ACTION_ASSIST.equals(intent.getAction())) {
            isAssistantMode = true;
        }

        ret.put("isAssistantMode", isAssistantMode);
        call.resolve(ret);
    }

    @PluginMethod
    public void closeAssistantMode(PluginCall call) {
        // Move app to background instead of killing it
        getActivity().moveTaskToBack(true);
        call.resolve();
    }

    @PluginMethod
    public void clearAssistantMode(PluginCall call) {
        Intent intent = getActivity().getIntent();
        if (intent != null) {
            intent.removeExtra("assistant_mode");
            intent.setAction(""); // clear ASSIST action
        }
        call.resolve();
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);

        boolean isAssistantMode = false;
        if (intent != null && intent.getBooleanExtra("assistant_mode", false)) {
            isAssistantMode = true;
        } else if (intent != null && Intent.ACTION_ASSIST.equals(intent.getAction())) {
            isAssistantMode = true;
        }

        JSObject ret = new JSObject();
        ret.put("isAssistantMode", isAssistantMode);
        notifyListeners("assistantModeChanged", ret, true);
    }
}
