package com.lokiprimex.app;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Shader;
import android.util.AttributeSet;
import android.view.View;
import android.view.animation.LinearInterpolator;

public class InfinityLogoView extends View {

    private Paint mPaint;
    private Path mPath;
    private ValueAnimator mAnimator;
    private float mDashOffset = 0f;

    // ViewBox is 200x100
    private static final float VIEW_BOX_WIDTH = 200f;
    private static final float VIEW_BOX_HEIGHT = 100f;

    // We will scale the path to fit the actual view size
    private float mScaleX = 1f;
    private float mScaleY = 1f;
    private float mDashArrayLength = 500f; // Roughly the length of the infinity path

    public InfinityLogoView(Context context) {
        super(context);
        init();
    }

    public InfinityLogoView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public InfinityLogoView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        mPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        mPaint.setStyle(Paint.Style.STROKE);
        mPaint.setStrokeWidth(6f);
        mPaint.setStrokeCap(Paint.Cap.ROUND);
        mPaint.setStrokeJoin(Paint.Join.ROUND);

        // Define the SVG path "M50 50 C30 30, 20 50, 30 70 C40 90, 60 90, 80 70 C100 50, 120 50, 140 70 C160 90, 180 90, 170 70 C160 50, 140 30, 120 50 C100 70, 80 70, 60 50 C40 30, 30 30, 50 50"
        mPath = new Path();
        mPath.moveTo(50, 50);
        mPath.cubicTo(30, 30, 20, 50, 30, 70);
        mPath.cubicTo(40, 90, 60, 90, 80, 70);
        mPath.cubicTo(100, 50, 120, 50, 140, 70);
        mPath.cubicTo(160, 90, 180, 90, 170, 70);
        mPath.cubicTo(160, 50, 140, 30, 120, 50);
        mPath.cubicTo(100, 70, 80, 70, 60, 50);
        mPath.cubicTo(40, 30, 30, 30, 50, 50);

        // Setup the drawing animation (dash offset)
        mAnimator = ValueAnimator.ofFloat(mDashArrayLength, 0f);
        mAnimator.setDuration(4000);
        mAnimator.setRepeatCount(ValueAnimator.INFINITE);
        mAnimator.setInterpolator(new LinearInterpolator());
        mAnimator.addUpdateListener(animation -> {
            mDashOffset = (float) animation.getAnimatedValue();
            invalidate();
        });
    }

    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        super.onSizeChanged(w, h, oldw, oldh);
        mScaleX = w / VIEW_BOX_WIDTH;
        mScaleY = h / VIEW_BOX_HEIGHT;

        // Setup Rainbow Gradient (Animated feeling by using multiple stops)
        int[] colors = {
            Color.parseColor("#ff0000"),
            Color.parseColor("#ff7f00"),
            Color.parseColor("#ffff00"),
            Color.parseColor("#00ff00"),
            Color.parseColor("#00f0ff"),
            Color.parseColor("#bd00ff"),
            Color.parseColor("#ff00ff"),
            Color.parseColor("#ff0000")
        };
        float[] positions = {0f, 0.14f, 0.28f, 0.42f, 0.57f, 0.71f, 0.85f, 1f};

        LinearGradient gradient = new LinearGradient(0, 0, w, 0, colors, positions, Shader.TileMode.REPEAT);
        mPaint.setShader(gradient);

        // Scale the stroke width
        mPaint.setStrokeWidth(6f * Math.min(mScaleX, mScaleY));
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        if (mAnimator != null) {
            mAnimator.start();
        }
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        if (mAnimator != null) {
            mAnimator.cancel();
        }
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        canvas.save();
        canvas.scale(mScaleX, mScaleY);

        // We use dash path effect for drawing animation
        mPaint.setPathEffect(new android.graphics.DashPathEffect(new float[]{mDashArrayLength, mDashArrayLength}, mDashOffset));

        // Add a simple glow effect (hardware acceleration friendly)
        mPaint.setShadowLayer(5f, 0f, 0f, Color.parseColor("#bd00ff"));

        canvas.drawPath(mPath, mPaint);

        canvas.restore();

        // For the rainbow shift effect, we could translate the matrix of the shader, but since
        // the dash offset moves the visible stroke over the stationary gradient, it gives a
        // cool flowing effect already without matrix translation.
    }
}
