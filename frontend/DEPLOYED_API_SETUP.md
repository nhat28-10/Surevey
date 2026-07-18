# Deployed API setup

This frontend can call the three Render services directly.

Environment variables:

```env
VITE_API_GATEWAY_URL=
VITE_USER_API_URL=https://suresurvey-user-service.onrender.com
VITE_SURVEY_API_URL=https://suresurvey-survey-service.onrender.com
VITE_WALLET_API_URL=https://suresurvey-wallet-service.onrender.com
```

The existing API files may continue to use gateway-style logical paths such as
`/user/api/user/login`, `/survey/api/campaigns`, and `/wallet/api/wallet`.
`httpClient.ts` selects the correct service and removes only the logical service prefix
before sending the request.

Examples:

- `/user/api/user/login` -> `https://suresurvey-user-service.onrender.com/api/user/login`
- `/survey/api/campaigns/my` -> `https://suresurvey-survey-service.onrender.com/api/campaigns/my`
- `/wallet/api/wallet` -> `https://suresurvey-wallet-service.onrender.com/api/wallet`

For browser access, each Render service must include the frontend origin in its
`Cors__AllowedOrigins__*` environment variables.

## Render static site SPA refresh

Because the frontend uses React Router with browser URLs, Render must rewrite
all non-file paths back to `index.html`. Otherwise refreshing paths such as
`/admin`, `/customer/dashboard`, or `/collaborator/marketplace` returns
`Not Found`.

If the frontend is managed by `render.yaml`, keep this route:

```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

If the frontend was created manually in the Render Dashboard, add the same rule
under **Redirects/Rewrites**:

- Source Path: `/*`
- Destination Path: `/index.html`
- Action: `Rewrite`
