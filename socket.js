let io;

module.exports = {
  init: (httpServer) => {
    // //io = require("socket.io")(server);: Đoạn mã này tạo một máy chủ WebSocket bằng cách sử dụng Socket.io và liên kết nó với máy chủ HTTP đã tạo.
    // // Nhờ đó, bạn có thể tạo kết nối WebSocket cho ứng dụng và giao tiếp theo thời gian thực với client.
    io = require("socket.io")(httpServer);
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io is not available");
    }
    return io;
  },
};
