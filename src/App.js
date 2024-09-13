import React, { useRef, useState, useEffect } from 'react';
import './App.css';

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, orderBy, query, doc, setDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyCNEG1Ow7NwLrQ7o285D8By1qpqZq2TZkg",
  authDomain: "chat-7b1fe.firebaseapp.com",
  projectId: "chat-7b1fe",
  storageBucket: "chat-7b1fe.appspot.com",
  messagingSenderId: "1090772037403",
  appId: "1:1090772037403:web:1b1e9ec48b7de2f5f9adbe",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);


function App() {
  const [user] = useAuthState(auth);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (user) {
      
      const saveUserToFirestore = async () => {
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png',
        }, { merge: true });
      };
      saveUserToFirestore();
    }
  }, [user]);

  return (
    <div className="App">
      <header>
        <h1>♾️</h1>
        <SignOut />
      </header>

      <section>
        {user ? (
          selectedUser ? (
            <ChatRoom selectedUser={selectedUser} setSelectedUser={setSelectedUser} />
          ) : (
            <ChatBlock setSelectedUser={setSelectedUser} />
          )
        ) : (
          <SignIn />
        )}
      </section>
    </div>
  );
}


function SignIn() {
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  return (
    <>
      <button className="sign-in" onClick={signInWithGoogle}>
        Sign in with Google
      </button>
      <h1>Welcome to Infinilink</h1>
      <h4>The place to chat with real online people</h4>
    </>
  );
}


function SignOut() {
  return auth.currentUser && (
    <button className="sign-out" onClick={() => signOut(auth)}>
      Sign Out
    </button>
  );
}


function ChatBlock({ setSelectedUser }) {
  const usersRef = collection(firestore, 'users');
  const usersQuery = query(usersRef);
  const [users] = useCollectionData(usersQuery, { idField: 'uid' });

  return (
    <div className="chat-block">
      <h1>Select a User to Chat</h1>
      {users && users.length > 0 ? (
        users.map((user) => (
          <div key={user.uid} className="user-card" onClick={() => setSelectedUser(user)}>
            <img src={user.photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'} alt="Avatar" />
            <h4>{user.displayName}</h4>
          </div>
        ))
      ) : (
        <p>No Online user</p>
      )}
    </div>
  );
}


function ChatRoom({ selectedUser, setSelectedUser }) {
  const dummy = useRef();
  const messagesRef = collection(firestore, 'messages');

  
  const messagesQuery = query(
    messagesRef,
    orderBy('createdAt') 
  );

  const [messages] = useCollectionData(messagesQuery, { idField: 'id' });
  const [formValue, setFormValue] = useState('');

  const sendMessage = async (e) => {
    e.preventDefault();
    const { uid, photoURL, displayName } = auth.currentUser;

    await addDoc(messagesRef, {
      text: formValue,
      createdAt: serverTimestamp(),
      uid,
      receiverUid: selectedUser.uid,
      photoURL,
      displayName,
    });

    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <header>
        <button onClick={() => setSelectedUser(null)}>Back</button>
        <h3>... {selectedUser.displayName}</h3>
      </header>
      <main>
        {messages && messages.length > 0 ? (
          messages
            .filter(
              (msg) =>
                (msg.uid === auth.currentUser.uid && msg.receiverUid === selectedUser.uid) ||
                (msg.uid === selectedUser.uid && msg.receiverUid === auth.currentUser.uid)
            )
            .map((msg) => <ChatMessage key={msg.id} message={msg} />)
        ) : (
          <p>Empty</p>
        )}
        <span ref={dummy}></span>
      </main>

      <form onSubmit={sendMessage}>
        <input
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder="<...>"
        />
        <button type="submit" disabled={!formValue}>
          📩
        </button>
      </form>
    </>
  );
}


function ChatMessage({ message }) {
  const { text, uid, photoURL } = message;
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  return (
    <>
      <div className={`message ${messageClass}`}>
        <img src={photoURL || 'src\sky.jpg'} alt="Avatar" />
        <p>{text}</p>
      </div>
    </>
  );
}

export default App;
