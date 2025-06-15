#!/bin/bash

# PPTX Translator Pro - One-Click Online Deployment
# This script will deploy your app to the internet in minutes

echo "🚀 PPTX Translator Pro - Online Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_highlight() {
    echo -e "${PURPLE}[HIGHLIGHT]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check git
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

print_success "All prerequisites are installed"

# Install dependencies
print_status "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

# Build the application
print_status "Building application for production..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Failed to build application"
    exit 1
fi

print_success "Application built successfully"

# Check build size
DIST_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
print_status "Build size: $DIST_SIZE"

# Deployment options
echo ""
print_highlight "🌐 CHOOSE DEPLOYMENT OPTION:"
echo "1. Vercel (Recommended - Free, Fast, Auto-updates)"
echo "2. Netlify (Free, Drag & Drop)"
echo "3. GitHub Pages (Free, Requires GitHub repo)"
echo "4. Show manual instructions"
echo ""

read -p "Select option (1-4): " choice

case $choice in
    1)
        print_status "🚀 Deploying to Vercel..."
        echo ""
        print_highlight "VERCEL DEPLOYMENT STEPS:"
        echo "1. Go to https://vercel.com"
        echo "2. Sign up/login with GitHub"
        echo "3. Click 'New Project'"
        echo "4. Connect your GitHub repo"
        echo "5. Click 'Deploy'"
        echo ""
        print_warning "First, you need to push your code to GitHub:"
        echo ""
        
        # Check if git repo exists
        if [ ! -d ".git" ]; then
            print_status "Initializing Git repository..."
            git init
            git add .
            git commit -m "Initial commit - PPTX Translator Pro"
            git branch -M main
            
            echo ""
            print_highlight "📋 NEXT STEPS:"
            echo "1. Create a new repository on GitHub"
            echo "2. Run: git remote add origin https://github.com/YOUR_USERNAME/pptx-translator-pro.git"
            echo "3. Run: git push -u origin main"
            echo "4. Go to vercel.com and deploy"
            echo ""
        else
            print_status "Git repository detected, pushing to main..."
            git add .
            git commit -m "Deploy: $(date)"
            
            # Try to push
            if git push origin main 2>/dev/null; then
                print_success "Code pushed to GitHub"
                print_highlight "✅ Now go to vercel.com to deploy!"
            else
                print_warning "Please set up GitHub remote and push manually"
                echo "git remote add origin https://github.com/YOUR_USERNAME/pptx-translator-pro.git"
                echo "git push -u origin main"
            fi
        fi
        
        print_highlight "🎯 YOUR APP WILL BE LIVE AT: https://pptx-translator-pro.vercel.app"
        ;;
        
    2)
        print_status "🚀 Preparing for Netlify deployment..."
        echo ""
        print_highlight "NETLIFY DEPLOYMENT STEPS:"
        echo "1. Go to https://netlify.com"
        echo "2. Sign up/login"
        echo "3. Drag and drop the 'dist' folder to the deploy area"
        echo "4. Your app will be live instantly!"
        echo ""
        print_success "Your 'dist' folder is ready for deployment"
        print_highlight "📁 Drag the 'dist' folder to netlify.com"
        
        # Open dist folder if on macOS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open dist
        fi
        ;;
        
    3)
        print_status "🚀 Preparing for GitHub Pages..."
        
        # Install gh-pages if needed
        if ! npm list gh-pages &>/dev/null; then
            print_status "Installing gh-pages..."
            npm install --save-dev gh-pages
        fi
        
        print_status "Deploying to GitHub Pages..."
        npm run deploy 2>/dev/null || {
            print_warning "Please add the following to your package.json scripts:"
            echo '"predeploy": "npm run build",'
            echo '"deploy": "gh-pages -d dist"'
            echo ""
            echo "Then run: npm run deploy"
        }
        
        print_highlight "🎯 YOUR APP WILL BE LIVE AT: https://YOUR_USERNAME.github.io/pptx-translator-pro"
        ;;
        
    4)
        print_highlight "📋 MANUAL DEPLOYMENT INSTRUCTIONS:"
        echo ""
        echo "🔥 OPTION 1 - Vercel (Easiest):"
        echo "   1. Push code to GitHub"
        echo "   2. Go to vercel.com"
        echo "   3. Connect GitHub repo"
        echo "   4. Click Deploy"
        echo ""
        echo "🔥 OPTION 2 - Netlify (Drag & Drop):"
        echo "   1. Go to netlify.com"
        echo "   2. Drag 'dist' folder to site"
        echo "   3. App is live!"
        echo ""
        echo "🔥 OPTION 3 - GitHub Pages:"
        echo "   1. npm install --save-dev gh-pages"
        echo "   2. Add deploy script to package.json"
        echo "   3. npm run deploy"
        echo ""
        ;;
        
    *)
        print_error "Invalid option selected"
        exit 1
        ;;
esac

echo ""
print_success "🎉 DEPLOYMENT PREPARATION COMPLETE!"
echo ""
print_highlight "📊 YOUR APP FEATURES:"
echo "✅ Works on all devices (mobile, tablet, desktop)"
echo "✅ Progressive Web App (PWA) - installable"
echo "✅ Offline functionality"
echo "✅ Google APIs integration"
echo "✅ Supports files up to 100MB"
echo "✅ Translates to 12+ languages"
echo "✅ Preserves PowerPoint formatting"
echo ""

print_highlight "🔗 SHARE YOUR APP:"
echo "Once deployed, share this link with users:"
echo "https://your-app-name.vercel.app"
echo ""

print_highlight "💡 PRO TIPS:"
echo "• Users can 'install' your app like a native app"
echo "• It works offline after first load"
echo "• Automatic updates when you push to GitHub"
echo "• Free SSL certificate included"
echo "• Global CDN for fast loading worldwide"
echo ""

print_success "🚀 Your PPTX Translator Pro is ready for the world!"

exit 0