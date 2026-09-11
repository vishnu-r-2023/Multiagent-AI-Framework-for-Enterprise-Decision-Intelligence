import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import PageLoader from "./components/common/PageLoader";
import AppHeader from "./components/layout/AppHeader";
import Sidebar from "./components/layout/Sidebar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import {
  canAccessPage,
  DEFAULT_PAGE,
  getPagesForRole,
  PAGE_TO_HASH,
  resolvePageFromHash,
  USER_ROLES,
} from "./config/navigation";
import { useUser } from "./context/UserContext";

const OverviewPage = lazy(() => import("./pages/OverviewPage"));
const SalesAnalyticsPage = lazy(() => import("./pages/SalesAnalyticsPage"));
const MarketingAnalyticsPage = lazy(() => import("./pages/MarketingAnalyticsPage"));
const OperationsPage = lazy(() => import("./pages/OperationsPage"));
const EmployeePerformancePage = lazy(() => import("./pages/EmployeePerformancePage"));
const FinanceOverviewPage = lazy(() => import("./pages/FinanceOverviewPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const DatasetUploadPage = lazy(() => import("./pages/DatasetUploadPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

const pageToComponentMap = {
  dashboard: OverviewPage,
  sales: SalesAnalyticsPage,
  performance: EmployeePerformancePage,
  finance: FinanceOverviewPage,
  marketing: MarketingAnalyticsPage,
  operations: OperationsPage,
  reports: ReportsPage,
  upload: DatasetUploadPage,
  profile: ProfilePage,
};

const resolveAccessiblePage = (hash, role, fallbackPage) => {
  const resolvedPage = resolvePageFromHash(hash);
  if (resolvedPage && canAccessPage(role, resolvedPage)) {
    return resolvedPage;
  }
  return fallbackPage;
};

const resolveAuthPage = (hash) => {
  const normalizedHash = String(hash || "")
    .replace(/^#\/?/, "")
    .trim()
    .toLowerCase();

  return normalizedHash === "signup" ? "signup" : "login";
};

function App() {
  const { isAuthenticated, isUserLoading, user } = useUser();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [authPage, setAuthPage] = useState(() => resolveAuthPage(window.location.hash));
  const userRole = user?.role || USER_ROLES.EMPLOYEE;

  const availablePages = useMemo(() => {
    const pages = getPagesForRole(userRole);
    return pages.length ? pages : [DEFAULT_PAGE];
  }, [userRole]);

  const defaultPage = availablePages[0];

  const [activePage, setActivePage] = useState(() =>
    resolvePageFromHash(window.location.hash) || DEFAULT_PAGE
  );

  const handleNavigate = useCallback(
    (page) => {
      if (!isAuthenticated || !canAccessPage(userRole, page)) return;
      setActivePage(page);
      window.location.hash = PAGE_TO_HASH[page] || PAGE_TO_HASH[defaultPage];
    },
    [defaultPage, isAuthenticated, userRole]
  );

  useEffect(() => {
    if (isUserLoading) return;

    if (!isAuthenticated) {
      const nextAuthPage = resolveAuthPage(window.location.hash);
      setAuthPage((currentPage) => (currentPage === nextAuthPage ? currentPage : nextAuthPage));

      const nextHash = nextAuthPage === "signup" ? "#signup" : "#login";
      if (window.location.hash !== nextHash) {
        window.location.hash = nextHash;
      }
      return;
    }

    const safePage = resolveAccessiblePage(window.location.hash, userRole, defaultPage);
    setActivePage((currentPage) => (currentPage === safePage ? currentPage : safePage));

    const nextHash = PAGE_TO_HASH[safePage] || PAGE_TO_HASH[defaultPage];
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
  }, [defaultPage, isAuthenticated, isUserLoading, userRole]);

  useEffect(() => {
    const onHashChange = () => {
      if (!isAuthenticated) {
        const nextAuthPage = resolveAuthPage(window.location.hash);
        setAuthPage((currentPage) => (currentPage === nextAuthPage ? currentPage : nextAuthPage));

        const nextHash = nextAuthPage === "signup" ? "#signup" : "#login";
        if (window.location.hash !== nextHash) {
          window.location.hash = nextHash;
        }
        return;
      }

      const nextPage = resolveAccessiblePage(window.location.hash, userRole, defaultPage);
      setActivePage((currentPage) => (currentPage === nextPage ? currentPage : nextPage));

      const nextHash = PAGE_TO_HASH[nextPage] || PAGE_TO_HASH[defaultPage];
      if (window.location.hash !== nextHash) {
        window.location.hash = nextHash;
      }
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [defaultPage, isAuthenticated, userRole]);

  const ActivePageComponent = useMemo(
    () => pageToComponentMap[activePage] || OverviewPage,
    [activePage]
  );

  if (isUserLoading) {
    return (
      <div className="app-shell min-h-screen">
        <PageLoader />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authPage === "signup") {
      return <Signup onSwitchToLogin={() => (window.location.hash = "#login")} />;
    }

    return <Login onSwitchToSignup={() => (window.location.hash = "#signup")} />;
  }

  return (
    <div className="app-shell min-h-screen">
      <div className="app-layout flex min-h-screen flex-col overflow-hidden lg:h-screen lg:flex-row">
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        <main className="app-main flex-1 overflow-x-hidden overflow-y-auto">
          <AppHeader activePage={activePage} onNavigate={handleNavigate} />

          <Suspense fallback={<PageLoader />}>
            <ActivePageComponent />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;
