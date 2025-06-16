#!/bin/bash

# CRITICAL: Remove postcss.config.cjs that's blocking CSS loading
echo "🚨 REMOVING postcss.config.cjs - CSS LOADING BLOCKER"
echo "=================================================="

if [ -f "postcss.config.cjs" ]; then
    echo "❌ FOUND THE CSS BLOCKER: postcss.config.cjs"
    echo "This file conflicts with postcss.config.js and prevents ALL CSS loading!"
    
    rm -f postcss.config.cjs
    
    if [ ! -f "postcss.config.cjs" ]; then
        echo "✅ SUCCESS: Removed postcss.config.cjs"
        echo "CSS should now load properly!"
    else
        echo "❌ FAILED to remove postcss.config.cjs"
        exit 1
    fi
else
    echo "✅ postcss.config.cjs not found - good!"
fi

echo ""
echo "Remaining PostCSS config:"
ls -la postcss.config.* 2>/dev/null || echo "No postcss configs found"

echo ""
echo "🔥 CSS CONFLICT RESOLVED!"
echo "Now implementing Google Drive workflow..."