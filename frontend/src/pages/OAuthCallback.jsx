import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken) {
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      
      {/* Centered Box */}
      <div className="text-center bg-white px-6 py-8 rounded-xl shadow-md">
        
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Signing you in...
        </h2>

        <p className="text-sm text-gray-500">
          Please wait while we redirect you
        </p>

      </div>
    </div>
  );
}