package com.lokiprimex.app;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Shader;
import android.util.AttributeSet;
import android.view.View;
import android.view.animation.LinearInterpolator;

public class VibrantGlowView extends View {

    private Paint mPaint;
    private ValueAnimator mAlphaAnimator;
    private ValueAnimator mShiftAnimator;

    private int mCurrentAlpha = 0;
    private float mCurrentShift = 0f;
    private Matrix mGradientMatrix;
    private LinearGradient mGradient;

    private static final float EDGE_THICKNESS = 16f; // DP

    public VibrantGlowView(Context context) {
        super(context);
        init();
    }

    public VibrantGlowView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    private void init() {
        mPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        mPaint.setStyle(Paint.Style.STROKE);
        mGradientMatrix = new Matrix();
    }

    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        super.onSizeChanged(w, h, oldw, oldh);

        int[] colors = {
            Color.parseColor("#00F2FE"), // Cyan
            Color.parseColor("#4FACFE"), // Deep Blue
            Color.parseColor("#7F00FF"), // Purple
            Color.parseColor("#E100FF"), // Magenta
            Color.parseColor("#00F2FE")  // Cyan again for seamless loop
        };
        float[] positions = {0f, 0.25f, 0.5f, 0.75f, 1f};

        // Create gradient spanning twice the width to allow seamless shifting
        mGradient = new LinearGradient(0, 0, w * 2, h * 2, colors, positions, Shader.TileMode.REPEAT);
        mPaint.setShader(mGradient);

        float density = getResources().getDisplayMetrics().density;
        mPaint.setStrokeWidth(EDGE_THICKNESS * density);
    }

    public void startAnimation() {
        cancelAnimations();

        // Breathing Alpha Animation (3000ms cycle)
        mAlphaAnimator = ValueAnimator.ofInt(0, 255, 128, 255, 0);
        mAlphaAnimator.setDuration(9000); // 3 full cycles approx, but we want it looping or just a single long play
        // Wait, the requirement says "Breathing (Alpha) cycle should be slow (around 3000ms or 3 seconds per cycle)."
        mAlphaAnimator = ValueAnimator.ofInt(100, 255);
        mAlphaAnimator.setDuration(1500); // 1.5s in, 1.5s out = 3000ms cycle
        mAlphaAnimator.setRepeatCount(ValueAnimator.INFINITE);
        mAlphaAnimator.setRepeatMode(ValueAnimator.REVERSE);
        mAlphaAnimator.addUpdateListener(animation -> {
            mCurrentAlpha = (int) animation.getAnimatedValue();
            invalidate();
        });
        mAlphaAnimator.start();

        // Color Shift/Rotation Animation (8000ms cycle)
        mShiftAnimator = ValueAnimator.ofFloat(0f, 1f);
        mShiftAnimator.setDuration(8000); // 8 seconds per full rotation
        mShiftAnimator.setRepeatCount(ValueAnimator.INFINITE);
        mShiftAnimator.setInterpolator(new LinearInterpolator());
        mShiftAnimator.addUpdateListener(animation -> {
            mCurrentShift = (float) animation.getAnimatedValue();
            invalidate();
        });
        mShiftAnimator.start();
    }

    public void stopAnimation() {
        cancelAnimations();
        mCurrentAlpha = 0;
        invalidate();
    }

    private void cancelAnimations() {
        if (mAlphaAnimator != null && mAlphaAnimator.isRunning()) {
            mAlphaAnimator.cancel();
        }
        if (mShiftAnimator != null && mShiftAnimator.isRunning()) {
            mShiftAnimator.cancel();
        }
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        cancelAnimations();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        if (mCurrentAlpha <= 0 || mGradient == null) return;

        mPaint.setAlpha(mCurrentAlpha);

        int w = getWidth();
        int h = getHeight();

        // Shift the gradient matrix
        mGradientMatrix.reset();
        // Translate diagonally or along perimeter to simulate rotation/shift
        mGradientMatrix.setTranslate(w * 2 * mCurrentShift, h * 2 * mCurrentShift);
        mGradient.setLocalMatrix(mGradientMatrix);

        float density = getResources().getDisplayMetrics().density;
        float halfStroke = (EDGE_THICKNESS * density) / 2f;

        // Draw glow border at the very edges of the view
        canvas.drawRect(halfStroke, halfStroke, w - halfStroke, h - halfStroke, mPaint);
    }
}
