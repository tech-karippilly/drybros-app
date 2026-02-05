# Auth Flow Quick Reference

## 🔑 Quick Overview

**Already Working**: ✅ Axios interceptors, token storage, refresh logic, request queuing
**Added**: ✅ Event system, session expiry notifications, auto-redirect to login

---

## 📋 The Flow in Simple Terms

### When Access Token Expires:
```
Request fails (401) 
→ Interceptor catches it
→ Calls refresh token API
→ Gets new tokens
→ Retries request automatically
→ User never notices ✓
```

### When Refresh Token Expires:
```
Request fails (401)
→ Interceptor tries refresh
→ Refresh fails
→ Emits TOKEN_EXPIRED event
→ AuthContext logs user out
→ Shows toast: "Session expired"
→ Redirects to login ✓
```

---

## 🔧 Key Components

| Component | Role |
|-----------|------|
| **apiClient** | Main axios instance with interceptors |
| **refreshClient** | Separate instance for refresh calls |
| **authEvents** | Event emitter (TOKEN_EXPIRED, TOKEN_REFRESHED) |
| **AuthContext** | Listens for events, manages login state |
| **App.tsx** | Shows toast on session expiry |

---

## 📦 Storage Keys

```typescript
STORAGE_KEYS.AUTH_TOKEN      // Access token
STORAGE_KEYS.REFRESH_TOKEN   // Refresh token
STORAGE_KEYS.USER_DATA       // Driver profile
```

---

## 🎯 API Endpoints

```typescript
POST /drivers/login           // Login
POST /auth/logout            // Logout
POST /auth/refresh-token     // Refresh tokens
```

---

## 🧪 Quick Test

1. **Login** → Should work ✓
2. **Make API calls** → Should work ✓
3. **Wait for token expiry** → Automatically refreshes ✓
4. **Expire refresh token** → Shows "Session expired" message ✓
5. **Logout** → Clears everything ✓

---

## 🐛 Troubleshooting

| Issue | Check |
|-------|-------|
| Infinite loops | Refresh endpoint excluded from retry? |
| No toast on expiry | ToastProvider wraps AuthProvider? |
| Multiple logout calls | isLoggingOutRef preventing races? |
| Not redirecting | AuthContext setting isLoggedIn=false? |

---

## 📖 Full Documentation

See [AUTHENTICATION_FLOW.md](AUTHENTICATION_FLOW.md) for:
- Detailed architecture
- Flow diagrams  
- Error scenarios
- Testing checklist
- Best practices

---

## ✨ What's New

**Before**:
- ❌ No notification on session expiry
- ❌ Silent failures
- ❌ User confusion

**After**:
- ✅ Clear toast message
- ✅ Auto redirect to login
- ✅ Clean auth state cleanup
- ✅ Event-driven architecture

---

**That's it!** Your auth flow is now complete and user-friendly. 🎉
