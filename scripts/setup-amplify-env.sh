#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Uniconnect — Amplify Console Environment Variables
# ─────────────────────────────────────────────────────────────
# Run this AFTER connecting the repo to Amplify.
# These vars must be set in: Amplify Console → Environment variables
#
# How to use:
# 1. Go to https://console.aws.amazon.com/amplify/home
# 2. Select your app → Environment variables
# 3. Add each variable below
#
# IMPORTANT: Do NOT add these to amplify.yml — they contain secrets.
# ─────────────────────────────────────────────────────────────

echo "=== Uniconnect Web — Amplify Environment Variables ==="
echo ""
echo "Add these in the Amplify Console under your app:"
echo ""
echo "── Frontend API ──────────────────────────────────────"
echo "VITE_API_URL=https://uniconnect-backend.fly.dev/api"
echo "VITE_WEBSOCKET_URL=https://uniconnect-backend.fly.dev"
echo ""
echo "── Auth0 ─────────────────────────────────────────────"
echo "VITE_AUTH0_DOMAIN=<your-auth0-domain>"
echo "VITE_AUTH0_CLIENT_ID=<your-auth0-client-id>"
echo "VITE_AUTH0_AUDIENCE=<your-auth0-api-identifier>"
echo ""
echo "── Branch-specific overrides (optional) ─────────────"
echo "Create a 'main' branch override for production values."
echo "Create a 'develop' branch override for staging values."
