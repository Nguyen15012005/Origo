import { doc, getDoc } from "firebase/firestore";
import { create } from "zustand";
import { db } from "./firebase";

export const useUserStore = create((set) => ({
  currentUser: null,
  isLoading: true,
  error: null,

  fetchUserInfo: async (uid) => {
    if (!uid) return set({ currentUser: null, isLoading: false });

    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        set({ currentUser: docSnap.data(), isLoading: false, error: null });
      } else {
        set({ currentUser: null, isLoading: false, error: "User not found" });
      }
    } catch (err) {
      console.log(err);
      set({ currentUser: null, isLoading: false, error: err.message });
    }
  },
}));
