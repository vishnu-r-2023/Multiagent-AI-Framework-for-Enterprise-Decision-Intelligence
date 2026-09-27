import { ThemeProvider } from "./ThemeContext";
import { UserProvider, useUser } from "./UserContext";
import { AnalyticsProvider } from "./AnalyticsContext";

function AnalyticsGate({ children }) {
  const { isAuthenticated } = useUser();

  if (!isAuthenticated) {
    return children;
  }

  return <AnalyticsProvider>{children}</AnalyticsProvider>;
}

function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <UserProvider>
        <AnalyticsGate>{children}</AnalyticsGate>
      </UserProvider>
    </ThemeProvider>
  );
}

export default AppProviders;
