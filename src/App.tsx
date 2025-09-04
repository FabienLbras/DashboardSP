import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { User } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import SignIn from "./pages/AuthPages/SignIn";
import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Home from "./pages/Dashboard/Home";
import Transactions from "./pages/Transactions";
import UserProfiles from "./pages/UserProfiles";
import { UserContext } from "./context/UserContext";
import { ExtendedUser } from "./types/User";
import Terminals from "./pages/Terminals";

const saveUserData = async (user: User) => {
  const userRef = doc(db, "users", user.uid);
  const existingDoc = await getDoc(userRef);
  if (!existingDoc.exists()) {
    await setDoc(userRef, {
      firstName: "Linda",
      lastName: "Groot",
      email: user.email,
      createdAt: new Date(),
    });
  }
};

export default function App() {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      await saveUserData(firebaseUser);
      const userRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userRef);
      const data = userDoc.data();
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        firstName: data?.firstName,
        lastName: data?.lastName,
      });
    } else {
      setUser(null);
    }
    setLoading(false);
  });
  return () => unsubscribe();
}, []);

  if (loading) return <div className="text-center py-20 text-xl">Loading...</div>;

  return (
    <UserContext.Provider value={user}>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="profile" element={<UserProfiles />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="terminals" element={<Terminals />} />
        </Route>
        <Route path="*" element={<Navigate to={user ? "/" : "/signin"} />} />
      </Routes>
    </UserContext.Provider>
  );
}