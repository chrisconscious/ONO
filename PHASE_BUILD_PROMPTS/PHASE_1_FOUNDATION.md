# Phase 1: Repository Foundation and Application Shell

**Phase Number:** 1  
**Phase Title:** Repository Foundation and Application Shell  
**Duration:** 2 weeks  
**Prerequisites:** Phase 0 complete and approved  
**Status:** ⏳ Not Started  

---

## 1. Goal and Measurable Outcome

**Goal:** Establish a clean, well-organized repository structure with a functional application shell, routing, and quality infrastructure.

**Measurable Outcomes:**
- [ ] Project structure reorganized according to approved architecture
- [ ] React Router implemented with basic routes
- [ ] Application shell functional (header, navigation, main content area)
- [ ] Error handling implemented
- [ ] Logging infrastructure set up
- [ ] Quality checks configured (linting, formatting, type checking)
- [ ] Basic tests written and passing
- [ ] Documentation updated

---

## 2. Required Authoritative Documents

1. **APPROVED_TECHNOLOGY_AND_ARCHITECTURE_BASELINE.md** - Module structure
2. **UI-012: Complete Screen Inventory and Route Map** (Stage 15) - Routing structure
3. **UI-017: Navigation, Routing, and Access Control Specification** (Stage 15) - Routing rules
4. **SEC-001: Security Threat Model** (Stage 7) - Security requirements
5. **FINAL_IMPLEMENTATION_BLUEPRINT.md** - Overall architecture

---

## 3. Prerequisite Phases

**Phase 0: Readiness and Authorization** - Must be complete and approved

---

## 4. Exact Scope

### 4.1 Project Structure Reorganization

**Current Structure:**
```
src/
├── App.tsx (595 lines - monolithic)
├── components/
├── contexts/
├── data/ (50+ documentation files)
└── lib/
```

**Target Structure:**
```
src/
├── app/
│   ├── routes/
│   │   ├── auth/
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   ├── dashboard/
│   │   │   └── index.tsx
│   │   └── admin/
│   │       └── index.tsx
│   ├── layouts/
│   │   ├── AuthLayout.tsx
│   │   ├── AppLayout.tsx
│   │   └── AdminLayout.tsx
│   └── providers/
│       └── AppProviders.tsx
├── features/
│   └── [feature modules - to be added in later phases]
├── shared/
│   ├── components/
│   │   ├── ui/ (existing Shadcn components)
│   │   └── common/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── Footer.tsx
│   ├── hooks/
│   ├── lib/
│   │   └── utils.ts (existing)
│   ├── types/
│   └── constants/
├── server/ (if backend needed)
├── config/
│   └── env.ts
├── App.tsx (simplified - routing only)
├── main.tsx
└── index.css
```

### 4.2 Routing Implementation

**Routes to Implement:**
```typescript
// Public routes
/auth/login
/auth/register
/auth/forgot-password

// Protected routes (require authentication)
/dashboard
/organizations
/profile

// Admin routes (require admin role)
/admin/dashboard
/admin/users
/admin/settings

// Documentation routes (existing functionality)
/docs
/docs/:stage
/docs/:stage/:document
```

**Router Setup:**
```typescript
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'docs/*', element: <DocumentationViewer /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
    ],
  },
]);
```

### 4.3 Application Shell

**Components to Create:**

1. **AuthLayout.tsx** - Layout for authentication pages
   - Centered card layout
   - Branding elements
   - No navigation

2. **AppLayout.tsx** - Main application layout
   - Header with user menu
   - Sidebar with navigation
   - Main content area
   - Footer

3. **AdminLayout.tsx** - Admin interface layout
   - Admin header
   - Admin sidebar
   - Admin content area

4. **Header.tsx** - Common header component
   - Logo/brand
   - User menu
   - Notifications (placeholder)
   - Settings (placeholder)

5. **Sidebar.tsx** - Navigation sidebar
   - Main navigation links
   - Active state indication
   - Collapsible on mobile

### 4.4 Error Handling

**Error Boundary:**
```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    logError(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorPage error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

**Error Pages:**
- 404 Not Found
- 403 Forbidden
- 500 Server Error
- Generic Error

### 4.5 Logging Infrastructure

**Logging Service:**
```typescript
class Logger {
  info(message: string, context?: any) { }
  warn(message: string, context?: any) { }
  error(message: string, error?: Error, context?: any) { }
  debug(message: string, context?: any) { }
}
```

**Log Levels:**
- DEBUG: Development only
- INFO: General information
- WARN: Warning conditions
- ERROR: Error conditions

**Log Destinations:**
- Console (development)
- Logging service (production)
- Error tracking service (Sentry, etc.)

### 4.6 Quality Infrastructure

**ESLint Configuration:**
```javascript
// eslint.config.js
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import typescript from '@typescript-eslint/eslint-plugin';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: { react, '@typescript-eslint' },
    rules: {
      // Custom rules
    },
  },
];
```

**Prettier Configuration:**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

**Testing Setup:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

---

## 5. Explicit Exclusions

**Do NOT implement:**
- ❌ Business features (CRM, sales, inventory, etc.)
- ❌ Database connections
- ❌ API endpoints
- ❌ Complex state management
- ❌ Advanced UI components
- ❌ Background jobs
- ❌ Analytics features

**Do NOT modify:**
- ❌ Existing documentation data files
- ❌ Authentication implementation (done in Phase 0)
- ❌ Security configurations (done in Phase 0)

---

## 6. Existing Files to Inspect

**Must Inspect Before Changes:**
1. `src/App.tsx` - Current monolithic structure
2. `src/main.tsx` - Entry point
3. `src/index.css` - Global styles
4. `package.json` - Dependencies
5. `tsconfig.json` - TypeScript config
6. `vite.config.js` - Vite config
7. All files in `src/components/` - Existing components
8. All files in `src/contexts/` - Existing contexts
9. All files in `src/data/` - Documentation data

**Must Preserve:**
- ✅ All documentation data in `src/data/`
- ✅ Authentication implementation from Phase 0
- ✅ Shadcn UI components in `src/components/ui/`
- ✅ Existing utility functions in `src/lib/utils.ts`

---

## 7. Expected Changes and Deliverables

### 7.1 Files to Create

**New Structure:**
- `src/app/routes/` - Route components
- `src/app/layouts/` - Layout components
- `src/app/providers/` - Context providers
- `src/shared/components/common/` - Shared components
- `src/shared/hooks/` - Custom hooks
- `src/shared/types/` - Type definitions
- `src/shared/constants/` - Constants
- `src/config/env.ts` - Environment configuration
- `src/test/setup.ts` - Test setup
- `eslint.config.js` - ESLint config
- `.prettierrc` - Prettier config
- `vitest.config.ts` - Vitest config

**New Components:**
- `AuthLayout.tsx`
- `AppLayout.tsx`
- `AdminLayout.tsx`
- `Header.tsx`
- `Sidebar.tsx`
- `Footer.tsx`
- `ErrorBoundary.tsx`
- `ErrorPage.tsx`
- `NotFoundPage.tsx`
- `ForbiddenPage.tsx`

**New Utilities:**
- `logger.ts` - Logging service
- `errorHandler.ts` - Error handling
- `validation.ts` - Validation utilities

### 7.2 Files to Modify

**Major Modifications:**
- `src/App.tsx` - Simplify to routing only
- `src/main.tsx` - Update imports
- `package.json` - Add new dependencies

**Minor Modifications:**
- `src/index.css` - Add global styles if needed
- `tsconfig.json` - Update paths if needed
- `vite.config.js` - Update config if needed

### 7.3 Files to Move

**Move to New Locations:**
- `src/components/LoginPage.tsx` → `src/app/routes/auth/login.tsx`
- `src/components/SuperAdminDashboard.tsx` → `src/app/routes/admin/index.tsx`
- `src/components/ui/*` → `src/shared/components/ui/*` (keep in place)
- `src/lib/utils.ts` → `src/shared/lib/utils.ts`

---

## 8. Architecture and Coding Rules

### 8.1 Code Quality

**TypeScript:**
- Strict mode enabled
- No `any` types
- Explicit return types
- Proper error handling
- Type-safe imports

**React:**
- Functional components only
- Hooks for state
- Proper key usage
- Accessibility (ARIA labels, keyboard navigation)
- Performance optimization

**File Organization:**
- One component per file
- Co-locate related files
- Use index.ts for exports
- Clear naming conventions

### 8.2 Naming Conventions

**Files:**
- Components: PascalCase (e.g., `Header.tsx`)
- Utilities: camelCase (e.g., `logger.ts`)
- Types: PascalCase (e.g., `User.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_URL.ts`)

**Components:**
- PascalCase for component names
- Descriptive names
- Single responsibility

**Functions:**
- camelCase for function names
- Verb + noun (e.g., `getUser`, `createLead`)
- Clear purpose

**Variables:**
- camelCase for variables
- Descriptive names
- Avoid abbreviations

### 8.3 Import Organization

**Order:**
1. React and external libraries
2. Internal modules (features, shared)
3. Relative imports (components, utils)
4. Styles and assets

**Example:**
```typescript
// External
import { useState } from 'react';
import { Link } from 'react-router-dom';

// Internal
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/shared/components/ui/button';

// Relative
import { Header } from './Header';
import './styles.css';
```

---

## 9. Tenant Isolation and Authorization Requirements

**Not applicable for Phase 1** - No tenant data yet.

**Preparation:**
- Design route protection structure
- Plan authorization checks
- Prepare for tenant context injection in Phase 2

---

## 10. Data Integrity Requirements

**Not applicable for Phase 1** - No business data yet.

**Preparation:**
- Plan data validation structure
- Design error handling for data operations
- Prepare for database integration in Phase 3

---

## 11. Required Tests

### 11.1 Unit Tests

**Test Coverage:**
- All utility functions
- All custom hooks
- All validation functions
- All error handling

**Example Tests:**
```typescript
describe('Logger', () => {
  it('should log info messages', () => {
    const logger = new Logger();
    const spy = jest.spyOn(console, 'info');
    logger.info('test message');
    expect(spy).toHaveBeenCalledWith('test message');
  });
});

describe('Validation', () => {
  it('should validate email format', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid')).toBe(false);
  });
});
```

### 11.2 Integration Tests

**Test Coverage:**
- Router navigation
- Layout rendering
- Error boundary catching
- Protected route access

**Example Tests:**
```typescript
describe('Router', () => {
  it('should navigate to login page', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('Login'));
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });
});

describe('ErrorBoundary', () => {
  it('should catch errors', () => {
    const ErrorComponent = () => {
      throw new Error('Test error');
    };
    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
```

### 11.3 Quality Tests

**Linting:**
```bash
npm run lint
# Should pass without errors
```

**Type Checking:**
```bash
npm run typecheck
# Should pass without errors
```

**Formatting:**
```bash
npm run format
# Should format all files
```

**Test Coverage:**
```bash
npm run test:coverage
# Should report coverage > 80%
```

---

## 12. Acceptance Criteria

### 12.1 Gate A: Scope Verification

- [ ] Only Phase 1 tasks implemented
- [ ] No business features added
- [ ] Project structure matches target
- [ ] All routes implemented
- [ ] All layouts created

### 12.2 Gate B: Architecture Verification

- [ ] Modular structure followed
- [ ] No circular dependencies
- [ ] Clear separation of concerns
- [ ] Reusable components created
- [ ] Code follows naming conventions

### 12.3 Gate C: Security Verification

- [ ] No hardcoded secrets
- [ ] Error messages don't expose sensitive data
- [ ] Routes properly protected
- [ ] Input validation in place
- [ ] Logging doesn't expose sensitive data

### 12.4 Gate D: Data Integrity Verification

- [ ] N/A for Phase 1

### 12.5 Gate E: Testing Verification

- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Test coverage > 80%
- [ ] No test failures
- [ ] Tests documented

### 12.6 Gate F: UX and Accessibility Verification

- [ ] Navigation works correctly
- [ ] Error pages display correctly
- [ ] Loading states handled
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient

### 12.7 Gate G: Documentation Verification

- [ ] README updated
- [ ] Code comments added
- [ ] Component documentation created
- [ ] Setup instructions clear
- [ ] Known limitations documented

### 12.8 Gate H: Owner Review

- [ ] Product owner reviews implementation
- [ ] All acceptance criteria verified
- [ ] No critical issues found
- [ ] Owner formally approves Phase 1 completion
- [ ] Owner authorizes Phase 2 implementation

---

## 13. Documentation Updates

### 13.1 Documents to Create

1. **PROJECT_STRUCTURE.md**
   - Directory structure explanation
   - File organization rules
   - Naming conventions
   - Import organization

2. **ROUTING_GUIDE.md**
   - Route structure
   - Navigation patterns
   - Protected routes
   - Error handling

3. **COMPONENT_GUIDE.md**
   - Component organization
   - Reusable components
   - Layout components
   - Usage examples

### 13.2 Documents to Update

1. **README.md**
   - Update project structure
   - Add routing information
   - Update setup instructions
   - Add contribution guidelines

2. **AUTHORITATIVE_PROJECT_DOCUMENTATION_INDEX.md**
   - Record Phase 1 completion
   - Update document status
   - Add new documents

3. **APPROVED_TECHNOLOGY_AND_ARCHITECTURE_BASELINE.md**
   - Update with actual implementation
   - Record any deviations
   - Update version number

---

## 14. Rollback or Recovery Requirements

### 14.1 Rollback Plan

**If Phase 1 fails:**
1. Revert to Phase 0 state using Git
2. Document failure reason
3. Adjust plan based on lessons learned
4. Retry with adjusted approach

### 14.2 Recovery Procedures

**If structure issues discovered:**
1. Document the issue
2. Propose fix
3. Get approval
4. Implement fix
5. Test thoroughly
6. Update documentation

**If routing issues discovered:**
1. Identify the issue
2. Fix routing configuration
3. Test all routes
4. Update documentation

---

## 15. Completion Report Requirements

Upon completion, provide:

### 15.1 Summary

- Phase 1 completion date
- Total time spent
- Team members involved
- Overall status

### 15.2 Files Changed

**Created:**
- List all new files with descriptions

**Modified:**
- List all modified files with changes

**Deleted:**
- List all deleted files with reasons

**Moved:**
- List all moved files with new locations

### 15.3 Tests Executed

**Unit Tests:**
- Number of tests
- Pass/fail status
- Coverage percentage

**Integration Tests:**
- Number of tests
- Pass/fail status
- Coverage percentage

**Quality Tests:**
- Linting results
- Type checking results
- Formatting results

### 15.4 Issues Encountered

- List all issues
- Impact assessment
- Resolution approach
- Lessons learned

### 15.5 Documentation Updated

- List all documents created
- List all documents updated
- Version numbers

### 15.6 Next Steps

- Phase 2 readiness assessment
- Any remaining issues
- Recommended timeline
- Resource requirements

---

## 16. Stop Condition

**STOP after completing Phase 1.**

Do not:
- ❌ Begin Phase 2 implementation
- ❌ Add business features
- ❌ Modify database schema
- ❌ Create API endpoints
- ❌ Implement complex state management

**Wait for:**
- ✅ Owner review of Phase 1 completion report
- ✅ Owner approval of implementation
- ✅ Owner explicit authorization to begin Phase 2
- ✅ All Phase 1 acceptance gates passed

---

## 17. Phase 1 Success Criteria

Phase 1 is successful when:

1. **Structure:** Project follows approved modular structure
2. **Routing:** All basic routes functional
3. **Layouts:** All layouts rendering correctly
4. **Error Handling:** Errors caught and displayed properly
5. **Logging:** Logging infrastructure working
6. **Quality:** All quality checks passing
7. **Testing:** Tests written and passing
8. **Documentation:** All documentation updated
9. **Approval:** Owner formally approves completion

---

## 18. Estimated Effort

**Time Estimate:** 2 weeks

**Breakdown:**
- Structure reorganization: 3 days
- Routing implementation: 2 days
- Layout creation: 2 days
- Error handling: 1 day
- Logging setup: 1 day
- Quality infrastructure: 1 day
- Testing: 2 days
- Documentation: 1 day

**Team Required:**
- Frontend Developer: 100% time
- QA Engineer: 25% time
- Engineering Lead: 10% time (review)

---

## 19. Risks and Mitigations

**Risk 1: Structure reorganization breaks existing functionality**
- Mitigation: Thorough testing after each change
- Contingency: Rollback to previous state

**Risk 2: Routing conflicts with existing code**
- Mitigation: Careful planning, incremental changes
- Contingency: Adjust routing strategy

**Risk 3: Quality tools conflict with existing setup**
- Mitigation: Test tools in isolation first
- Contingency: Use alternative tools

**Risk 4: Testing takes longer than expected**
- Mitigation: Prioritize critical tests
- Contingency: Extend timeline

---

## 20. References

**Authoritative Documents:**
- APPROVED_TECHNOLOGY_AND_ARCHITECTURE_BASELINE.md
- UI-012: Complete Screen Inventory and Route Map (Stage 15)
- UI-017: Navigation, Routing, and Access Control Specification (Stage 15)

**Technical References:**
- React Router Documentation: https://reactrouter.com
- Vite Documentation: https://vitejs.dev
- TypeScript Documentation: https://www.typescriptlang.org
- Tailwind CSS Documentation: https://tailwindcss.com

---

**Phase Status:** ⏳ Not Started  
**Next Action:** Complete Phase 0 and obtain owner approval  
**Estimated Start:** Upon Phase 0 completion  
**Estimated Completion:** 2 weeks after start
