"use client";
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { X, MoveRight, RotateCcw } from "lucide-react";
import useWindowSize from "react-use/lib/useWindowSize";
import Confetti from "react-confetti";
import { flushSync } from "react-dom";
function App() {
  const { width, height } = useWindowSize();
  const [socket, setSocket] = useState();
  const [isConnectedToRoom, setIsConnectedToRoom] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showOldModal, setShowOldModal] = useState(false);
  const [roomId, setRoomID] = useState("");
  const [winner, setWinner] = useState("");
  const [board, setBoard] = useState(["", "", "", "", "", "", "", "", ""]);
  const winState = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  const [isP1, setIsP1] = useState(false);
  const [isTurn, setIsTurn] = useState(isP1 ? true : false);
  useEffect(() => {
    const connectToSocket = async () => {
      const res = await fetch("/api/socket");
      setSocket(io());
    };
    connectToSocket();
  }, []);

  useEffect(() => {
    if (isConnectedToRoom) {
      const unPlayed = board.filter((cell) => cell === "");
      if (unPlayed.length === 0) setWinner("its a tie");
      else {
        winState.forEach((state) => {
          const [a, b, c] = state;
          if (
            board[a] !== "" &&
            board[a] === board[b] &&
            board[a] === board[c]
          ) {
            setWinner(`${board[a]} Won 🎉`);
            console.log(`${board[a]} Won 🎉`);
          }
        });
      }
    }
  }, [board, isConnectedToRoom]);

  useEffect(() => {
    const onRoomJoin = (board) => {
      console.log("room join triggered");
      setBoard(board);
    };
    const onTurn = (board) => {
      console.log("turn triggered");
      setIsTurn((prevIsTurn) => !prevIsTurn);
      setBoard(board);
    };
    const onRestart = () => {
      console.log("restart triggered");

      setBoard(["", "", "", "", "", "", "", "", ""]);
      // if (isP1) setIsTurn(true);
      // if (!isP1) setIsTurn(false);
      setWinner("");
    };
    if (socket) {
      socket.on("turn", onTurn);
      socket.on("RoomConnect", onRoomJoin);
      socket.on("restart", onRestart);
      return () => {
        socket.off("turn", onTurn);
        socket.off("RoomConnect", onRoomJoin);
        socket.off("restart", onRestart);
      };
    }
  }, [socket]);

  const handleNew = () => {
    socket.emit("joinRoom", roomId);
    setIsConnectedToRoom(true);
    setIsP1(true);
    setShowNewModal(false);
    setIsTurn(true);
  };
  const handleOld = () => {
    socket.emit("joinRoom", roomId);
    socket.on("turn", (board) => setBoard(board));
    setIsP1(false);
    setShowOldModal(false);
    setIsConnectedToRoom(true);
  };
  const handleClick = (index) => {
    console.log(isTurn);
    if (isTurn && board[index] === "" && winner === "") {
      const value = isP1 ? "X" : "O";
      const newBoard = [...board];
      newBoard[index] = value;
      socket.emit("play", { board: newBoard, roomId });
      setBoard(newBoard);
    }
  };
  const handleRestart = () => socket.emit("restart", roomId);

  useEffect(
    () => console.log({ isP1, isTurn, board, winner }),
    [isP1, isTurn, board, winner]
  );
  if (isConnectedToRoom) {
    return (
      <div className="w-screen h-screen grid">
        {winner !== "" && (
          <>
            {winner !== "its a tie" && (
              <Confetti height={height} width={width} />
            )}
            <div className="absolute top-20 w-full">
              <div className="w-fit  text-center text-xl bg-slate-300/30 border border-slate-300 rounded-md p-4 mx-auto">
                <h1>{winner}</h1>
              </div>
            </div>
          </>
        )}
        <div className=" place-self-center w-fit flex flex-col gap-6 justify-center items-center">
          <h1>{isTurn ? "Your Turn" : "Opponent's Turn"}</h1>
          <div className="  w-fit grid grid-cols-3 gap-2">
            {board.map((value, index) => (
              <div
                key={index}
                className="bg-gray-300/50 border border-gray-300 w-20 rounded-md h-20 shadow-inner shadow-black flex justify-center items-center"
                onClick={() => {
                  handleClick(index);
                }}
              >
                {value}
              </div>
            ))}
          </div>
          {winner && (
            <button
              className="bg-stone-300/60 border border-stone-300 rounded-md py-2 w-24 flex"
              onClick={handleRestart}
            >
              Play Again
              <RotateCcw />
            </button>
          )}
        </div>
      </div>
    );
  } else {
    return (
      <div className="h-screen w-screen grid">
        <div className=" place-self-center bg-gray-300/50 border border-gray-300 rounded-md p-8 ">
          <h1>Welcome please Connect to a Room</h1>
          <div className="flex gap-3 mt-4">
            <button
              className="bg-white text-black w-36 rounded-md py-2"
              onClick={() => setShowNewModal(true)}
            >
              New
            </button>
            <button
              className="bg-white text-black w-36 rounded-md py-2"
              onClick={() => setShowOldModal(true)}
            >
              Existing
            </button>
          </div>
        </div>
        {showNewModal && (
          <div className="absolute h-screen w-screen top-0 left-0 bg-black/30 backdrop-blur-xl grid">
            <div className=" place-self-center bg-gray-300/70 border border-gray-300 rounded-md p-8 w-fit relative">
              <X
                className="text-black absolute top-2 right-2"
                onClick={() => setShowNewModal(false)}
              />
              <div className="bg-none p-2 rounded-full flex gap-2 border border-black ">
                <input
                  className="outline-none rounded-md text-black bg-transparent placeholder:text-gray-800"
                  value={roomId}
                  onChange={(e) => setRoomID(e.target.value)}
                  placeholder="Enter Room ID"
                  autoFocus
                  onKeyUp={(e) => e.keyCode === 13 && handleNew()}
                />
                <div
                  className="text-black bg-white rounded-full p-1"
                  onClick={handleNew}
                >
                  <MoveRight />
                </div>
              </div>
            </div>
          </div>
        )}
        {showOldModal && (
          <div className="absolute h-screen w-screen top-0 left-0 bg-black/30 backdrop-blur-xl grid">
            <div className=" place-self-center bg-gray-300/70 border border-gray-300 rounded-md p-8 w-fit relative">
              <X
                className="text-black absolute top-2 right-2"
                onClick={() => setShowOldModal(false)}
              />
              <div className="bg-none p-2 rounded-full flex gap-2 border border-black ">
                <input
                  className="outline-none rounded-md text-black bg-transparent placeholder:text-gray-800"
                  value={roomId}
                  onChange={(e) => setRoomID(e.target.value)}
                  placeholder="Enter Room ID"
                  autoFocus
                  onKeyUp={(e) => e.keyCode === 13 && handleOld()}
                />
                <div
                  className="text-black bg-white rounded-full p-1"
                  onClick={handleOld}
                >
                  <MoveRight />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default App;
