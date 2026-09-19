import { createContext, useContext, useEffect, useReducer } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, db } from "../config/firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import authReducer, { initialState } from "../reducers/AuthReducer";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  async function signup(email, password, firstName, lastName) {
    try {
      dispatch({ type: "SET_ERROR", payload: null });
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        emailLower: email.toLowerCase(),
        firstName,
        lastName,
        createdAt: serverTimestamp(),
      });

      return userCredential;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  }

  function login(email, password) {
    dispatch({ type: "SET_ERROR", payload: null });
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      dispatch({ type: "SET_ERROR", payload: null });
      const result = await signInWithPopup(auth, provider);
      await setDoc(
        doc(db, "users", result.user.uid),
        {
          email: result.user.email,
          emailLower: result.user.email.toLowerCase(),
          name: result.user.displayName,
          lastLogin: new Date(),
        },
        { merge: true }
      );
      return result;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  }

  function logout() {
    return signOut(auth);
  }

  async function fetchUserData(uid) {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        dispatch({ type: "SET_USER_DATA", payload: userDoc.data() });
      }
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      dispatch({ type: "SET_CURRENT_USER", payload: user });
      if (user) {
        fetchUserData(user.uid);
      } else {
        dispatch({ type: "SET_USER_DATA", payload: null });
      }
      dispatch({ type: "SET_LOADING", payload: false });
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser: state.currentUser,
    userData: state.userData,
    loading: state.loading,
    error: state.error,
    signup,
    login,
    loginWithGoogle,
    logout,
    dispatch,
  };

  return (
    <AuthContext.Provider value={value}>
      {!state.loading && children}
    </AuthContext.Provider>
  );
}
