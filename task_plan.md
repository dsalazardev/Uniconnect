# Task Plan: deploy-frontend-amplify

## 1. Create `amplify.yml`

- [x] 1.1 Create `amplify.yml` at the repository root with `appRoot: Frontend/Frontend-web`, preBuild (npm ci + shared build), build command, artifacts, and cache configuration
- [x] 1.2 Verify the file structure matches the design spec: version, applications array, appRoot, frontend phases, artifacts baseDirectory, cache paths

## 2. Configure Amplify Console

- [ ] 2.1 In the Amplify Console, verify that the build settings detect `amplify.yml` from the repo (no manual override needed)
- [ ] 2.2 Set environment variables in Amplify Console: `VITE_API_URL`, `VITE_WEBSOCKET_URL`, and Auth0 variables (helper script created at `scripts/setup-amplify-env.sh`)

## 3. Validate deployment

- [ ] 3.1 Push the `amplify.yml` commit to GitHub and trigger an Amplify build
- [ ] 3.2 Confirm the build log shows: shared package builds first, then web app, then artifact published from `Frontend/Frontend-web/dist/`
- [ ] 3.3 Verify the deployed site loads correctly at the Amplify domain
