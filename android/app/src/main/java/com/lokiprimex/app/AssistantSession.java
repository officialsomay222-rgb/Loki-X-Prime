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
import android.text.TextWatcher;
import android.text.Editable;
import android.view.inputmethod.InputMethodManager;

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
    private TextView mTextResponseBody;

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
        mExpandedCard.setVisibility(View.GONE);

        if (mRgbEdgeView != null) {
            mRgbEdgeView.startAnimation();
        }

        // Simulate 2 second delay
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            // Restore input pill to normal
            mLayoutProcessingMode.setVisibility(View.GONE);
            mStateIdlePill.setVisibility(View.VISIBLE);
            setButtonsEnabled(true);
            mInputPillText.setText("");
            mInputCardText.setText("");

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
    }

    @Override
    public void onHide() {
        super.onHide();
        if (mRgbEdgeView != null) {
            mRgbEdgeView.stopAnimation();
        }
    }
}
