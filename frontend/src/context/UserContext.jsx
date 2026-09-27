import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  fetchCurrentUser,
  loginWithEmail,
  logoutUser,
  persistUser,
  removeAvatarForCurrentUser,
  readStoredUser,
  signupWithEmail,
  updateProfileForCurrentUser,
  updateAvatarForCurrentUser,
} from "../services/userService";

const UserContext = createContext({
  user: null,
  isAuthenticated: false,
  isUserLoading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  updateAvatar: async () => {},
  removeAvatar: async () => {},
  updateProfile: async () => {},
  updateUser: () => {},
});

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const fetchedUser = await fetchCurrentUser();
        if (isMounted) {
          setUser(fetchedUser);
          if (fetchedUser) {
            persistUser(fetchedUser);
          }
        }
      } finally {
        if (isMounted) {
          setIsUserLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const nextUser = await loginWithEmail({ email, password });
    setUser(nextUser);
    return nextUser;
  }, []);

  const signup = useCallback(async ({ name, email, password, role }) => {
    const nextUser = await signupWithEmail({ name, email, password, role });
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    logoutUser();
    setUser(null);
  }, []);

  const updateAvatar = useCallback(async (avatarDataUrl) => {
    const nextUser = await updateAvatarForCurrentUser(avatarDataUrl);
    setUser(nextUser);
    return nextUser;
  }, []);

  const removeAvatar = useCallback(async () => {
    const nextUser = await removeAvatarForCurrentUser();
    setUser(nextUser);
    return nextUser;
  }, []);

  const updateProfile = useCallback(async ({ name, email }) => {
    const nextUser = await updateProfileForCurrentUser({ name, email });
    setUser(nextUser);
    return nextUser;
  }, []);

  const updateUser = useCallback((updates) => {
    if (!updates || !user) return;

    setUser((currentUser) => {
      if (!currentUser) return currentUser;
      const nextUser = { ...currentUser, ...updates };
      persistUser(nextUser);
      return nextUser;
    });
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isUserLoading,
      login,
      signup,
      logout,
      updateAvatar,
      removeAvatar,
      updateProfile,
      updateUser,
    }),
    [isUserLoading, login, logout, removeAvatar, signup, updateAvatar, updateProfile, updateUser, user]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
