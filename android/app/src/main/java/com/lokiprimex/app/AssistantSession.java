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
import android.view.MotionEvent;
import android.view.VelocityTracker;
import android.widget.TextView;
import android.widget.FrameLayout;

import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import io.noties.markwon.Markwon;

public class AssistantSession extends VoiceInteractionSession {

    private View mRootView;
    private FrameLayout mInsetsContainer;
    private LinearLayout mUnifiedBottomSheet;
    private VibrantGlowView mRgbEdgeView;
    private LinearLayout mLayoutProcessingMode;
    private LinearLayout mExpandedCard;
    private EditText mInputText;
    private ImageButton mBtnAdd;
    private ImageButton mBtnScan;
    private ImageButton mBtnMic;
    private TextView mTextResponseBody;

    private float mInitialTouchY;
    private float mInitialTranslationY;
    private VelocityTracker mVelocityTracker;
    private boolean mIsDragging = false;

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
        mInputText = mRootView.findViewById(R.id.input_text);

        mBtnAdd = mRootView.findViewById(R.id.btn_add);
        mBtnScan = mRootView.findViewById(R.id.btn_scan);
        mBtnMic = mRootView.findViewById(R.id.btn_mic);
        mTextResponseBody = mRootView.findViewById(R.id.text_response_body);

        setupWindowInsets();
        setupDummyListeners();
        setupDragToDismiss();

        return mRootView;
    }

    private void setupWindowInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(mInsetsContainer, (v, insets) -> {
            int bottomInset = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.ime()).bottom;
            int topInset = insets.getInsets(WindowInsetsCompat.Type.systemBars()).top;

            v.setPadding(v.getPaddingLeft(), topInset, v.getPaddingRight(), bottomInset);
            return insets;
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
        if (mUnifiedBottomSheet != null) {
            mUnifiedBottomSheet.setTranslationY(0f);
        }

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

    @Override
    public void onHide() {
        super.onHide();
        if (mRgbEdgeView != null) {
            mRgbEdgeView.stopAnimation();
        }
    }
}
