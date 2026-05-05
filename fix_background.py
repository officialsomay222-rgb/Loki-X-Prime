with open('android/app/src/main/res/layout/assistant_overlay.xml', 'r') as f:
    content = f.read()

# Add strictly transparent background to root FrameLayout as per Rule 1
new_root = """<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#00000000"
    android:clipToPadding="false"
    android:clipChildren="false">"""

content = content.replace("""<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:clipToPadding="false"
    android:clipChildren="false">""", new_root)

# Check padding and margin of State 1 Container based on "Spacious Floating Pill" rules
# minHeight="64dp", layout_marginBottom="24dp", layout_marginHorizontal="16dp", paddingVertical="12dp", paddingHorizontal="16dp"

state1_old = """                <LinearLayout
                    android:id="@+id/state_idle_pill"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:orientation="horizontal"
                    android:gravity="center_vertical"
                    android:background="@drawable/bg_idle_pill"
                    android:elevation="8dp"
                    android:layout_marginBottom="16dp"
                    android:layout_marginHorizontal="16dp"
                    android:minHeight="56dp"
                    android:paddingHorizontal="4dp"
                    android:visibility="visible">"""

state1_new = """                <LinearLayout
                    android:id="@+id/state_idle_pill"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:orientation="horizontal"
                    android:gravity="center_vertical"
                    android:background="@drawable/bg_idle_pill"
                    android:elevation="8dp"
                    android:layout_marginBottom="24dp"
                    android:layout_marginHorizontal="16dp"
                    android:minHeight="64dp"
                    android:paddingVertical="12dp"
                    android:paddingHorizontal="16dp"
                    android:visibility="visible">"""

content = content.replace(state1_old, state1_new)

with open('android/app/src/main/res/layout/assistant_overlay.xml', 'w') as f:
    f.write(content)
