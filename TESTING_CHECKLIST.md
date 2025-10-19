# LightPaper Testing Checklist

## Phase 1: Critical Bug Fixes ✅

### Route & Navigation
- [x] Shared PDF link generation uses correct `/shared-pdf/` route
- [ ] Shared PDF links are accessible and work correctly
- [ ] No 404 errors when accessing shared PDF documents

### Live Collaboration
- [ ] Container ref properly assigned to editor element
- [ ] Live cursors display for multiple users
- [ ] Cursor positions update in real-time
- [ ] No null reference errors in console

### Error Handling
- [ ] File upload validates file type (PDF only)
- [ ] File upload validates file size (< 20MB)
- [ ] Image upload validates file type and size
- [ ] Appropriate error messages shown to users
- [ ] Network errors handled gracefully

## Phase 2: High Priority UX

### Mobile Responsiveness
- [ ] Document editor toolbar accessible on mobile (< 768px)
- [ ] Spreadsheet usable on mobile devices
- [ ] Presentation controls fit on mobile screen
- [ ] PDF editor toolbar collapses appropriately
- [ ] No horizontal overflow on any screen size

### Loading States
- [ ] Loading spinner when switching between tabs
- [ ] "Saving..." indicator during auto-save
- [ ] Skeleton loaders for project list
- [ ] Progress bar for file uploads
- [ ] "Loading document..." state visible

### Dark Mode
- [ ] No hard-coded black/white colors in components
- [ ] Proper contrast in dark mode
- [ ] Smooth transition when toggling theme
- [ ] Toolbar icons visible in both modes
- [ ] Text readable on all backgrounds

### Real-Time Collaboration
- [ ] Mouse movements tracked in document editor
- [ ] Cursor positions throttled (max 10 updates/sec)
- [ ] Cursors fade after 3 seconds of inactivity
- [ ] User names displayed with cursors
- [ ] Color-coded cursors for each user

### Collaboration Presence
- [ ] Active users displayed at top of editor
- [ ] Avatar count shows "X people viewing"
- [ ] Status indicators (viewing/editing/signing)
- [ ] Users removed when they leave

## Phase 3: Performance

### Spreadsheet Optimization
- [ ] Only visible rows/columns rendered initially
- [ ] Lazy loading works when scrolling
- [ ] No lag with 1000+ cells
- [ ] Memory usage reasonable

### Database Performance
- [ ] Search queries return results in < 1 second
- [ ] Project list loads quickly
- [ ] Comments load without delay
- [ ] Favorites query optimized

### Debounced Search
- [ ] Search waits 300ms before querying
- [ ] "Searching..." indicator shown
- [ ] Previous searches cancelled properly
- [ ] Results cached appropriately

### Version History Cleanup
- [ ] Temporary versions limited to 50
- [ ] Versions older than 24 hours deleted
- [ ] Session cleanup on logout works
- [ ] No database bloat over time

## Phase 4: Type Safety

### Type Definitions
- [ ] No `as any` type assertions
- [ ] Proper interfaces for all data types
- [ ] Type guards used where appropriate
- [ ] Project content properly typed

## Phase 5: Missing Features

### PDF Editor
- [ ] Activity panel toggle button visible
- [ ] Recent changes displayed
- [ ] User attribution for changes
- [ ] Filter options working

### Comments
- [ ] Visual markers where comments exist
- [ ] Clicking marker opens comment
- [ ] Comment position highlights text
- [ ] Comment count badge on toolbar

### Network Recovery
- [ ] Offline indicator shows when disconnected
- [ ] Failed auto-saves retried when online
- [ ] Queued changes sync automatically
- [ ] User warned before navigating with unsaved changes

## Phase 6: Security

### Input Sanitization
- [ ] HTML content sanitized before rendering
- [ ] Dangerous tags stripped
- [ ] URLs validated in links
- [ ] Search queries escaped
- [ ] No XSS vulnerabilities

## Phase 7: UI/UX Polish

### Consistency
- [ ] All toolbar buttons use h-9 w-9
- [ ] Consistent gap-2 spacing
- [ ] Vertical separators between groups
- [ ] All buttons have hover states

### Auto-Save Status
- [ ] Status shows "Saved" (green)
- [ ] Status shows "Saving..." (yellow)
- [ ] Status shows "Failed to save" (red)
- [ ] Last save timestamp visible
- [ ] Manual "Save Now" button available

## Cross-Platform Testing

### Desktop (1920x1080)
- [ ] All features accessible
- [ ] No layout issues
- [ ] Proper spacing and alignment

### Tablet (768px)
- [ ] Toolbar adapts appropriately
- [ ] Touch interactions work
- [ ] Readable text sizes

### Mobile (375px)
- [ ] All features accessible via menus
- [ ] No horizontal scrolling
- [ ] Touch targets adequate size

## Edge Cases

### Concurrent Editing
- [ ] Multiple users editing same document
- [ ] No data loss during simultaneous edits
- [ ] Conflict resolution works

### Large Documents
- [ ] 100+ page PDF performance
- [ ] 1000+ row spreadsheet
- [ ] Large presentation files

### Network Conditions
- [ ] Works on slow connections
- [ ] Handles intermittent connectivity
- [ ] Offline mode functional

### Browser Compatibility
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers

## User Experience

### Onboarding
- [ ] First-time users understand features
- [ ] Tooltips helpful and clear
- [ ] Keyboard shortcuts discoverable

### Workflows
- [ ] Creating new document is intuitive
- [ ] Sharing workflow is clear
- [ ] Collaboration is seamless

### Error Messages
- [ ] Errors are user-friendly
- [ ] Actionable error messages
- [ ] No technical jargon

## Performance Benchmarks

- [ ] Initial page load < 3 seconds
- [ ] Time to interactive < 5 seconds
- [ ] Auto-save < 1 second
- [ ] Search results < 1 second
- [ ] File upload feedback immediate

## Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Sufficient color contrast
- [ ] Focus indicators visible
- [ ] Alt text for images

## Notes
- Add specific test results and dates as features are tested
- Document any bugs found during testing
- Track regression issues
