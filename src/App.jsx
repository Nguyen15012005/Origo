import React, { useEffect } from "react";
import Chat from "./components/chat/Chat";
import List from "./components/list/List";
import Detail from "./components/detail/Detail";
import Login from "./components/login/Login";
import Notification from "./components/notification/Notification";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { useUserStore } from "./lib/userStore";
import "./index.css";
import { useChatStore } from "./lib/chatStore";

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      fetchUserInfo(user?.uid);
    });

    return () => {
      unSub();
    };
  }, [fetchUserInfo]);

  if (isLoading) return <div className="loading">Loading...</div>;

  return (
    <div className="grid">
      <div className="container">
        {currentUser ? (
          <>
            <List />
            <div className="chat .hide-on-mobile">{chatId && <Chat />}</div>
            <div className="detail hide-on-mobile-tablet">
              {chatId && <Detail />}
            </div>
          </>
        ) : (
          <Login />
        )}
        <Notification />
      </div>
    </div>
  );
};

export default App;
