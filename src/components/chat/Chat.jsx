import { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore"; // Đảm bảo tên tệp và đường dẫn chính xác
import upload from "../../lib/upload"; // Import the upload function
import "./chat.css";

const Chat = () => {
  const [chat, setChat] = useState(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [imgs, setImgs] = useState([]);
  const [selectedImg, setSelectedImg] = useState(null); // Thêm state cho ảnh được chọn

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    if (!chatId) return;

    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      if (res.exists()) {
        setChat(res.data());
      } else {
        setDoc(doc(db, "chats", chatId), { messages: [] });
      }
    });

    return () => {
      unSub();
    };
  }, [chatId]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  const handleImg = async (e) => {
    if (e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files).map((file) => file);
      setImgs(filesArray);
      await handleSend(filesArray, text);
    }
  };

  const handleSend = async (images = imgs, messageText = "") => {
    if (messageText === "" && images.length === 0) return;

    let imgUrls = [];

    try {
      if (images.length > 0) {
        const uploadPromises = images.map((img) => upload(img));
        imgUrls = await Promise.all(uploadPromises);
      }

      if (messageText !== "" || imgUrls.length > 0) {
        const messageData = {
          senderId: currentUser.id,
          text: messageText,
          createdAt: new Date(),
          imgs: imgUrls, // Add image URLs to message data
        };

        // Nếu không có nội dung tin nhắn, xóa thuộc tính text
        if (messageText === "") {
          delete messageData.text;
        }

        const chatRef = doc(db, "chats", chatId);
        const chatDoc = await getDoc(chatRef);
        if (!chatDoc.exists()) {
          await setDoc(chatRef, { messages: [] });
        }

        await updateDoc(chatRef, {
          messages: arrayUnion(messageData),
        });

        const userIDs = [currentUser.id, user.id];

        userIDs.forEach(async (id) => {
          const userChatsRef = doc(db, "userchats", id);
          const userChatsSnapshot = await getDoc(userChatsRef);

          if (userChatsSnapshot.exists()) {
            const userChatsData = userChatsSnapshot.data();
            const chatIndex = userChatsData.chats.findIndex((c) => c.chatId === chatId);

            if (chatIndex >= 0) {
              userChatsData.chats[chatIndex].lastMessage = messageText || "Image";
              userChatsData.chats[chatIndex].isSeen = id === currentUser.id ? true : false;
              userChatsData.chats[chatIndex].updatedAt = Date.now();
            } else {
              userChatsData.chats.push({
                chatId,
                lastMessage: messageText || "Image",
                isSeen: id === currentUser.id ? true : false,
                updatedAt: Date.now(),
              });
            }

            await updateDoc(userChatsRef, {
              chats: userChatsData.chats,
            });
          } else {
            await setDoc(userChatsRef, {
              chats: [
                {
                  chatId,
                  lastMessage: messageText || "Image",
                  isSeen: id === currentUser.id ? true : false,
                  updatedAt: Date.now(),
                },
              ],
            });
          }
        });
      }
    } catch (err) {
      console.log(err);
    }

    setImgs([]);
    setText("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend(imgs, text);
    }
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.jpg"} alt="" />
          <div className="texts">
            <span>{user.username}</span>
            <p>Online 1 minute before</p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="" />
          <img src="./video.png" alt="" />
          <img src="./info.png" alt="" />
        </div>
      </div>
      <div className="center">
        {chat?.messages?.map((message, index) => (
          <div
            className={message.senderId === currentUser?.id ? "message own" : "message"}
            key={index}
          >
            <div className="texts">
              {message.imgs &&
                message.imgs.map((img, index) => (
                  <img
                    src={img}
                    alt=""
                    key={index}
                    onClick={() => setSelectedImg(img)} // Thêm sự kiện onClick
                  />
                ))}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
        {imgs.map((img, index) => (
          <div className="message own" key={index}>
            <div className="texts">
              <img src={URL.createObjectURL(img)} alt="" />
            </div>
          </div>
        ))}

        <div ref={endRef}></div>
      </div>
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="" />
          </label>

          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImg}
            multiple
          />
          <img src="./camera.png" alt="" />
          <img src="./mic.png" alt="" />
        </div>
        <input
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? "You cannot send a message"
              : "Type a message..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />

        <div className="emoji">
          <img
            src="./emoji.png"
            alt=""
            onClick={() => setOpen((prev) => !prev)}
          />
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
          </div>
        </div>
        <button
          className="sendButton"
          onClick={() => handleSend(imgs, text)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        >
          Send
        </button>
      </div>

      {selectedImg && (
        <div className="modal" onClick={() => setSelectedImg(null)}>
          <span className="close">&times;</span>
          <img className="modal-content" src={selectedImg} alt="" />
        </div>
      )}
    </div>
  );
};

export default Chat;
