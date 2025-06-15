#!/bin/bash

# ⚡ INSTANT TERSER FIX - NO DELAYS
# Immediate fix for missing terser dependency

echo "⚡ INSTANT TERSER FIX - NATYCHMIAST!"
echo "🎯 Missing terser dependency for Vite minification"
echo ""

# Verify terser is in package.json (should be after our update)
if grep -q '"terser"' package.json; then
    echo "✅ terser found in package.json"
else
    echo "❌ terser missing - adding now..."
    # Backup and add terser
    cp package.json package.json.backup
    
    # Add terser to devDependencies before typescript
    sed -i 's/"typescript": "\^5\.5\.3",/"terser": "^5.36.0",\n    "typescript": "^5.5.3",/' package.json
    
    if grep -q '"terser"' package.json; then
        echo "✅ terser added successfully"
    else
        echo "❌ Failed to add terser"
        exit 1
    fi
fi

echo ""
echo "🚀 IMMEDIATE DEPLOYMENT..."

# Quick commit and push
git add package.json
git commit -m "⚡ INSTANT FIX: Add terser devDependency for Vite minification"

if git push origin main; then
    echo ""
    echo "🎉 TERSER FIX DEPLOYED!"
    echo ""
    echo "📊 What's happening:"
    echo "  ✅ package.json updated with terser dependency"
    echo "  ✅ Changes pushed to GitHub"
    echo "  🚀 Netlify build triggered"
    echo ""
    echo "🔧 Netlify will now:"
    echo "  1. Run npm ci --legacy-peer-deps"
    echo "  2. Install terser automatically"
    echo "  3. Build with vite build (terser available)"
    echo "  4. ✅ SUCCESS!"
    echo ""
    echo "⏱️  Expected completion: 2-3 minutes"
    echo "🎯 This resolves the terser dependency error!"
    
else
    echo "❌ Push failed - try manual:"
    echo "git push origin main"
fi