#!/bin/bash
# INSTANT TERSER FIX - Resolves Vite build minification error
# Run this if you get: "[vite:terser] terser not found" error

echo "🔧 INSTANT TERSER FIX - Resolving Vite minification error..."
echo "   This fixes: [vite:terser] terser not found error"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: No package.json found. Please run this in your project root directory.${NC}"
    exit 1
fi

# Show current terser status
echo "🔍 Checking current terser installation..."
if npm list terser --depth=0 &>/dev/null; then
    echo -e "${GREEN}✅ Terser is already installed${NC}"
else
    echo -e "${YELLOW}⚠️  Terser not found - will install now${NC}"
fi

echo ""
echo "📦 Installing terser dependency..."

# Install terser
npm install --save-dev terser@^5.24.0

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Terser installed successfully!${NC}"
else
    echo -e "${RED}❌ Failed to install terser${NC}"
    exit 1
fi

echo ""
echo "🧪 Testing build process..."

# Test build
npm run build:simple

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 SUCCESS! Build completed successfully!${NC}"
    echo ""
    echo "📋 Summary:"
    echo "   ✅ Terser minifier installed"
    echo "   ✅ Production build working"
    echo "   ✅ Ready for deployment"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Commit these changes: git add . && git commit -m 'Add terser dependency'"
    echo "   2. Push to trigger new deployment: git push"
    echo "   3. Check Netlify build logs for success"
else
    echo ""
    echo -e "${YELLOW}⚠️  Build still has issues. Check error messages above.${NC}"
    echo ""
    echo "🔧 Common solutions:"
    echo "   • Check for TypeScript errors: npm run build"
    echo "   • Clear node_modules: rm -rf node_modules && npm install"
    echo "   • Verify all dependencies: npm audit fix"
fi

echo ""
echo "🏁 Terser fix complete!"