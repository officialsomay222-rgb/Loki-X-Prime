package com.lokiprimex.app;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.service.voice.VoiceInteractionSession;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.TextView;

import io.noties.markwon.Markwon;

public class AssistantSession extends VoiceInteractionSession {

    private View mRootView;
    private LinearLayout mLayoutProcessingMode;
    private LinearLayout mExpandedCard;
    private EditText mInputText;
    private ImageButton mBtnAdd;
    private ImageButton mBtnScan;
    private ImageButton mBtnMic;
    private ImageButton mBtnSparkle;
    private TextView mTextResponseBody;

    public AssistantSession(Context context) {
        super(context);
    }

    @Override
    public View onCreateContentView() {
        LayoutInflater inflater = LayoutInflater.from(getContext());
        mRootView = inflater.inflate(R.layout.assistant_overlay, null);

        mLayoutProcessingMode = mRootView.findViewById(R.id.layout_processing_mode);
        mExpandedCard = mRootView.findViewById(R.id.expanded_card);
        mInputText = mRootView.findViewById(R.id.input_text);

        mBtnAdd = mRootView.findViewById(R.id.btn_add);
        mBtnScan = mRootView.findViewById(R.id.btn_scan);
        mBtnMic = mRootView.findViewById(R.id.btn_mic);
        mBtnSparkle = mRootView.findViewById(R.id.btn_sparkle);
        mTextResponseBody = mRootView.findViewById(R.id.text_response_body);

        setupDummyListeners();

        return mRootView;
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
        mBtnAdd.setEnabled(enabled);
        mBtnScan.setEnabled(enabled);
        mBtnMic.setEnabled(enabled);
        mBtnSparkle.setEnabled(enabled);
    }

    private void triggerProcessingState() {
        // Show processing state
        mInputText.setVisibility(View.GONE);
        mLayoutProcessingMode.setVisibility(View.VISIBLE);
        setButtonsEnabled(false);
        mExpandedCard.setVisibility(View.GONE);

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
    }
}
