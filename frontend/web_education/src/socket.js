// src/socket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  autoConnect: false, // vì bạn sẽ gọi .connect() thủ công
  transports: ["websocket"], // tránh lỗi polling
});

export default socket;
