# Component Integration Lock System

**Date:** January 2, 2025  
**Status:** Active Protection System

## Purpose
Prevent regression of working functionality by establishing locked, tested component patterns.

## Critical Working Patterns

### 1. API Request Pattern (LOCKED)
**Status:** ✅ WORKING - DO NOT CHANGE
```typescript
// CORRECT PATTERN
const mutation = useMutation({
  mutationFn: async (data) => {
    const response = await apiRequest('METHOD', '/api/endpoint', data);
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/endpoint'] });
    toast({ title: 'Success message' });
  }
});
```

**NEVER USE:**
```typescript
// INCORRECT - CAUSES BUILDS TO FAIL
apiRequest('/api/endpoint', { method: 'POST', body: JSON.stringify(data) })
```

### 2. FAQ Management Pattern (LOCKED)
**File:** `client/src/pages/faq-manager.tsx`
**Status:** ✅ WORKING STANDALONE
- Create, Read, Update, Delete operations
- URL scraping functionality
- Search and filtering
- Proper error handling

**Integration Rule:** Use standalone FAQ manager at `/faq-manager` instead of embedded in admin center

### 3. Document CRUD Pattern (LOCKED)
**File:** `client/src/pages/my-documents-page.tsx`
**Status:** ✅ WORKING with API fixes applied
- Personal document management
- Folder creation and organization
- Edit, delete, view operations
- Proper mutations with correct API syntax

### 4. Chat Review Pattern (LOCKED)
**File:** Referenced in `BACKUP_CRITICAL_COMPONENTS.md`
**Status:** ✅ WORKING - Production ready
- Authentication flow working
- Message loading functional
- Review and training systems operational

## Anti-Regression Rules

### 1. Never Modify Working API Patterns
- The `apiRequest(method, url, data)` pattern is LOCKED
- Always use this exact parameter order
- Always call `.json()` on response for mutations
- Never revert to object syntax

### 2. Component Isolation Strategy
- Keep complex functionality in separate pages/components
- Use route-based access rather than embedding everything in admin center
- Test standalone components before integration

### 3. TypeScript Error Prevention
- Always fix API syntax first before addressing type issues
- Use proper type annotations for query data
- Handle unknown types with proper type guards

## Recovery Procedures

### If FAQ Functionality Breaks:
1. Use standalone FAQ manager at `/faq-manager`
2. Do not attempt to fix admin control center embedded version
3. Redirect admin users to standalone component

### If Document CRUD Breaks:
1. Verify API syntax follows locked pattern
2. Check My Documents page mutations
3. Ensure proper parameter order in apiRequest calls

### If Build Fails:
1. Check for duplicate variable declarations
2. Verify apiRequest syntax matches locked pattern
3. Remove deprecated useQuery options (onSuccess, onError)

## Integration Guidelines

### Before Making Changes:
1. Test current functionality is working
2. Create backup of working state
3. Make minimal, targeted changes
4. Test immediately after each change

### After Making Changes:
1. Verify build succeeds
2. Test all CRUD operations
3. Check console for errors
4. Update this lock file if new patterns emerge

## Future Development Strategy

### Phase 1: Stabilization (Current)
- Fix remaining API syntax issues
- Ensure all locked patterns work
- Document any new working patterns

### Phase 2: Systematic Integration
- Create unified admin interface with proper component architecture
- Use composition pattern instead of monolithic components
- Implement proper error boundaries

### Phase 3: Prevention
- Add automated testing for critical patterns
- Implement TypeScript strict mode
- Create component library with locked interfaces

## Critical File Monitoring

Watch these files for regressions:
- `client/src/lib/queryClient.ts` (API pattern source)
- `client/src/pages/faq-manager.tsx` (FAQ functionality)
- `client/src/pages/my-documents-page.tsx` (Document CRUD)
- `client/src/pages/admin-control-center.tsx` (Integration point)

## Emergency Recovery

If multiple systems break simultaneously:
1. Revert to standalone components
2. Use direct routes: `/faq-manager`, `/documents`
3. Bypass admin control center until stable
4. Follow patterns in this lock file for repairs

---

**IMPORTANT:** This file must be updated whenever working patterns are discovered or confirmed. Do not modify working code without documenting the change here first.