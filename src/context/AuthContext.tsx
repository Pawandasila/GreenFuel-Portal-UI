import { createContext, ReactNode, useEffect, useState } from "react";
import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";

interface UserInfoType {
  id: number;
  last_login: string | null;
  is_superuser?: boolean;
  username: string;
  first_name?: string;
  last_name?: string;
  is_staff: boolean;
  is_active?: boolean;
  date_joined: string;
  email: string;
  name: string;
  dob: string | null;
  department: number | string | null;
  employee_code: string | null;
  designation: number | string | null;
  groups?: any[];
  user_permissions?: any[];
  role?: string | null;
  contact?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  status?: boolean;
  is_budget_requester?: boolean;
  is_deleted?: boolean;
  business_unit?: number | string;
}

interface AccessTokenType {
  access: string;
  refresh: string;
}

interface LoginResponseType {
  success: boolean;
  message: string;
}

interface GFContextType {
  authToken: AccessTokenType | null;
  setAuthToken: Dispatch<SetStateAction<AccessTokenType | null>>;
  logout: () => void;
  baseURL: string;
  userInfo: UserInfoType | null;
  setUserInfo: Dispatch<SetStateAction<UserInfoType | null>>;
  login: (email: string, password: string) => Promise<LoginResponseType>;
}

export type { GFContextType, UserInfoType, LoginResponseType };

const GFContext = createContext<GFContextType>({
  authToken: null,
  setAuthToken: () => {},
  logout: () => {},
  baseURL: "",
  userInfo: null,
  setUserInfo: () => {},
  login: async () => ({ success: false, message: "" }),
});

const GFProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Determine if we're in production environment
  const isProduction = process.env.NODE_ENV === 'production' || 
    (typeof window !== 'undefined' && (
      window.location.hostname === 'sugamgreenfuel.in' ||
      window.location.hostname.includes('sugamgreenfuel')
    ));
    
  // Use environment variable for API URL, with fallback depending on environment
  const baseURL = isProduction
    ? 'http://api.sugamgreenfuel.in'
    : (process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:8000');
    
  // Log the base URL and environment for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('AuthContext NODE_ENV:', process.env.NODE_ENV);
      console.log('AuthContext isProduction:', isProduction);
      console.log('AuthContext hostname:', window.location.hostname);
      console.log('AuthContext using baseURL:', baseURL);
    }
  }, [baseURL, isProduction]);

  const router = useRouter();
  const [authToken, setAuthToken] = useState<AccessTokenType | null>(
    typeof window !== "undefined" && localStorage.getItem("accessToken")
      ? JSON.parse(
          (typeof window !== "undefined" &&
            localStorage.getItem("accessToken")) ||
            "{}"
        )
      : null
  );

  const [userInfo, setUserInfo] = useState<UserInfoType | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserInfo = localStorage.getItem("userInfo");
      if (storedUserInfo) {
        setUserInfo(JSON.parse(storedUserInfo));
      }
    }
  }, []);

  const userLogin = async (
    email: string,
    password: string
  ): Promise<LoginResponseType> => {
    try {
      const response = await fetch(baseURL + `/auth/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      if(response.status === 400){
        const errorData = await response.json();
        console.log("Login error:", errorData);
        return {
          success: false,
          message: errorData.detail || "Invalid credentials",
        };
      }

      if (response.status === 200) {
        const tokenData = await response.json();
        setAuthToken(tokenData);
        localStorage.setItem("accessToken", JSON.stringify(tokenData));

        const userResponse = await fetch(baseURL + `/auth/user/`, {
          headers: {
            Authorization: `Bearer ${tokenData.access}`,
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserInfo(userData);
          localStorage.setItem("userInfo", JSON.stringify(userData));

          if (userData.role) {
            document.cookie = `user_role=${encodeURIComponent(userData.role)}; path=/`;
          }
        }

        router.push("/dashboard");
        // alert("Login successful");
        return { success: true, message: "Login successful" };
      } else {
        if (response.status === 401) {
          return { success: false, message: "Invalid email or password" };
        } else if (response.status === 403) {
          return { success: false, message: "Your account is inactive" };
        } else {
          const errorData = await response.json().catch(() => ({}));
          return {
            success: false,
            message: errorData.detail || "Login failed. Please try again.",
          };
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Network error. Please check your connection.",
      };
    }
  };

  const userLogout = () => {
    setAuthToken(null);
    setUserInfo(null);
    typeof window !== "undefined" && localStorage.removeItem("accessToken");
    typeof window !== "undefined" && localStorage.removeItem("userInfo");
    router.push("/auth/login");
  };

  const contextData: GFContextType = {
    authToken,
    setAuthToken,
    logout: userLogout,
    baseURL,
    userInfo,
    setUserInfo,
    login: userLogin,
  };

  return (
    <GFContext.Provider value={contextData}>{children}</GFContext.Provider>
  );
};

export { GFContext, GFProvider };
