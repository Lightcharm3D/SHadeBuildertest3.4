package com.lightcharm.shadebuilder;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Handle the splash screen transition
        androidx.core.splashscreen.SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        
        // Optional: Make the app content appear behind system bars for a more immersive feel
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}