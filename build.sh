#!/bin/bash

# Roam Depot build script
# This runs in GitHub Actions when your extension is submitted

echo "🚀 Building Subjournals Extension..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Clean any existing build
echo "🧹 Cleaning previous build..."
npm run clean

# Build the extension
echo "🔨 Building extension..."
npm run build

# Check if build was successful
if [ -f "extension.js" ]; then
    echo "✅ Build successful! extension.js created"
    echo "📊 File size: $(du -h extension.js | cut -f1)"
else
    echo "❌ Build failed! extension.js not found"
    exit 1
fi

echo "🎉 Build complete!"
