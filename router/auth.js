const express = require("express");

const { check, body } = require("express-validator");
const bcrypt = require("bcryptjs");

const authController = require("../controller/auth");
const User = require("../models/user");

const router = express.Router();

//router login
router.post(
  "/login",
  [
    //check("email"): Middleware này kiểm tra trường "email" trong body của yêu cầu và xác nhận nó là một địa chỉ email hợp lệ bằng cách sử dụng phương thức isEmail() từ thư viện express-validator.
    check("name_user")
      .not()
      .isEmpty()

      // Nếu trường "email" không hợp lệ, thông báo lỗi "Please enter a valid email." sẽ được trả về.
      .withMessage("Vui lòng không để trống tên tài khoản")

      //Middleware custom này cho phép bạn thực hiện kiểm tra tùy chỉnh cho trường "email".
      .custom(async (value, { req }) => {
        // tìm kiếm người dùng trong cơ sở dữ liệu dựa trên email được cung cấp.
        const userDoc = await User.findOne({ name_user: value });

        if (!userDoc) {
          //Nếu không tìm thấy email tương ứng trong cơ sở dữ liệu, chúng ta sẽ sử dụng throw new Error("Invalid email") để ném một lỗi và middleware check sẽ hiểu rằng kiểm tra không thành công và yêu cầu sẽ không được xử lý tiếp theo theo luồng chính, mà thay vào đó sẽ chuyển tới middleware xử lý lỗi.
          throw new Error("Invalid");
        }
      }),

    //body("password", "Invalid password"): Middleware này kiểm tra trường "password" trong body của yêu cầu và đảm bảo nó có ít nhất 8 ký tự và chỉ bao gồm số và chữ cái bằng phương thức isLength({ min: 8 }) và isAlphanumeric().
    //"Invalid password": Đối số thứ hai là thông báo lỗi tùy chỉnh mà chúng ta muốn hiển thị nếu kiểm tra không thành công. Nếu trường "password" không đáp ứng yêu cầu, thông báo lỗi "Invalid password" sẽ được trả về.
    body("password", "Invalid password")
      .isLength({ min: 8 })

      //.isAlphanumeric(): Phương thức này kiểm tra xem trường "password" chỉ bao gồm số và chữ cái (không bao gồm các ký tự đặc biệt) hay không.
      .isAlphanumeric()

      //: Middleware custom này kiểm tra mật khẩu đã nhập so với mật khẩu đã lưu trong cơ sở dữ liệu bằng cách sử dụng await bcrypt.compare() để so sánh hai mật khẩu
      .custom(async (value, { req }) => {
        const userDoc = await User.findOne({ name_user: req.body.name_user });
        if (userDoc) {
          const doMatch = await bcrypt.compare(value, userDoc.password);
          if (!doMatch) {
            // Nếu mật khẩu không khớp, chúng ta sẽ sử dụng throw new Error("Invalid Password") để ném một lỗi và middleware body sẽ hiểu rằng kiểm tra không thành công và yêu cầu sẽ không được xử lý tiếp theo theo luồng chính, mà thay vào đó sẽ chuyển tới middleware xử lý lỗi.
            throw new Error("Invalid");
          }
        }
      }),
  ],
  authController.postLogin
);

router.post(
  "/signup",
  [
    check("name_user")
      .not()
      .isEmpty()
      .withMessage("Vui lòng không để trống tên tài khoản")
      .custom(async (value, { req }) => {
        const user = await User.findOne({ name_user: value });
        if (user) throw new Error("Tên tài khoản đã tồn tại!");
      }),
    body("fullName")
      .not()
      .isEmpty()
      .withMessage("Họ và tên không khớp với định dạng"),
    body("position").not().isEmpty().withMessage("Position not empty"),
    body("password").isLength({ min: 8 }).withMessage("Invalid Password"),
    body("confirmPassword").custom(async (value, { req }) => {
      const password = req.body.password;
      if (password !== value)
        throw new Error("confirmPassword not match password");
    }),
  ],
  authController.postSignup
);
module.exports = router;
