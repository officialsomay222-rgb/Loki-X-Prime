package com.lokiprimex.app;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Shader;
import android.util.AttributeSet;
import android.view.View;
import android.view.animation.DecelerateInterpolator;

public class RgbEdgeAnimationView extends View {

    private Paint mPaint;
    private ValueAnimator mAlphaAnimator;
    private int mCurrentAlpha = 0;

    // Thickness of the edge border
    private static final float EDGE_THICKNESS = 16f; // DP? Will scale in draw

    public RgbEdgeAnimationView(Context context) {
        super(context);
        init();
    }

    public RgbEdgeAnimationView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    private void init() {
        mPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        mPaint.setStyle(Paint.Style.STROKE);
    }

    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        super.onSizeChanged(w, h, oldw, oldh);

        // Gemini style colors (Cyan, Magenta, Purple, Blueish)
        int[] colors = {
            Color.parseColor("#00f0ff"), // Cyan
            Color.parseColor("#bd00ff"), // Purple
            Color.parseColor("#ff00ff"), // Magenta
            Color.parseColor("#00f0ff")  // Cyan again for seamless loop
        };
        float[] positions = {0f, 0.33f, 0.66f, 1f};

        LinearGradient gradient = new LinearGradient(0, 0, w, h, colors, positions, Shader.TileMode.MIRROR);
        mPaint.setShader(gradient);

        float density = getResources().getDisplayMetrics().density;
        mPaint.setStrokeWidth(EDGE_THICKNESS * density);
    }

    public void startAnimation() {
        if (mAlphaAnimator != null && mAlphaAnimator.isRunning()) {
            mAlphaAnimator.cancel();
        }

        // Fade in quickly, hold, then fade out over ~8-10 seconds
        mAlphaAnimator = ValueAnimator.ofInt(0, 255, 255, 255, 128, 0);
        mAlphaAnimator.setDuration(8000); // 8 seconds total
        mAlphaAnimator.setInterpolator(new DecelerateInterpolator());
        mAlphaAnimator.addUpdateListener(animation -> {
            mCurrentAlpha = (int) animation.getAnimatedValue();
            invalidate();
        });
        mAlphaAnimator.start();
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        if (mAlphaAnimator != null) {
            mAlphaAnimator.cancel();
        }
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        if (mCurrentAlpha <= 0) return;

        mPaint.setAlpha(mCurrentAlpha);

        float density = getResources().getDisplayMetrics().density;
        float halfStroke = (EDGE_THICKNESS * density) / 2f;

        int w = getWidth();
        int h = getHeight();

        // Draw glow border at the very edges of the view
        canvas.drawRect(halfStroke, halfStroke, w - halfStroke, h - halfStroke, mPaint);
    }
}
