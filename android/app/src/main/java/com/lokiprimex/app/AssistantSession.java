package com.lokiprimex.app;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
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
import android.widget.TextView;
import android.widget.FrameLayout;

import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import io.noties.markwon.Markwon;

public class AssistantSession extends VoiceInteractionSession {

    private View mRootView;
    private FrameLayout mInsetsContainer;
    private RgbEdgeAnimationView mRgbEdgeView;
    private InfinityLogoView mLogoInfinity;
    private LinearLayout mLayoutProcessingMode;
    private LinearLayout mExpandedCard;
    private EditText mInputText;
    private ImageButton mBtnScan;
    private ImageButton mBtnMic;
    private TextView mTextResponseBody;

    public AssistantSession(Context context) {
        super(context);
    }

    @Override
    public View onCreateContentView() {
        // Ensure transparent system bars and no layout overlapping
        getWindow().getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
        );
        getWindow().getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);

        ContextThemeWrapper themedContext = new ContextThemeWrapper(getContext(), R.style.AppTheme_NoActionBar);
        LayoutInflater inflater = LayoutInflater.from(themedContext);
        mRootView = inflater.inflate(R.layout.assistant_overlay, null);

        mInsetsContainer = mRootView.findViewById(R.id.assistant_insets_container);
        mRgbEdgeView = mRootView.findViewById(R.id.rgb_edge_view);
        mLogoInfinity = mRootView.findViewById(R.id.logo_infinity);

        mLayoutProcessingMode = mRootView.findViewById(R.id.layout_processing_mode);
        mExpandedCard = mRootView.findViewById(R.id.expanded_card);
        mInputText = mRootView.findViewById(R.id.input_text);

        mBtnScan = mRootView.findViewById(R.id.btn_scan);
        mBtnMic = mRootView.findViewById(R.id.btn_mic);
        mTextResponseBody = mRootView.findViewById(R.id.text_response_body);

        setupWindowInsets();
        setupDummyListeners();

        return mRootView;
    }

    private void setupWindowInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(mInsetsContainer, (v, insets) -> {
            int bottomInset = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.ime()).bottom;
            int topInset = insets.getInsets(WindowInsetsCompat.Type.systemBars()).top;

            // Add extra 16dp margin from the bottom navigation bar / keyboard
            float density = getContext().getResources().getDisplayMetrics().density;
            int bottomMargin = (int) (16 * density);

            v.setPadding(v.getPaddingLeft(), topInset, v.getPaddingRight(), bottomInset + bottomMargin);
            return insets;
        });
    }

    private void setupDummyListeners() {
        mBtnMic.setOnClickListener(v -> triggerProcessingState());

        mInputText.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_SEND ||
                (event != null && event.getKeyCode() == KeyEvent.KEYCODE_ENTER && event.getAction() == KeyEvent.ACTION_DOWN)) {
                triggerProcessingState();
                return true;
            }
            return false;
        });
    }

    private void setButtonsEnabled(boolean enabled) {
        if (mBtnScan != null) mBtnScan.setEnabled(enabled);
        if (mBtnMic != null) mBtnMic.setEnabled(enabled);
    }

    private void triggerProcessingState() {
        // Show processing state and trigger edge animation
        mInputText.setVisibility(View.GONE);
        mLayoutProcessingMode.setVisibility(View.VISIBLE);
        setButtonsEnabled(false);
        mExpandedCard.setVisibility(View.GONE);

        if (mRgbEdgeView != null) {
            mRgbEdgeView.startAnimation();
        }

        // Simulate 2 second delay
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            // Restore input pill to normal
            mLayoutProcessingMode.setVisibility(View.GONE);
            mInputText.setVisibility(View.VISIBLE);
            setButtonsEnabled(true);
            mInputText.setText("");

            // Show expanded card and render markdown
            mExpandedCard.setVisibility(View.VISIBLE);

            String dummyMarkdown = "Hello! I am **Loki**. How can I help you today?\n\n* I can answer questions.\n* I can scan your context.";
            Markwon markwon = Markwon.create(getContext());
            markwon.setMarkdown(mTextResponseBody, dummyMarkdown);

        }, 2000);
    }

    @Override
    public void onShow(Bundle args, int showFlags) {
        super.onShow(args, showFlags);
        // Reset state on show
        if (mInputText != null) {
            mInputText.setVisibility(View.VISIBLE);
            mLayoutProcessingMode.setVisibility(View.GONE);
            setButtonsEnabled(true);
            mExpandedCard.setVisibility(View.GONE);
            mInputText.setText("");
        }

        // Always trigger edge animation when first opened
        if (mRgbEdgeView != null) {
            mRgbEdgeView.startAnimation();
        }
    }
}
