#!/bin/bash

# 🔧 PPTX Translator Pro - Git Issues Fix Script
# Automatyczne rozwiązanie problemów z git configuration

echo "🔧 Fixing Git Issues..."
echo "⏰ Time: $(date '+%H:%M')"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Configure Git User
print_status "Step 1: Configuring Git user..."

read -p "Enter your email (e.g., ma1orek@gmail.com): " USER_EMAIL
read -p "Enter your name (e.g., ma1orek): " USER_NAME

git config --global user.email "$USER_EMAIL"
git config --global user.name "$USER_NAME"

print_success "Git user configured:"
echo "  Email: $(git config --global user.email)"
echo "  Name: $(git config --global user.name)"
echo ""

# Step 2: Fix Remote Origin
print_status "Step 2: Fixing remote origin..."

# Remove existing origin if it exists
git remote remove origin 2>/dev/null || true

# Add correct origin
git remote add origin https://github.com/ma1orek/PPTXTRANS.git

print_success "Remote origin configured:"
git remote -v
echo ""

# Step 3: Commit and Push
print_status "Step 3: Committing and pushing to GitHub..."

# Add all files
git add .

# Create commit
git commit -m "🚀 PPTX Translator Pro - Initial Release"

if [ $? -eq 0 ]; then
    print_success "Commit created successfully"
else
    print_error "Failed to create commit"
    exit 1
fi

# Ensure we're on main branch
git branch -M main

# Push to GitHub
print_status "Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    print_success "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🎉 Your repository is now available at:"
    echo "   https://github.com/ma1orek/PPTXTRANS"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Go to netlify.com"
    echo "2. Click 'New site from Git'"
    echo "3. Connect GitHub and select 'PPTXTRANS' repo"
    echo "4. Deploy settings:"
    echo "   - Build command: npm run build"
    echo "   - Publish directory: dist"
    echo "5. Click 'Deploy site'"
    echo ""
    print_success "All Git issues fixed! 🚀"
else
    print_error "Failed to push to GitHub"
    echo ""
    echo "🔧 Try manual fix:"
    echo "git push -u origin main --force"
    echo ""
    echo "Or check if you need Personal Access Token:"
    echo "GitHub → Settings → Developer settings → Personal access tokens"
fi