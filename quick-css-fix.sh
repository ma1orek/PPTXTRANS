#!/bin/bash

# QUICK CSS FIX - Błyskawiczna naprawa @import w Tailwind v4
echo "⚡ QUICK CSS FIX - Naprawa Tailwind v4 @import"

# Sprawdź czy globals.css istnieje
if [ ! -f "styles/globals.css" ]; then
    echo "❌ Nie znaleziono styles/globals.css"
    exit 1
fi

# Backup
cp styles/globals.css styles/globals.css.backup

# Napraw CSS - zamień stare @import na nowe @tailwind
sed -i.bak "s/@import 'tailwindcss\/base';/@tailwind base;/g" styles/globals.css
sed -i.bak "s/@import 'tailwindcss\/components';/@tailwind components;/g" styles/globals.css
sed -i.bak "s/@import 'tailwindcss\/utilities';/@tailwind utilities;/g" styles/globals.css

# Cleanup
rm -f styles/globals.css.bak
rm -f postcss.config.cjs 2>/dev/null

echo "✅ globals.css naprawiony!"
echo "🔄 Testing build..."

# Test build
npm run build:simple

if [ $? -eq 0 ]; then
    echo "🎉 SUCCESS! Build working!"
    echo ""
    echo "To deploy:"
    echo "  git add ."
    echo "  git commit -m 'Fix: Tailwind v4 CSS imports'"
    echo "  git push"
else
    echo "❌ Build failed - check for other issues"
fi