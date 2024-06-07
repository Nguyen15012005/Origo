import { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./login.css";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../lib/firebase"; 
import { doc, setDoc } from "firebase/firestore";
import upload from "../../lib/upload";

const Login = () => {
    const [avatar, setAvatar] = useState({
        file: null,
        url: ""
    });

    const [isSignUp, setIsSignUp] = useState(false);

    const [loading, setLoading] = useState(false);

    const handleAvatar = (e) => {
        if (e.target.files[0]) {
            setAvatar({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            });
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const { username, email, password, passwordConfirm } = Object.fromEntries(formData.entries());

        if (password !== passwordConfirm) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            setLoading(true);
            const res = await createUserWithEmailAndPassword(auth, email, password);

            const imgUrl = await upload(avatar.file);

            await setDoc(doc(db, "users", res.user.uid), {
                username,
                email,
                avatar: imgUrl,
                id: res.user.uid,
                blocked: [],
            });

            await setDoc(doc(db, "userchats", res.user.uid), {
                chats: [],
            });

            toast.success("Account created! You can login now!");
        } catch (err) {
            console.log(err);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.target);
        const { email, password } = Object.fromEntries(formData.entries());

        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success("Login successful!");
        } catch (err) {
            console.log(err);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleForm = () => {
        setIsSignUp((prev) => !prev);
    };

    return (
        <div className="login">
            <div className="item" style={{ display: isSignUp ? "none" : "flex" }}>
                <img src="./favicon/favicon.png" alt="" className="logo" />
                <h2>title</h2>
                <form onSubmit={handleLogin}>
                    <input type="email" placeholder="email" name="email" required />
                    <input type="password" placeholder="password" name="password" required />
                    <br />
                    <div className="button-add">
                        <button disabled={loading} type="submit">{loading ? loading : "Login"}</button>
                        <button type="button" onClick={toggleForm}>Register</button>
                    </div>
                </form>
            </div>
            <div className="separator" style={{ display: isSignUp ? "none" : "block" }}></div>
            <div className="item2" style={{ display: isSignUp ? "flex" : "none" }}>
                <img src="./favicon/favicon.png" alt="" className="logo" />
                <h2>registerTitle</h2>
                <form onSubmit={handleRegister}>
                    <label htmlFor="file">
                        <img src={avatar.url || "./avatar.jpg"} alt="Avatar" />
                        uploadAvatar
                    </label>
                    <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} />
                    <input type="text" placeholder="username" name="username" required />
                    <input type="email" placeholder="email" name="email" required />
                    <input type="password" placeholder="password" name="password" required />
                    <input type="password" placeholder="confirmPassword" name="passwordConfirm" required />
                    <br />
                    <div className="button-add">
                        <button type="button" onClick={toggleForm}>Back To Login</button>
                        <button disabled={loading} type="submit">{loading ? loading : "Register"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
