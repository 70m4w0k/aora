# Deployment Testing Checklist

Use this checklist to verify your self-hosted Tipi app deployment is working correctly.

## Pre-Deployment Checks

### Cloudflare Tunnel Setup

- [ ] Cloudflare Tunnel is installed on self-hosted computer
- [ ] Tunnel is authenticated with Cloudflare account
- [ ] Tunnel is created and configured
- [ ] DNS route is configured (custom domain or Cloudflare free domain)
- [ ] Tunnel is running: `cloudflared tunnel list` shows active tunnel
- [ ] Tunnel auto-starts on server reboot (systemd/launchd service configured)
- [ ] Tunnel logs show no errors: `sudo journalctl -u cloudflared -f` (Linux) or `tail -f ~/.cloudflared/tunnel.log` (macOS)

### Appwrite Configuration

- [ ] Appwrite is running: `docker ps` shows appwrite container
- [ ] `_APP_DOMAIN` environment variable set to tunnel domain in `docker-compose.yml`
- [ ] Appwrite restarted after configuration changes
- [ ] Appwrite logs show no errors: `docker compose logs appwrite`
- [ ] Appwrite console accessible via tunnel domain: `https://your-domain.com`
- [ ] Appwrite API health check passes: `curl https://your-domain.com/v1/health`

### App Configuration

- [ ] `.env` file created with correct values
- [ ] `EXPO_PUBLIC_APPWRITE_ENDPOINT` set to tunnel domain (with `/v1`)
- [ ] `EXPO_PUBLIC_APPWRITE_PROJECT_ID` set correctly
- [ ] `EXPO_PUBLIC_APPWRITE_DATABASE_ID` set correctly
- [ ] `EXPO_PUBLIC_APPWRITE_PLATFORM` set to `com.tipi.app`
- [ ] Run verification script: `./scripts/verify-deployment.sh`
- [ ] Environment variables loaded correctly (check console logs)

## Build and Installation

### iOS Build

- [ ] iOS build completed successfully: `npm run build:ios`
- [ ] Build installed on iOS device (TestFlight or direct install)
- [ ] App launches without crashes
- [ ] App shows correct endpoint in debug logs

### Android Build

- [ ] Android build completed successfully: `npm run build:android`
- [ ] APK installed on Android device
- [ ] App launches without crashes
- [ ] App shows correct endpoint in debug logs

## Connectivity Tests

### From Same Network (WiFi)

- [ ] App connects to Appwrite endpoint
- [ ] Sign up flow works
- [ ] Sign in flow works
- [ ] App loads user data
- [ ] No connection errors in console

### From Different Network (Cellular)

- [ ] App connects to Appwrite endpoint
- [ ] Sign in works
- [ ] App loads user data
- [ ] CRUD operations work (create/read/update/delete)
- [ ] No connection errors

### From Different Location

- [ ] App connects from different WiFi network
- [ ] All features work correctly
- [ ] Data syncs properly
- [ ] No timeout errors

## Feature Tests

### Authentication

- [ ] User can sign up with email/password
- [ ] User can sign in with existing account
- [ ] User can sign out
- [ ] Session persists after app restart
- [ ] Invalid credentials show error message

### Household Management

- [ ] User can create household
- [ ] User can join household with invite code
- [ ] User can view household members
- [ ] User can leave household
- [ ] Household data syncs across devices

### Tasks/Chores

- [ ] User can create task
- [ ] User can view tasks
- [ ] User can mark task as complete
- [ ] User can delete task
- [ ] Tasks sync across household members

### Shopping List

- [ ] User can add shopping item
- [ ] User can mark item as completed
- [ ] User can delete item
- [ ] Shopping list syncs across household members

### Expenses

- [ ] User can create expense
- [ ] User can view expenses
- [ ] User can edit expense
- [ ] User can delete expense
- [ ] Expenses sync across household members

### Documents

- [ ] User can upload document
- [ ] User can view documents
- [ ] User can delete document
- [ ] Documents sync across household members

### Habits Tracker (if implemented)

- [ ] User can create arc
- [ ] User can create quest
- [ ] User can complete quest
- [ ] XP is awarded correctly
- [ ] Progress syncs across devices

## Performance Tests

- [ ] App loads quickly (< 3 seconds)
- [ ] Data loads quickly (< 2 seconds)
- [ ] No memory leaks (test extended use)
- [ ] App handles offline gracefully
- [ ] App syncs data when back online

## Security Tests

- [ ] HTTPS is enforced (check endpoint uses `https://`)
- [ ] API keys are not exposed in app bundle
- [ ] User data is protected (test permissions)
- [ ] Invalid requests are rejected
- [ ] Session expires after inactivity

## Error Handling

- [ ] Network errors show user-friendly messages
- [ ] Invalid input shows validation errors
- [ ] Server errors are handled gracefully
- [ ] App doesn't crash on errors
- [ ] Error logs are helpful for debugging

## Edge Cases

- [ ] App works with slow network connection
- [ ] App handles network disconnection
- [ ] App handles server downtime gracefully
- [ ] App works with large datasets
- [ ] App handles concurrent users correctly

## Monitoring and Maintenance

### Monitoring Setup

- [ ] Cloudflare Tunnel monitoring configured
- [ ] Appwrite monitoring configured
- [ ] Alerts set up for tunnel disconnections
- [ ] Alerts set up for Appwrite downtime
- [ ] Log aggregation configured (optional)

### Backup Verification

- [ ] Appwrite backups are configured
- [ ] Backup schedule is set (daily recommended)
- [ ] Backup restore has been tested
- [ ] Backup storage is secure
- [ ] Backup retention policy is set

### Documentation

- [ ] Deployment process is documented
- [ ] Troubleshooting guide is available
- [ ] Recovery procedures are documented
- [ ] Team members know how to access logs
- [ ] Contact information for support is available

## Final Verification

### End-to-End Test

1. [ ] Create new user account from mobile app
2. [ ] Create household
3. [ ] Add tasks, shopping items, expenses
4. [ ] Test from different device/location
5. [ ] Verify data syncs correctly
6. [ ] Test all major features
7. [ ] Verify no data loss
8. [ ] Verify performance is acceptable

### Sign-Off

- [ ] All critical tests passed
- [ ] No blocking issues found
- [ ] Performance is acceptable
- [ ] Security is verified
- [ ] Documentation is complete
- [ ] Team is trained on deployment

## Troubleshooting Quick Reference

### App Can't Connect

1. Check tunnel is running: `cloudflared tunnel list`
2. Check Appwrite is running: `docker ps`
3. Test endpoint: `curl https://your-domain.com/v1/health`
4. Check `.env` file has correct endpoint
5. Verify endpoint uses `https://` not `http://`

### Authentication Fails

1. Verify project ID is correct
2. Check Appwrite logs: `docker compose logs appwrite`
3. Verify domain matches in Appwrite config
4. Test with curl/Postman first

### Data Not Syncing

1. Check database permissions in Appwrite
2. Verify collection IDs match in `lib/appwrite.js`
3. Check Appwrite logs for errors
4. Verify user is authenticated

### Tunnel Disconnects

1. Check tunnel logs for errors
2. Verify tunnel service is running
3. Check Cloudflare account status
4. Restart tunnel service if needed

## Success Criteria

Deployment is considered successful when:

- ✅ All connectivity tests pass
- ✅ All feature tests pass
- ✅ App works from multiple networks
- ✅ Performance is acceptable
- ✅ No critical bugs found
- ✅ Monitoring is set up
- ✅ Backups are configured

## Next Steps After Successful Deployment

1. Monitor app usage and performance
2. Collect user feedback
3. Set up regular maintenance schedule
4. Plan for scaling if needed
5. Document any issues encountered
6. Update deployment documentation based on learnings



