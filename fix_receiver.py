with open('android/app/src/main/java/com/lokiprimex/app/AssistantSession.java', 'r') as f:
    content = f.read()

imports = """import androidx.core.content.ContextCompat;
import android.content.BroadcastReceiver;"""

content = content.replace("import android.content.BroadcastReceiver;", imports)

receiver_call = "ContextCompat.registerReceiver(getContext(), mResponseReceiver, filter, ContextCompat.RECEIVER_EXPORTED);"
content = content.replace("getContext().registerReceiver(mResponseReceiver, filter, Context.RECEIVER_EXPORTED);", receiver_call)

with open('android/app/src/main/java/com/lokiprimex/app/AssistantSession.java', 'w') as f:
    f.write(content)
