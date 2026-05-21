#!/bin/bash
# EAS Build Pre-Install Hook for Monorepo
# This script runs before npm install in the EAS Build environment

echo "Running EAS Build pre-install hook..."

# Install root dependencies to ensure workspace packages are linked
cd ..
npm install --legacy-peer-deps

echo "Root dependencies installed successfully"
