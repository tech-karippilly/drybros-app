# Logging Documentation

## Overview

The application uses **Winston** for comprehensive logging of requests, responses, and errors. All logs are saved to files in the `logs/` directory for developer use.

## Log Files

All logs are stored in the `logs/` directory:

- **`combined.log`** - All application logs (info, warn, error)
- **`error.log`** - Error logs only (errors and above)
- **`access.log`** - Request/response logs (info level)

## Log Rotation

- Maximum file size: **5MB** per log file
- Maximum files: **5** rotated files per log type
- Old files are automatically rotated (e.g., `combined.log.1`, `combined.log.2`, etc.)

## What Gets Logged

### Request Logging
Every incoming request is logged with:
- Request ID (for tracing)
- HTTP method (GET, POST, PUT, DELETE, etc.)
- URL and path
- Query parameters
- Client IP address
- User agent
- Request body (sensitive fields are redacted)

### Response Logging
Every response is logged with:
- Request ID (matches the request)
- HTTP method and URL
- Status code
- Response duration (in milliseconds)
- Response body (only for errors, 4xx/5xx status codes)

### Error Logging
All errors are logged with:
- Request ID
- Error message
- Stack trace
- HTTP method and URL
- Status code
- Error type

## Security

Sensitive information is automatically redacted from logs:
- `password`
- `token`
- `secret`
- `authorization`

These fields are replaced with `***REDACTED***` in logs.

## Log Levels

- **Development**: `debug` level (logs everything)
- **Production**: `info` level (logs info, warn, error)

## Log Format

### Console (Development)
```
2025-01-14 20:30:45 [info]: Incoming request {"requestId":"1234567890-abc123","method":"POST","url":"/roles",...}
```

### File (JSON Format)
```json
{
  "timestamp": "2025-01-14 20:30:45",
  "level": "info",
  "message": "Incoming request",
  "requestId": "1234567890-abc123",
  "method": "POST",
  "url": "/roles",
  "path": "/roles",
  "ip": "::1",
  "userAgent": "Mozilla/5.0...",
  "service": "Drybros Backend"
}
```

## Usage in Code

### Basic Logging
```typescript
import logger from "./config/logger";

// Info log
logger.info("Operation completed", { userId: 123 });

// Error log
logger.error("Database connection failed", { error: err.message });

// Debug log (only in development)
logger.debug("Debug information", { data: someData });
```

### Request Tracing
Each request gets a unique `requestId` that can be used to trace a request through the system:

```typescript
// In middleware/controller
const requestId = (req as any).requestId;
logger.info("Processing request", { requestId, action: "createRole" });
```

## Viewing Logs

### Development
Logs are displayed in the console with colors and formatting.

### Production
Logs are written to files only. View them with:

```bash
# View all logs
tail -f logs/combined.log

# View errors only
tail -f logs/error.log

# View requests only
tail -f logs/access.log

# Search logs
grep "POST /roles" logs/access.log

# Filter by request ID
grep "1234567890-abc123" logs/combined.log
```

## Configuration

Logging configuration is in `src/config/logger.ts`:
- Log levels
- File paths
- Rotation settings
- Format options

## Best Practices

1. **Use appropriate log levels**:
   - `error` - For errors that need attention
   - `warn` - For warnings
   - `info` - For important events (requests, responses)
   - `debug` - For detailed debugging (development only)

2. **Include context**:
   ```typescript
   logger.info("User created", { userId: user.id, email: user.email });
   ```

3. **Don't log sensitive data**:
   - Passwords, tokens, secrets are automatically redacted
   - Be careful with other sensitive information

4. **Use request IDs**:
   - All requests have a unique ID
   - Use it to trace requests across services

## Troubleshooting

### Logs not appearing
- Check that the `logs/` directory exists and is writable
- Verify log level settings in `logger.ts`
- Check file permissions

### Logs too large
- Logs automatically rotate at 5MB
- Old logs are kept (last 5 files)
- Manually clean old logs if needed

### Missing request logs
- Ensure `requestLogger` middleware is added before routes
- Check that middleware is in the correct order in `index.ts`
