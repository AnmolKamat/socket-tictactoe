import { Server } from "socket.io";
let board = ["", "", "", "", "", "", "", "", ""];
const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    const io = res.socket.server.io;
    console.log("Socket is already running");
    io.on("connect", (socket) => {
      console.log(`${socket.id} connected to socket`);
      socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
        console.log(`${socket.id} connected to ${roomId}`);
        io.to(roomId).emit("RoomConnect", board);
      });
      socket.on("play", (obj) => {
        try {
          const { roomId } = obj;
          board = obj.board;
          console.log(obj);
          io.to(roomId).emit("turn", board);
        } catch (error) {
          console.error("Error in play event:", error);
        }
      });
      socket.on("restart", (roomId) => {
        board = ["", "", "", "", "", "", "", "", ""];
        io.to(roomId).emit("restart");
      });
    });
  } else {
    try {
      console.log("Socket is initializing");
      const io = new Server(res.socket.server);
      res.socket.server.io = io;
    } catch (error) {
      console.error("Error initializing Socket.IO:", error);
    }
  }
  res.end();
};

export default SocketHandler;
