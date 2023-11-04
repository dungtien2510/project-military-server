const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http");
//moongoose
const mongoose = require("mongoose");

//jsonwebToken
const jwt = require("jsonwebtoken");
//secret jwt
const secretJWT = "mysecretkey";

//router auth
const authRouter = require("./router/auth");

//router client
const clientRouter = require("./router/client");

//router admin
const adminRouter = require("./router/admin");

const MONGODB_URI =
  "mongodb+srv://dungtien2510:dung25101997@cluster0.ypzklxr.mongodb.net/army?retryWrites=true&w=majority";

//tạo máy chủ và xuất nó để sử dụng websocket
const server = http.createServer(app);
module.exports = server;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////
///////////////
app.use(cors());

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////
///////////////
//body-parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////
///////////////

//router auth
app.use("/auth", authRouter);

//router admin

const User = require("./models/user");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////
///////////////
// function protection: tạo hàm bảo vệ các router khi đăng nhập mới sử dụng được
const protection = (requestRole) => {
  return (req, res, next) => {
    //Đầu tiên, middleware kiểm tra xem header "Authorization" có tồn tại hay không.
    const token = req.headers.authorization
      ? req.headers.authorization.split(" ")[1]
      : undefined;

    if (!token) {
      return res
        .status(401)
        .json({ message: "You must be logged in", status: 401 });
    }

    //Cuối cùng, middleware sử dụng thư viện JWT để giải mã mã thông báo JWT (token) bằng cách sử dụng khóa bí mật (secretJWT).
    //Nếu mã thông báo JWT hợp lệ, nó sẽ được giải mã thành một JavaScript object (decodeToken), chứa các thông tin mà bạn đã định nghĩa trong mã thông báo.
    //Nếu mã thông báo không hợp lệ, middleware sẽ trả về mã trạng thái 401 và thông báo rằng token không hợp lệ.
    jwt.verify(token, secretJWT, (err, decodeToken) => {
      if (err) {
        return res
          .status(401)
          .json({ message: "Token is invalid", status: 401 });
      }

      if (!decodeToken.user || !decodeToken.user._id) {
        return res
          .status(401)
          .json({ message: "Invalid user data in token", status: 401 });
      }
      if (
        (decodeToken.user.role !== requestRole) &
        (decodeToken.user.role !== "admin") &
        (decodeToken.user.role === "client")
      ) {
        return res.status(403).json({ message: "Permission denied" });
      }

      const userId = decodeToken.user._id.toString();

      User.findById(userId)
        .then((user) => {
          if (!user) {
            return res.status(404).json({ message: "User not found" });
          }

          req.user = user;

          next();
        })
        .catch((err) => next(err));
    });
  };
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////
///////////////
//router client
app.use("/client", protection("client"), clientRouter);

// router admin
app.use("/admin", protection("admin"), adminRouter);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////
///////////////
// middleware xữ lý lỗi
app.use((req, res, next) => {
  res.status(404).json({ message: "API Not Found" });
});

//middleware xữ lý lỗi 500
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({ message: "sever error" });
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////
///////////////
////Tạo text index cho trường cần tìm kiếm (text index) là một cơ chế cải thiện hiệu suất cho việc tìm kiếm văn bản trong cơ sở dữ liệu.
// Khi bạn thực hiện tìm kiếm văn bản trong một trường mà không có text index, MongoDB sẽ phải quét toàn bộ dữ liệu trong trường đó để tìm các giá trị khớp với từ khoá tìm kiếm.
const createTextIndex = async () => {
  try {
    //Kết nối tới cơ sở dữ liệu MongoDB và lưu trữ kết nối trong biến client. Hàm mongoose.connect trả về một kết nối MongoDB.
    const client = await mongoose.connect(MONGODB_URI);

    //const db = client.connection.db;: Lấy cơ sở dữ liệu từ kết nối MongoDB đã tạo.
    const db = client.connection.db;

    // Sử dụng phương thức createIndex để tạo text index cho trường "name" trong bộ sưu tập "products" trong cơ sở dữ liệu.
    await db.collection("military").createIndex({ name: "text" });
    console.log('Text index for "name" field created successfully.');
  } catch (error) {
    console.error("Error creating text index:", error);
  }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////
///////////////
//

mongoose
  .connect(MONGODB_URI)
  //đặt tạo text index ở tệp chạy ứng dụng là vì nó là một nhiệm vụ cấu hình cơ sở dữ liệu và chỉ cần thực hiện một lần khi ứng dụng bắt đầu chạy.
  .then(() => createTextIndex())
  .then((result) => {
    const server = app.listen(5000);
    // //io.on("connection", (socket) => { ... }): Khi một client kết nối với máy chủ WebSocket, đoạn mã này sẽ được thực thi.
    // // Nó in ra "Connected client" vào console để xác nhận việc kết nối thành công.
    // // Tại đây, bạn có thể xử lý sự kiện và truyền dữ liệu giữa server và client thông qua kết nối WebSocket.
    const io = require("./socket").init(server);
    io.on("connection", (socket) => {
      console.log("client Connected!");
    });
    // const server = app.listen(5000);
    // const io = require("socket.io")(server);

    // io.on("connection", (socket) => {
    //   console.log("Connected client");
    // });
  })
  .catch((error) => console.log(error));
