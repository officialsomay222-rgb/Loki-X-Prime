package com.lokiprimex.app;

import androidx.core.content.ContextCompat;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import android.os.Handler;
import android.os.Looper;
import android.service.voice.VoiceInteractionSession;
import android.view.ContextThemeWrapper;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.view.WindowManager;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.view.MotionEvent;
import android.view.VelocityTracker;
import android.widget.TextView;
import android.widget.FrameLayout;
import android.text.TextWatcher;
import android.text.Editable;
import android.view.inputmethod.InputMethodManager;

import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.util.Log;
import android.util.TypedValue;


import io.noties.markwon.Markwon;

public class AssistantSession extends VoiceInteractionSession {

    private View mRootView;
    private FrameLayout mInsetsContainer;
    private LinearLayout mUnifiedBottomSheet;
    private VibrantGlowView mRgbEdgeView;
    private LinearLayout mLayoutProcessingMode;
    private LinearLayout mExpandedCard;
    private TextView mTextResponseBody;
    private BouncingDotsLoader mBouncingDotsLoader;
    private ResponseReceiver mResponseReceiver;

    public static final String ACTION_ASK_AI = "com.loki.ACTION_ASK_AI";
    public static final String ACTION_AI_RESPONSE = "com.loki.ACTION_AI_RESPONSE";
    public static final String EXTRA_TEXT = "text";
    public static final String EXTRA_RESPONSE = "response";
    private static final String SDUI_CONFIG_URL = "https://loki-x-prime.vercel.app/native_ui_config.json";
    private static final String TAG = "LokiSDUI";


    // Dual-State UI Elements
    private LinearLayout mStateIdlePill;
    private LinearLayout mStateTypingCard;

    private EditText mInputPillText;
    private ImageButton mBtnPillAdd;
    private ImageButton mBtnPillLens;
    private ImageButton mBtnPillMic;
    private ImageButton mBtnPillSparkle;

    private EditText mInputCardText;
    private ImageButton mBtnCardAdd;
    private ImageButton mBtnCardLens;
    private ImageButton mBtnCardSend;
    private View mDragHandleState2;

    private float mInitialTouchY;
    private float mInitialTranslationY;
    private VelocityTracker mVelocityTracker;
    private boolean mIsDragging = false;
    private boolean mIsSyncingText = false;

    public AssistantSession(Context context) {
        super(context);
    }

    @Override
    public View onCreateContentView() {
        // Ensure transparent system bars, edge-to-edge rendering, and no layout overlapping
        getWindow().getWindow().addFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
        getWindow().getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        getWindow().getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);

        ContextThemeWrapper themedContext = new ContextThemeWrapper(getContext(), R.style.AppTheme_NoActionBar);
        LayoutInflater inflater = LayoutInflater.from(themedContext);
        mRootView = inflater.inflate(R.layout.assistant_overlay, null);

        mInsetsContainer = mRootView.findViewById(R.id.assistant_insets_container);
        mUnifiedBottomSheet = mRootView.findViewById(R.id.unified_bottom_sheet);
        mRgbEdgeView = mRootView.findViewById(R.id.rgb_edge_view);

        mLayoutProcessingMode = mRootView.findViewById(R.id.layout_processing_mode);
        mExpandedCard = mRootView.findViewById(R.id.expanded_card);
        mTextResponseBody = mRootView.findViewById(R.id.text_response_body);
        mBouncingDotsLoader = mRootView.findViewById(R.id.bouncing_dots_loader);

        mResponseReceiver = new ResponseReceiver();

        // Bind Dual-State Elements
        mStateIdlePill = mRootView.findViewById(R.id.state_idle_pill);
        mStateTypingCard = mRootView.findViewById(R.id.state_typing_card);

        mInputPillText = mRootView.findViewById(R.id.input_pill_text);
        mBtnPillAdd = mRootView.findViewById(R.id.btn_pill_add);
        mBtnPillLens = mRootView.findViewById(R.id.btn_pill_lens);
        mBtnPillMic = mRootView.findViewById(R.id.btn_pill_mic);
        mBtnPillSparkle = mRootView.findViewById(R.id.btn_pill_sparkle);

        mInputCardText = mRootView.findViewById(R.id.input_card_text);
        mBtnCardAdd = mRootView.findViewById(R.id.btn_card_add);
        mBtnCardLens = mRootView.findViewById(R.id.btn_card_lens);
        mBtnCardSend = mRootView.findViewById(R.id.btn_card_send);
        mDragHandleState2 = mRootView.findViewById(R.id.drag_handle_state2);

        setupWindowInsets();
        setupDualStateLogic();
        setupDummyListeners();
        setupDragToDismiss();

        // Fetch remote Server-Driven UI config
        fetchRemoteUIConfig();


        return mRootView;
    }

    private void setupWindowInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(mInsetsContainer, (v, insets) -> {
            boolean isImeVisible = insets.isVisible(WindowInsetsCompat.Type.ime());

            // Toggle Dual-State UI based on IME visibility
            if (isImeVisible) {
                mStateIdlePill.setVisibility(View.GONE);
                mStateTypingCard.setVisibility(View.VISIBLE);
            } else {
                mStateTypingCard.setVisibility(View.GONE);
                mStateIdlePill.setVisibility(View.VISIBLE);
                mInputPillText.clearFocus();
            }

            int bottomInset = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.ime()).bottom;
            int topInset = insets.getInsets(WindowInsetsCompat.Type.systemBars()).top;

            v.setPadding(v.getPaddingLeft(), topInset, v.getPaddingRight(), bottomInset);
            return insets;
        });
    }

    private void setupDualStateLogic() {
        // Text Synchronization
        TextWatcher textSyncWatcher = new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {}

            @Override
            public void afterTextChanged(Editable s) {
                if (mIsSyncingText) return;
                mIsSyncingText = true;

                if (mInputPillText.hasFocus() && !mInputPillText.getText().toString().equals(mInputCardText.getText().toString())) {
                    mInputCardText.setText(s);
                    mInputCardText.setSelection(s.length());
                } else if (mInputCardText.hasFocus() && !mInputCardText.getText().toString().equals(mInputPillText.getText().toString())) {
                    mInputPillText.setText(s);
                    mInputPillText.setSelection(s.length());
                }

                mIsSyncingText = false;
            }
        };

        mInputPillText.addTextChangedListener(textSyncWatcher);
        mInputCardText.addTextChangedListener(textSyncWatcher);

        // Click to Focus & Popup Keyboard
        mInputPillText.setOnTouchListener((v, event) -> {
            if (event.getAction() == MotionEvent.ACTION_UP) {
                mStateTypingCard.setVisibility(View.VISIBLE);
                mStateIdlePill.setVisibility(View.GONE);
                mInputCardText.requestFocus();

                InputMethodManager imm = (InputMethodManager) getContext().getSystemService(Context.INPUT_METHOD_SERVICE);
                if (imm != null) {
                    imm.showSoftInput(mInputCardText, InputMethodManager.SHOW_IMPLICIT);
                }
                return true; // Consume event to prevent Pill from showing keyboard
            }
            return false;
        });

        // Drag Handle to Hide Keyboard (State 2)
        mDragHandleState2.setOnTouchListener((v, event) -> {
            if (event.getAction() == MotionEvent.ACTION_DOWN) {
                mInitialTouchY = event.getRawY();
                return true;
            } else if (event.getAction() == MotionEvent.ACTION_MOVE) {
                float deltaY = event.getRawY() - mInitialTouchY;
                if (deltaY > 50) { // Swipe down threshold
                    InputMethodManager imm = (InputMethodManager) getContext().getSystemService(Context.INPUT_METHOD_SERVICE);
                    if (imm != null) {
                        imm.hideSoftInputFromWindow(mInputCardText.getWindowToken(), 0);
                    }
                }
                return true;
            }
            return false;
        });
    }

    private void setupDragToDismiss() {
        mUnifiedBottomSheet.setOnTouchListener((v, event) -> {
            switch (event.getActionMasked()) {
                case MotionEvent.ACTION_DOWN:
                    mInitialTouchY = event.getRawY();
                    mInitialTranslationY = mUnifiedBottomSheet.getTranslationY();
                    mIsDragging = false;

                    if (mVelocityTracker == null) {
                        mVelocityTracker = VelocityTracker.obtain();
                    } else {
                        mVelocityTracker.clear();
                    }
                    mVelocityTracker.addMovement(event);
                    return true;

                case MotionEvent.ACTION_MOVE:
                    mVelocityTracker.addMovement(event);
                    float deltaY = event.getRawY() - mInitialTouchY;

                    if (deltaY > 0) { // Only allow dragging downwards
                        mIsDragging = true;
                        mUnifiedBottomSheet.setTranslationY(mInitialTranslationY + deltaY);
                    }
                    return true;

                case MotionEvent.ACTION_UP:
                case MotionEvent.ACTION_CANCEL:
                    if (!mIsDragging) {
                        v.performClick();
                        return false;
                    }
                    mIsDragging = false;
                    mVelocityTracker.addMovement(event);
                    mVelocityTracker.computeCurrentVelocity(1000);
                    float yVelocity = mVelocityTracker.getYVelocity();

                    float draggedDistance = mUnifiedBottomSheet.getTranslationY() - mInitialTranslationY;
                    float dismissThreshold = mUnifiedBottomSheet.getHeight() * 0.3f;

                    if (yVelocity > 1500 || draggedDistance > dismissThreshold) {
                        // Dismiss
                        mUnifiedBottomSheet.animate()
                            .translationY(mUnifiedBottomSheet.getHeight())
                            .setDuration(300)
                            .setInterpolator(new android.view.animation.DecelerateInterpolator())
                            .withEndAction(() -> {
                                hide();
                            })
                            .start();
                    } else {
                        // Snap back
                        mUnifiedBottomSheet.animate()
                            .translationY(mInitialTranslationY)
                            .setDuration(200)
                            .setInterpolator(new android.view.animation.DecelerateInterpolator())
                            .start();
                    }

                    if (mVelocityTracker != null) {
                        mVelocityTracker.recycle();
                        mVelocityTracker = null;
                    }
                    return true;
            }
            return false;
        });
    }

    private void setupDummyListeners() {
        mBtnPillMic.setOnClickListener(v -> triggerProcessingState());
        mBtnCardSend.setOnClickListener(v -> triggerProcessingState());

        mInputCardText.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_SEND ||
                (event != null && event.getKeyCode() == KeyEvent.KEYCODE_ENTER && event.getAction() == KeyEvent.ACTION_DOWN)) {
                triggerProcessingState();
                return true;
            }
            return false;
        });
    }

    private void setButtonsEnabled(boolean enabled) {
        if (mBtnPillMic != null) mBtnPillMic.setEnabled(enabled);
        if (mBtnCardSend != null) mBtnCardSend.setEnabled(enabled);
        if (mBtnPillAdd != null) mBtnPillAdd.setEnabled(enabled);
        if (mBtnCardAdd != null) mBtnCardAdd.setEnabled(enabled);
        if (mBtnPillLens != null) mBtnPillLens.setEnabled(enabled);
        if (mBtnCardLens != null) mBtnCardLens.setEnabled(enabled);
        if (mBtnPillSparkle != null) mBtnPillSparkle.setEnabled(enabled);
        if (mInputPillText != null) mInputPillText.setEnabled(enabled);
        if (mInputCardText != null) mInputCardText.setEnabled(enabled);
    }

    private void triggerProcessingState() {
        String activeText = "";
        if (mStateTypingCard.getVisibility() == View.VISIBLE) {
            activeText = mInputCardText.getText().toString();
        } else {
            activeText = mInputPillText.getText().toString();
        }

        // Show processing state and trigger edge animation
        mStateIdlePill.setVisibility(View.GONE);
        mStateTypingCard.setVisibility(View.GONE);

        // Hide Keyboard
        InputMethodManager imm = (InputMethodManager) getContext().getSystemService(Context.INPUT_METHOD_SERVICE);
        if (imm != null) {
            imm.hideSoftInputFromWindow(mRootView.getWindowToken(), 0);
        }

        mLayoutProcessingMode.setVisibility(View.VISIBLE);
        setButtonsEnabled(false);
        mExpandedCard.setVisibility(View.VISIBLE);

        mTextResponseBody.setText("");
        mTextResponseBody.setVisibility(View.GONE);
        mBouncingDotsLoader.setVisibility(View.VISIBLE);
        mBouncingDotsLoader.startAnimation();

        if (mRgbEdgeView != null) {
            mRgbEdgeView.startAnimation();
        }

        mInputPillText.setText("");
        mInputCardText.setText("");

        // Send Outgoing Broadcast to Web/Capacitor layer
        Intent intent = new Intent(ACTION_ASK_AI);
        intent.putExtra(EXTRA_TEXT, activeText);
        getContext().sendBroadcast(intent);
    }

    private class ResponseReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (ACTION_AI_RESPONSE.equals(intent.getAction())) {
                String markdownResponse = intent.getStringExtra(EXTRA_RESPONSE);

                // Restore UI state
                mLayoutProcessingMode.setVisibility(View.GONE);
                mStateIdlePill.setVisibility(View.VISIBLE);
                setButtonsEnabled(true);

                // Stop Loader and Show Text
                mBouncingDotsLoader.stopAnimation();
                mBouncingDotsLoader.setVisibility(View.GONE);
                mTextResponseBody.setVisibility(View.VISIBLE);

                if (markdownResponse != null) {
                    Markwon markwon = Markwon.create(getContext());
                    markwon.setMarkdown(mTextResponseBody, markdownResponse);
                }

                if (mRgbEdgeView != null) {
                    mRgbEdgeView.stopAnimation();
                }
            }
        }
    }

    @Override
    public void onShow(Bundle args, int showFlags) {
        super.onShow(args, showFlags);
        // Reset state on show
        if (mUnifiedBottomSheet != null) {
            mUnifiedBottomSheet.setTranslationY(0f);
        }

        if (mStateIdlePill != null) {
            mStateIdlePill.setVisibility(View.VISIBLE);
            mStateTypingCard.setVisibility(View.GONE);
            mLayoutProcessingMode.setVisibility(View.GONE);
            setButtonsEnabled(true);
            mExpandedCard.setVisibility(View.GONE);
            mInputPillText.setText("");
            mInputCardText.setText("");
            mInputPillText.clearFocus();
        }

        // Always trigger edge animation when first opened
        if (mRgbEdgeView != null) {
            mRgbEdgeView.startAnimation();
        }

        IntentFilter filter = new IntentFilter(ACTION_AI_RESPONSE);
        ContextCompat.registerReceiver(getContext(), mResponseReceiver, filter, ContextCompat.RECEIVER_EXPORTED);
    }

    @Override
    public void onHide() {
        super.onHide();
        if (mRgbEdgeView != null) {
            mRgbEdgeView.stopAnimation();
        }
        try {
            getContext().unregisterReceiver(mResponseReceiver);
        } catch (IllegalArgumentException e) {
            // Ignored, receiver not registered
        }
    }
    private void fetchRemoteUIConfig() {
        ExecutorService executor = Executors.newSingleThreadExecutor();
        executor.execute(() -> {
            HttpURLConnection urlConnection = null;
            try {
                URL url = new URL(SDUI_CONFIG_URL);
                urlConnection = (HttpURLConnection) url.openConnection();
                urlConnection.setConnectTimeout(5000);
                urlConnection.setReadTimeout(5000);
                urlConnection.setRequestMethod("GET");

                int responseCode = urlConnection.getResponseCode();
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(urlConnection.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    reader.close();

                    JSONObject config = new JSONObject(response.toString());
                    Log.i(TAG, "SDUI Config fetched successfully");

                    new Handler(Looper.getMainLooper()).post(() -> applyDynamicStyles(config));
                } else {
                    Log.w(TAG, "Failed to fetch SDUI Config: HTTP " + responseCode);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error fetching SDUI Config: " + e.getMessage());
            } finally {
                if (urlConnection != null) {
                    urlConnection.disconnect();
                }
            }
        });
        executor.shutdown();
    }

    private void applyDynamicStyles(JSONObject config) {
        try {
            if (config.has("state1_pill")) {
                JSONObject state1Pill = config.getJSONObject("state1_pill");

                if (mStateIdlePill != null && state1Pill.has("bg_color") && state1Pill.has("corner_radius_dp")) {
                    String bgColor = state1Pill.getString("bg_color");
                    int cornerRadiusDp = state1Pill.getInt("corner_radius_dp");
                    float cornerRadiusPx = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, cornerRadiusDp, getContext().getResources().getDisplayMetrics());

                    GradientDrawable pillDrawable = new GradientDrawable();
                    pillDrawable.setShape(GradientDrawable.RECTANGLE);
                    pillDrawable.setColor(Color.parseColor(bgColor));
                    pillDrawable.setCornerRadius(cornerRadiusPx);
                    mStateIdlePill.setBackground(pillDrawable);
                }

                View micBgView = mRootView.findViewById(R.id.bg_mic_circle_view);
                if (micBgView != null && state1Pill.has("mic_bg_color")) {
                    String micBgColor = state1Pill.getString("mic_bg_color");
                    GradientDrawable micDrawable = new GradientDrawable();
                    micDrawable.setShape(GradientDrawable.OVAL);
                    micDrawable.setColor(Color.parseColor(micBgColor));
                    micBgView.setBackground(micDrawable);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error applying dynamic styles: " + e.getMessage());
        }
    }

}
