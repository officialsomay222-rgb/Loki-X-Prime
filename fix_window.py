with open('android/app/src/main/java/com/lokiprimex/app/AssistantSession.java', 'r') as f:
    content = f.read()

# Make sure WindowInsets are implemented!
# Check setupWindowInsets
if "setupWindowInsets()" not in content:
    print("WARNING: setupWindowInsets not found.")
else:
    print("setupWindowInsets found!")

# Check TextWatcher
if "setupDualStateLogic" in content and "textSyncWatcher" in content:
    print("DualState logic and textSyncWatcher found!")
