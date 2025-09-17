import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";
import * as authService from "../services/authService"; // Dùng authService thật để lưu vào Firestore

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Safe wrappers / fallbacks nếu authService thiếu hàm
const safeOnAuthStateChange =
  typeof authService.onAuthStateChange === "function"
    ? authService.onAuthStateChange
    : (cb) => {
        console.warn(
          "authService.onAuthStateChange not implemented; defaulting to null user"
        );
        cb(null);
        return () => {};
      };

const safeLoginUser =
  typeof authService.loginUser === "function"
    ? authService.loginUser
    : async (email, password) => {
        console.warn("authService.loginUser not implemented");
        return { success: false, error: "loginUser not implemented" };
      };

const safeLogoutUser =
  typeof authService.logoutUser === "function"
    ? authService.logoutUser
    : async () => {
        console.warn("authService.logoutUser not implemented");
        return { success: false, error: "logoutUser not implemented" };
      };

const safeRegisterUser =
  typeof authService.registerUser === "function"
    ? authService.registerUser
    : async (email, password, userData) => {
        console.warn("authService.registerUser not implemented");
        return { success: false, error: "registerUser not implemented" };
      };

const safeCheckPermission =
  typeof authService.checkPermission === "function"
    ? authService.checkPermission
    : (role, requiredRole) => {
        if (!role) return false;
        if (role === "admin") return true;
        return role === requiredRole;
      };

const safeGetDefaultRoute =
  typeof authService.getDefaultRoute === "function"
    ? authService.getDefaultRoute
    : (role) => {
        if (!role) return "/login";
        if (role === "admin") return "/admin";
        if (role === "teacher") return "/teacher";
        if (role === "student") return "/student";
        return "/dashboard";
      };

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const mountedRef = useRef(false);
  const lastUserIdRef = useRef(undefined);

  useEffect(() => {
    mountedRef.current = true;
    console.debug("AuthProvider mount - init auth listener");

    let unsubscribe = () => {};
    try {
      unsubscribe = safeOnAuthStateChange((user) => {
        // Normalize id for comparison
        const newId = user ? user.id || user.uid || null : null;

        // Ignore duplicate consecutive events (avoids repeated null logs/updates)
        if (lastUserIdRef.current === newId) {
          // nothing changed
          return;
        }

        lastUserIdRef.current = newId;

        // Log only on real changes
        console.info(
          "Auth state changed:",
          newId ? { id: newId, email: user.email } : null
        );

        if (!mountedRef.current) return;

        setCurrentUser(user || null);
        setIsAuthenticated(!!user);
        setLoading(false);
      });
    } catch (err) {
      console.error("AuthProvider: safeOnAuthStateChange threw", err);
      // ensure we still settle loading
      if (mountedRef.current) {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setLoading(false);
      }
    }

    return () => {
      mountedRef.current = false;
      try {
        if (typeof unsubscribe === "function") unsubscribe();
      } catch (err) {
        console.warn("Error while unsubscribing auth listener", err);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = await safeLoginUser(email, password);
      if (result && result.success) {
        // update local state immediately to reflect login (safe)
        if (mountedRef.current) {
          setCurrentUser(result.user);
          setIsAuthenticated(true);
        }
      }
      return result;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const result = await safeLogoutUser();
      if (result && result.success && mountedRef.current) {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
      return result;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const register = async (email, password, userData) => {
    setLoading(true);
    try {
      const result = await safeRegisterUser(email, password, userData);
      if (result && result.success && mountedRef.current) {
        setCurrentUser(result.user);
        setIsAuthenticated(true);
      }
      return result;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const hasRole = (role) => currentUser?.role === role;

  const hasPermission = (requiredRole) => {
    if (!currentUser?.role) return false;
    return safeCheckPermission(currentUser.role, requiredRole);
  };

  const getDefaultRoute = () => {
    if (!currentUser?.role) return "/login";
    return safeGetDefaultRoute(currentUser.role);
  };

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated,
      loading,
      login,
      logout,
      register,
      hasRole,
      hasPermission,
      getDefaultRoute,
    }),
    [currentUser, isAuthenticated, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
