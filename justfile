# PersonalOS Build Commands

# Install dependencies
install:
    npm install

# Build the app to /docs directory
build:
    npm run build
    @echo "Copying static assets..."
    @mkdir -p docs
    @cp manifest.json docs/ 2>/dev/null || true
    @cp icon-*.png docs/ 2>/dev/null || true
    @cp icon-maskable-*.png docs/ 2>/dev/null || true
    @echo "Build complete! Output in /docs directory"
    @echo "You can now deploy the /docs directory"

# Development server
dev:
    npm run dev

# Preview production build
preview:
    npm run preview

# Clean build artifacts
clean:
    rm -rf docs node_modules .vite

