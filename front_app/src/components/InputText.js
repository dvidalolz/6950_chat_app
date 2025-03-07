import React, { useState } from 'react';


// Typing box, click send passes message back to chatContainer (addMessage) parameter
const InputText = ({ addMessage }) => {
  const [message, setMessage] = useState('');

  const sendMessage = () => {
    addMessage(message); // send message to chatcontainer
    setMessage(''); // clear box
  };

  return (
    <div className="inputtext_container">
      <textarea
        name="message"
        id="message"
        rows="6"
        placeholder="Hello"
        value={message}
        onChange={(e) => setMessage(e.target.value)} // update as you type
      ></textarea>
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default InputText;