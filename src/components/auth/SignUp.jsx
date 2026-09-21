import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/Auth.css";

export default function SignUp() {
  const { signup, loginWithGoogle, error, loading, dispatch } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return dispatch({ type: "SET_ERROR", payload: "Passwords do not match" });
    }

    try {
      dispatch({ type: "SET_ERROR", payload: "" });
      dispatch({ type: "SET_LOADING", payload: true });
      await signup(email, password, firstName, lastName);
      navigate("/dashboard");
    } catch (error) {
      console.error("Signup error:", error);
      switch (error.code) {
        case "auth/email-already-in-use":
          dispatch({
            type: "SET_ERROR",
            payload: "This email is already registered",
          });
          break;
        case "auth/weak-password":
          dispatch({
            type: "SET_ERROR",
            payload: "Password should be at least 6 characters",
          });
          break;
        case "auth/invalid-email":
          dispatch({ type: "SET_ERROR", payload: "Invalid email address" });
          break;
        default:
          dispatch({
            type: "SET_ERROR",
            payload: "Failed to create an account. Please try again.",
          });
      }
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }

  // ******************************************************

  async function handleGoogleSignUp() {
    try {
      dispatch({ type: "SET_ERROR", payload: "" });
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (error) {
      console.error("Google sign-up error:", error);
      if (error.code !== "auth/popup-closed-by-user") {
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to sign up with Google. Please try again.",
        });
      }
    }
  }

  // ******************************************************
  // ******************************************************

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button disabled={loading} type="submit">
          Sign Up
        </button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <button
        type="button"
        className="google-btn"
        onClick={handleGoogleSignUp}
      >
        <FcGoogle size={20} /> Sign up with Google
      </button>

      <p className="auth-redirect">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
