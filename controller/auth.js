const User = require("../models/user");
const bcrypt = require("bcryptjs");

const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const secretKey = "mysecretkey";

exports.postLogin = (req, res, next) => {
  const name_user = req.body.name_user;
  const password = req.body.password;

  // const errors = validationResult(req);:
  // Hàm này sử dụng express-validator để kiểm tra và xác thực dữ liệu người dùng.
  // validationResult là một hàm trong express-validator giúp kiểm tra xem liệu có lỗi nào trong các trường đã nhập hay không.
  const errors = validationResult(req);

  //if (!errors.isEmpty()) { ... }:
  // Đoạn mã này kiểm tra xem có lỗi nào trong dữ liệu người dùng hay không.
  // Nếu có lỗi (mảng errors không trống),
  // chương trình sẽ xử lý lỗi và trả về một đối tượng JSON báo lỗi về phía người dùng.
  if (!errors.isEmpty()) {
    //console.log(errors.array());
    //: Hàm này in ra mảng các lỗi dưới dạng mảng JSON trong bản ghi console của máy chủ.
    // Điều này giúp bạn dễ dàng xem và debug lỗi nếu có.
    console.log(errors.array());

    //return res.status(422).json({ ... }):
    // Trả về một phản hồi JSON cho người dùng với mã trạng thái 422 (Unprocessable Entity) để báo lỗi.
    // Phản hồi JSON này bao gồm thông báo lỗi đầu tiên từ mảng errors, dữ liệu đã nhập (oldInput),
    // và tất cả các lỗi trong mảng errors (validationErrors).
    return res.status(422).json({
      message: errors.array()[0].msg,
      oldInput: {
        name_user: name_user,
        password: password,
      },
      validationErrors: errors.array(),
    });
  }

  //User.findOne({name_user: name_user}): Đoạn mã này tìm kiếm trong cơ sở dữ liệu để lấy thông tin người dùng có name_user trùng khớp.
  User.findOne({ name_user: name_user })
    .then((user) => {
      //Hàm này sử dụng bcrypt để so sánh mật khẩu đã nhập của người dùng với mật khẩu đã lưu trong cơ sở dữ liệu.
      // Nếu hai mật khẩu khớp nhau, doMatch sẽ là true, và ngược lại.
      bcrypt.compare(password, user.password).then((doMatch) => {
        if (doMatch) {
          // jwt.sign(payload, secretOrPrivateKey, [options], callback): Đây là hàm dùng để tạo JWT. Có một số đối số cần được truyền vào:
          //payload: Đây là đối tượng JSON chứa thông tin của người dùng (ví dụ: id, username, role, etc.) mà chúng ta muốn đính kèm vào token.
          //secretOrPrivateKey: Đây là chuỗi bí mật (secret key) được sử dụng để mã hóa dữ liệu trong token. Để tạo token, chúng ta sử dụng secret key này. Đảm bảo giữ secret key này bí mật và không chia sẻ công khai.
          //options: Đây là một đối tượng tùy chọn cho token. Trong ví dụ trên, chúng ta sử dụng thuộc tính expiresIn để chỉ định thời gian sống của token là 1 giờ (1h). Sau khi thời gian sống này kết thúc, token sẽ hết hiệu lực.
          //callback(err, token): Đây là hàm callback sẽ được gọi sau khi token được tạo. Nếu có lỗi trong quá trình tạo token, biến err sẽ chứa thông tin lỗi. Nếu token được tạo thành công, biến token sẽ chứa chuỗi JWT đã tạo.
          const token = jwt.sign({ user }, secretKey, { expiresIn: "1h" });

          // // Nếu mật khẩu khớp, đánh dấu người dùng đã đăng nhập và lưu thông tin người dùng vào session
          // req.session.isLoggedIn = true;
          // req.session.user = user;
          // req.session.token = token;
          // return req.session.save((err) => {
          //   console.log(err);

          //Lưu session và trả về một phản hồi JSON thành công với mã trạng thái 401
          return res.status(200).json({
            successMessage: "success",
            token: token,
            fullName: user.fullName,
            phone: user.phone,
            name_user: user.name_user,
          });
          // });
        }

        //req.flash("error", "Invalid name_user or password") được sử dụng để đặt thông báo lỗi (error message) vào flash session trong ứng dụng sử dụng framework Express. Flash session là một dạng session đặc biệt trong Express, cho phép lưu trữ dữ liệu tạm thời để hiển thị cho người dùng trong một yêu cầu HTTP duy nhất, thường được sử dụng để hiển thị thông báo sau khi xảy ra một hành động nhất định (ví dụ: đăng nhập thất bại).
        //Khi bạn gọi req.flash("error", "Invalid name_user or password"), bạn đang đặt thông báo lỗi vào flash session với khóa là "error" và giá trị là "Invalid name_user or password". Sau đó, thông báo lỗi này sẽ tồn tại trong flash session và sẽ được sử dụng để hiển thị cho người dùng sau khi trình duyệt chuyển đổi sang trang khác (thông thường là sau khi gửi một yêu cầu và nhận được phản hồi).
        // req.flash("error", "Invalid name_user or password");
        res.status(403).json({ successMessage: "Invalid password" });
      });
    })

    //Nếu có lỗi trong quá trình xử lý, chương trình sẽ tạo một đối tượng Error với mã trạng thái 500 và gửi nó cho middleware next để xử lý lỗi.
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postSignup = (req, res, next) => {
  const name_user = req.body.name_user;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const fullName = req.body.fullName;
  const position = req.body.position;

  // Sử dụng express-validator để kiểm tra và xác thực dữ liệu người dùng
  const errors = validationResult(req);

  // Nếu có lỗi trong dữ liệu người dùng
  if (!errors.isEmpty()) {
    // In ra mảng các lỗi dưới dạng JSON trong bản ghi console của máy chủ
    console.log(errors.array());

    // Trả về một phản hồi JSON cho người dùng với mã trạng thái 422 (Unprocessable Entity) để báo lỗi
    // Phản hồi JSON này bao gồm thông báo lỗi đầu tiên từ mảng errors, dữ liệu đã nhập (oldInput),
    // và tất cả các lỗi trong mảng errors (validationErrors)
    return res.status(422).json({
      message: errors.array()[0].msg,
      oldInput: {
        name_user: name_user,
        password: password,
        confirmPassword: confirmPassword,
        position: position,
      },
      validationErrors: errors.array(),
    });
  }

  bcrypt
    .hash(password, 12)
    .then((passwordBcrypt) => {
      const user = new User({
        name_user: name_user,
        password: passwordBcrypt,
        fullName: fullName,
        position: position,
        role: "client",

      });

      // Lưu thông tin người dùng vào cơ sở dữ liệu
      return user.save();
    })

    .then((result) => {
      res.status(200).json({ message: "Signup success!" });
    })
    .catch((err) => {
      // Nếu có lỗi trong quá trình xử lý, tạo một đối tượng Error với mã trạng thái 500 và gửi nó cho middleware next để xử lý lỗi
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
