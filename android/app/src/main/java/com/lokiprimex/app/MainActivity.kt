package com.lokiprimex.app

import android.Manifest
import android.annotation.SuppressLint
import android.annotation.TargetApi
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.enableEdgeToEdge
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private val FILE_CHOOSER_RESULT_CODE = 1

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge() // Makes app full screen (under system bars)
        super.onCreate(savedInstanceState)

        requestAudioPermissions()

        webView = WebView(this).apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                useWideViewPort = true
                setSupportZoom(false)
                allowFileAccess = true
                allowContentAccess = true
                mediaPlaybackRequiresUserGesture = false
            }

            // 1. Force Hardware Rendering
            setLayerType(View.LAYER_TYPE_HARDWARE, null)

            // 2. Kill Web Overscroll Bounce
            overScrollMode = View.OVER_SCROLL_NEVER

            // 3. Inject Native Bridge
            addJavascriptInterface(WebAppInterface(this@MainActivity), "AndroidNative")

            webViewClient = WebViewClient()
            webChromeClient = object : WebChromeClient() {
                // Grant permissions automatically
                @TargetApi(Build.VERSION_CODES.LOLLIPOP)
                override fun onPermissionRequest(request: PermissionRequest) {
                    request.grant(request.resources)
                }

                // Handle file uploads
                override fun onShowFileChooser(
                    webView: WebView?,
                    filePathCallback: ValueCallback<Array<Uri>>?,
                    fileChooserParams: FileChooserParams?
                ): Boolean {
                    if (fileUploadCallback != null) {
                        fileUploadCallback?.onReceiveValue(null)
                        fileUploadCallback = null
                    }

                    fileUploadCallback = filePathCallback

                    val intent = fileChooserParams?.createIntent()
                    try {
                        startActivityForResult(intent, FILE_CHOOSER_RESULT_CODE)
                    } catch (e: Exception) {
                        fileUploadCallback = null
                        return false
                    }

                    return true
                }
            }
            loadUrl("https://loki-x-prime.vercel.app") // <-- CHANGE THIS TO YOUR LINK
        }

        setContentView(webView)
        setupKeyboardInsets()
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            if (fileUploadCallback == null) {
                super.onActivityResult(requestCode, resultCode, data)
                return
            }

            var results: Array<Uri>? = null
            if (resultCode == Activity.RESULT_OK) {
                if (data != null) {
                    val dataString = data.dataString
                    if (dataString != null) {
                        results = arrayOf(Uri.parse(dataString))
                    }
                }
            }

            fileUploadCallback?.onReceiveValue(results)
            fileUploadCallback = null
        } else {
            super.onActivityResult(requestCode, resultCode, data)
        }
    }

    private fun requestAudioPermissions() {
        val permissions = mutableListOf<String>()
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.RECORD_AUDIO)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
             if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.READ_MEDIA_IMAGES)
            }
        } else {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.READ_EXTERNAL_STORAGE)
            }
        }

        if (permissions.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, permissions.toTypedArray(), 101)
        }
    }

    private fun setupKeyboardInsets() {
        WindowCompat.setDecorFitsSystemWindows(window, false)

        webView.setOnApplyWindowInsetsListener { view, insets ->
            val ime = insets.getInsets(WindowInsetsCompat.Type.ime())
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())

            // Dynamically pad the WebView when keyboard opens
            view.updatePadding(
                bottom = ime.bottom,
                top = systemBars.top
            )
            insets
        }
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING)
    }
}

// The Native Bridge Class
class WebAppInterface(private val mContext: Context) {
    @JavascriptInterface
    fun showToast(message: String) {
        Toast.makeText(mContext, message, Toast.LENGTH_SHORT).show()
    }
}
