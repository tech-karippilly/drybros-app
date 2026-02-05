# Authentication Flow Documentation

This document explains the complete authentication flow in the DryBros mobile app, including token management, refresh token handling, and session expiry.

## Overview

The mobile app implements a secure token-based authentication system with:
- **Access Token**: Short-lived token for API authorization
- **Refresh Token**: Long-lived token for obtaining new access tokens
- **Automatic Token Refresh**: Seamless token renewal on expiry
- **Session Expiry Handling**: User-friendly notifications and login redirect

## Architecture Components

### 1. Axios Client (`src/services/api/client.ts`)

Two separate axios instances:
- **`apiClient`**: Main client for all authenticated API calls
- **`refreshClient`**: Dedicated client for refresh token requests (avoids interceptor side-effects)

#### Request Interceptor
```typescript
// Automatically attaches access token to all requests
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});
```

#### Response Interceptor (Token Refresh Logic)
Handles 401 Unauthorized errors with automatic token refresh:

```
┌─────────────────────────────────────────────────────────────┐
│                     API Request Made                         │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Add Access Token to Headers                     │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Send Request                              │
└─────────────────────────────────────────────────────────────┘
                            ▼
                    ┌───────────────┐
                    │  Response OK? │
                    └───────────────┘
                      │           │
                     YES          NO (401)
                      │           │
                      ▼           ▼
               ┌──────────┐   ┌─────────────────────────────┐
               │  Return  │   │  Access Token Expired?      │
               │ Response │   │  (Check if not retry yet)    │
               └──────────┘   └─────────────────────────────┘
                                            │
                                           YES
                                            ▼
                              ┌──────────────────────────┐
                              │  Is Refresh In Progress? │
                              └──────────────────────────┘
                                    │            │
                                   YES          NO
                                    │            │
                                    ▼            ▼
                          ┌─────────────┐   ┌──────────────────┐
                          │  Queue This │   │  Start Refresh   │
                          │  Request    │   │  Process         │
                          └─────────────┘   └──────────────────┘
                                    │            │
                                    │            ▼
                                    │   ┌─────────────────────┐
                                    │   │  Get Refresh Token  │
                                    │   │  from AsyncStorage  │
                                    │   └─────────────────────┘
                                    │            │
                                    │            ▼
                                    │   ┌─────────────────────────┐
                                    │   │  Refresh Token Exists?  │
                                    │   └─────────────────────────┘
                                    │       │              │
                                    │      YES            NO
                                    │       │              │
                                    │       ▼              ▼
                                    │   ┌────────────┐   ┌─────────────┐
                                    │   │  Call      │   │  Clear Auth │
                                    │   │  Refresh   │   │  + Emit     │
                                    │   │  API       │   │  EXPIRED    │
                                    │   └────────────┘   └─────────────┘
                                    │       │
                                    │       ▼
                                    │   ┌─────────────────────┐
                                    │   │  Refresh Success?   │
                                    │   └─────────────────────┘
                                    │       │            │
                                    │      YES          NO
                                    │       │            │
                                    │       ▼            ▼
                                    │   ┌────────────┐   ┌──────────────┐
                                    │   │  Update    │   │  Clear Auth  │
                                    │   │  Tokens in │   │  + Emit      │
                                    │   │  Storage   │   │  EXPIRED     │
                                    │   └────────────┘   └──────────────┘
                                    │       │
                                    │       ▼
                                    │   ┌─────────────────┐
                                    │   │  Process Queue  │
                                    │   │  (Retry All)    │
                                    │   └─────────────────┘
                                    │       │
                                    └───────┴──────────────┐
                                                           ▼
                                            ┌──────────────────────────┐
                                            │  Retry Original Request  │
                                            │  with New Access Token   │
                                            └──────────────────────────┘
```

### 2. Auth Events (`src/services/api/authEvents.ts`)

Simple event emitter for authentication state changes:
- **`TOKEN_EXPIRED`**: Emitted when refresh token fails or is missing
- **`TOKEN_REFRESHED`**: Emitted when tokens successfully refreshed

```typescript
// Emit event when session expires
authEvents.emit('TOKEN_EXPIRED', { message: 'Refresh token expired' });

// Listen for event in AuthContext
authEvents.on('TOKEN_EXPIRED', handleTokenExpired);
```

### 3. Auth Context (`src/contexts/AuthContext.tsx`)

Manages global authentication state:
- **`isLoggedIn`**: Current authentication status
- **`sessionExpired`**: Flag to show session expiry message
- **Token Expiry Listener**: Automatically logs out and sets sessionExpired flag

```typescript
// Listen for token expiry from API client
useEffect(() => {
  const handleTokenExpired = async () => {
    disconnectDriverSocket();
    await clearAuthStorage();
    setIsLoggedIn(false);
    setSessionExpired(true);
  };
  
  authEvents.on('TOKEN_EXPIRED', handleTokenExpired);
  return () => authEvents.off('TOKEN_EXPIRED', handleTokenExpired);
}, []);
```

### 4. App Shell (`App.tsx`)

Handles UI-level session expiry notification:
- Shows toast message when `sessionExpired` is true
- Automatically redirects to login screen
- Clears session expired flag after showing message

## Complete Authentication Flow

### Login Flow

```
User enters credentials
        ▼
Call POST /drivers/login
        ▼
Backend returns:
  - accessToken
  - refreshToken
  - driver profile
        ▼
Store in AsyncStorage:
  - @drybros/auth_token (accessToken)
  - @drybros/refresh_token (refreshToken)
  - @drybros/user_data (driver profile)
        ▼
AuthContext.markLoggedIn()
        ▼
Navigate to Main App
```

### API Call Flow with Token Refresh

```
App makes API call (e.g., GET /trips/my)
        ▼
Request Interceptor adds: Authorization: Bearer <accessToken>
        ▼
Backend receives request
        │
        ├─→ Token Valid → Return data → Success ✓
        │
        └─→ Token Expired (401)
                ▼
          Response Interceptor catches 401
                ▼
          Check if refresh already in progress
                │
                ├─→ YES → Queue this request
                │
                └─→ NO → Start refresh process
                        ▼
                  Get refreshToken from AsyncStorage
                        ▼
                  Call POST /auth/refresh-token
                  with { refreshToken }
                        │
                        ├─→ Success
                        │   - Save new accessToken
                        │   - Save new refreshToken (if provided)
                        │   - Emit TOKEN_REFRESHED event
                        │   - Retry original request ✓
                        │
                        └─→ Failure (refresh token expired)
                            - Clear all auth data
                            - Emit TOKEN_EXPIRED event
                            - AuthContext logs out user
                            - Show "Session Expired" toast
                            - Redirect to Login screen ✓
```

### Logout Flow

```
User taps Logout
        ▼
AuthContext.logout()
        ▼
Call POST /auth/logout (optional, best effort)
        ▼
disconnectDriverSocket()
        ▼
clearAuthStorage()
  - Remove @drybros/auth_token
  - Remove @drybros/refresh_token
  - Remove @drybros/user_data
        ▼
setIsLoggedIn(false)
        ▼
Navigate to Login screen
```

### Session Expiry Flow

```
Refresh token expires or API returns error
        ▼
Response Interceptor catches error
        ▼
clearAuthStorage()
        ▼
Emit TOKEN_EXPIRED event
        ▼
AuthContext listener receives event
        ▼
disconnectDriverSocket()
        ▼
setIsLoggedIn(false)
setSessionExpired(true)
        ▼
App.tsx useEffect detects sessionExpired
        ▼
Show Toast: "Your session has expired. Please log in again."
        ▼
clearSessionExpired()
        ▼
User sees Login screen
```

## Key Features

### 1. **Automatic Token Refresh**
- Transparent to the user
- No manual token management required
- Original request automatically retried with new token

### 2. **Request Queuing**
- Multiple simultaneous API calls handled gracefully
- Only one refresh request made at a time
- All pending requests queued and retried after refresh

### 3. **Race Condition Prevention**
- `isRefreshing` flag prevents multiple refresh attempts
- `isLoggingOutRef` prevents duplicate logout calls
- `originalRequest._retry` prevents infinite retry loops

### 4. **User-Friendly Error Handling**
- Clear toast message on session expiry
- Automatic redirect to login
- No abrupt disconnections

### 5. **Security**
- Tokens stored securely in AsyncStorage
- Refresh token only sent to refresh endpoint
- All auth data cleared on logout/expiry

## Token Storage

| Key | Value | Description |
|-----|-------|-------------|
| `@drybros/auth_token` | string | Access token (JWT) for API authorization |
| `@drybros/refresh_token` | string | Refresh token for obtaining new access tokens |
| `@drybros/user_data` | JSON string | Driver profile data |

## Constants

### Storage Keys (`src/constants/storageKeys.ts`)
```typescript
AUTH_TOKEN: '@drybros/auth_token'
REFRESH_TOKEN: '@drybros/refresh_token'
USER_DATA: '@drybros/user_data'
```

### Auth Messages (`src/constants/auth.ts`)
```typescript
SESSION_EXPIRED_TITLE: 'Session Expired'
SESSION_EXPIRED_MESSAGE: 'Your session has expired. Please login again to continue.'
REFRESH_TOKEN_EXPIRED_MESSAGE: 'Your session has expired. Please log in again.'
```

### API Endpoints (`src/constants/endpints.ts`)
```typescript
AUTH: {
  LOGIN: '/drivers/login',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
}
```

## Error Scenarios

### Scenario 1: Access Token Expired
- **Detection**: API returns 401
- **Action**: Automatic refresh with refresh token
- **User Impact**: None (seamless)

### Scenario 2: Refresh Token Expired
- **Detection**: Refresh API returns 401 or error
- **Action**: Clear auth, emit TOKEN_EXPIRED, show toast
- **User Impact**: Shown "Session Expired" message, redirected to login

### Scenario 3: No Refresh Token Available
- **Detection**: AsyncStorage.getItem returns null
- **Action**: Clear auth, emit TOKEN_EXPIRED
- **User Impact**: Redirected to login (rare, should not happen)

### Scenario 4: Network Error During Refresh
- **Detection**: Axios network error
- **Action**: Original request fails, user sees error
- **User Impact**: May need to retry action

## Best Practices

1. **Never hardcode tokens** - Always use STORAGE_KEYS constants
2. **Use refreshClient for refresh** - Avoids interceptor loops
3. **Handle errors gracefully** - Show user-friendly messages
4. **Clear auth on logout/expiry** - Remove all tokens and user data
5. **Disconnect socket on logout** - Clean up real-time connections
6. **Use events for cross-context communication** - AuthContext and API client are decoupled

## Testing Checklist

- [ ] Login with valid credentials
- [ ] Access token automatically added to requests
- [ ] Access token refresh on 401 (check network tab)
- [ ] Multiple simultaneous requests queued during refresh
- [ ] Refresh token expiry shows toast message
- [ ] User redirected to login on session expiry
- [ ] Logout clears all auth data
- [ ] Socket disconnects on logout
- [ ] Login after logout works correctly
- [ ] Login after session expiry works correctly

## Troubleshooting

### Issue: Infinite refresh loops
**Solution**: Check that refresh endpoint URL is excluded from retry logic

### Issue: Multiple logout calls
**Solution**: Verify `isLoggingOutRef` is preventing race conditions

### Issue: Toast not showing on session expiry
**Solution**: Check that ToastProvider wraps AuthProvider and App component

### Issue: User not redirected to login
**Solution**: Verify AuthContext is setting `isLoggedIn = false` on TOKEN_EXPIRED

## Future Enhancements

1. **Token Rotation**: Implement refresh token rotation for enhanced security
2. **Biometric Auth**: Add fingerprint/face ID for quick re-authentication
3. **Background Refresh**: Proactively refresh tokens before expiry
4. **Offline Support**: Queue requests when offline, retry on reconnection
5. **Token Expiry Countdown**: Show countdown before session expires
