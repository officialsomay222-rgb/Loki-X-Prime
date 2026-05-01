package com.lokiprimex.app;

import android.animation.AnimatorSet;
import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
import android.content.Context;
import android.util.AttributeSet;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.LinearLayout;

public class BouncingDotsLoader extends LinearLayout {

    private View mDot1, mDot2, mDot3;
    private AnimatorSet mAnimatorSet;

    public BouncingDotsLoader(Context context) {
        super(context);
        init();
    }

    public BouncingDotsLoader(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    private void init() {
        LayoutInflater.from(getContext()).inflate(R.layout.bouncing_dots_loader, this, true);
        mDot1 = findViewById(R.id.dot1);
        mDot2 = findViewById(R.id.dot2);
        mDot3 = findViewById(R.id.dot3);
    }

    public void startAnimation() {
        if (mAnimatorSet != null && mAnimatorSet.isRunning()) {
            return;
        }

        long duration = 400;
        float translationY = -20f;

        ObjectAnimator anim1 = ObjectAnimator.ofFloat(mDot1, "translationY", 0f, translationY, 0f);
        anim1.setRepeatCount(ValueAnimator.INFINITE);
        anim1.setDuration(duration);

        ObjectAnimator anim2 = ObjectAnimator.ofFloat(mDot2, "translationY", 0f, translationY, 0f);
        anim2.setRepeatCount(ValueAnimator.INFINITE);
        anim2.setDuration(duration);
        anim2.setStartDelay(100);

        ObjectAnimator anim3 = ObjectAnimator.ofFloat(mDot3, "translationY", 0f, translationY, 0f);
        anim3.setRepeatCount(ValueAnimator.INFINITE);
        anim3.setDuration(duration);
        anim3.setStartDelay(200);

        mAnimatorSet = new AnimatorSet();
        mAnimatorSet.playTogether(anim1, anim2, anim3);
        mAnimatorSet.start();
    }

    public void stopAnimation() {
        if (mAnimatorSet != null) {
            mAnimatorSet.cancel();
        }
        mDot1.setTranslationY(0);
        mDot2.setTranslationY(0);
        mDot3.setTranslationY(0);
    }
}
