const express = require("express");
const { check, body } = require("express-validator");

const adminController = require("../controller/admin");
const authController = require("../controller/auth");
const User = require("../models/user");
const router = express.Router();

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////
///////////////

//thư viện multer để xử lý việc tải lên (upload) các tệp (file) từ client lên máy chủ.
// Đây là một công cụ hữu ích khi bạn cần cho phép người dùng tải lên hình ảnh, tệp âm thanh, video hoặc bất kỳ loại tệp nào lên ứng dụng của bạn.
const multer = require("multer");

//cấu hình storage engine (bộ lưu trữ) cho Multer.
// Mỗi khi Multer nhận được tệp từ yêu cầu tải lên, nó sẽ sử dụng bộ lưu trữ này để xác định nơi lưu trữ tệp và đặt tên cho tệp.
const fileStorage = multer.diskStorage({
  //destination: Đây là một hàm dùng để xác định thư mục mà bạn muốn lưu trữ tệp tải lên. Nó nhận vào ba tham số
  destination: (req, file, cb) => {
    //req: Đối tượng yêu cầu từ client.
    //file: Thông tin về tệp đang được tải lên.
    //cb: Một hàm callback được gọi sau khi bạn xác định thư mục đích.
    //cb(null, 'image/') chỉ định rằng tất cả các tệp tải lên sẽ được lưu trong thư mục "image/" trên server.
    // null là tham số đầu tiên thường là một đối tượng lỗi (error object).
    cb(null, "photos/");
  },

  //filename: Đây là hàm được sử dụng để tạo tên cho tệp được lưu trữ. Nó cũng nhận vào ba tham số tương tự như destination
  //req: Đối tượng yêu cầu từ client.
  //file: Thông tin về tệp đang được tải lên.
  //cb: Hàm callback để xác định tên tệp sau khi bạn xử lý.
  filename: (req, file, cb) => {
    //file.originalname là tên gốc của tệp được tải lên từ client.
    //fieldname là tên của trường (field) mà tệp (file) được gửi lên từ client
    cb(null, file.originalname + "-" + Date.now());
  },
});

//lọc các file không phải là file ảnh
const fileFilter = (res, file, cb) => {
  //Trong hàm fileFilter, chúng ta kiểm tra kiểu MIME của tệp (mimetype) để xác định xem tệp có phải là hình ảnh hay không.
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("file không hợp lệ"), false);
  }
};

//Trong đoạn mã trên, .single('image') được thêm vào sau cấu hình Multer để chỉ định rằng bạn muốn xử lý duy nhất một tệp được gửi lên thông qua trường có tên "image" trong biểu mẫu HTML.
// Điều này có nghĩa là khi người dùng chọn một tệp để tải lên, chỉ tệp này sẽ được xử lý bởi Multer.
//Nếu bạn muốn cho phép người dùng tải lên nhiều tệp thông qua cùng một trường hoặc các trường khác nhau, bạn có thể sử dụng .array() hoặc .fields() thay vì .single().
//.array('images', 5) cho phép người dùng tải lên nhiều tệp thông qua trường có tên "images" trong biểu mẫu HTML. Tham số thứ hai 5 là số lượng tệp tối đa được phép tải lên cùng một lúc.
const upload = multer({ storage: fileStorage, fileFilter: fileFilter });
// const upload = multer({ debug: true });

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
///////////////////////////

//router auth signup
// router post signup
router.post(
  "/signup",
  [
    check("name_user")
      .notEmpty()
      .withMessage("Vui lòng nhập tên tài khoản!")
      .custom(async (value, { req }) => {
        const userDoc = await User.findOne({ name_user: req.body.name_user });
        if (userDoc) {
          throw new Error("Tên Tài khoản đã tồn tại!");
        }
      }),
    body("password")
      //.trim() được sử dụng để loại bỏ các khoảng trắng (space) thừa ở đầu và cuối của một chuỗi.
      .trim()
      .isLength({ min: 8 })
      .withMessage("Vui lòng nhập mật khẩu ít nhất 8 ký tự!"),
    body("confirmPassword")
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Mật khẩu nhập lại không đúng!");
        }
        return true;
      }),
    body("fullName")
      // ^: Đây là anchor, kiểm tra xem chuỗi phải bắt đầu từ đầu.
      //[A-Z]: Kiểm tra ký tự đầu tiên phải là chữ cái in hoa (uppercase).
      //[a-z]*: Kiểm tra phần còn lại của tên có thể có một hoặc nhiều chữ cái thường (lowercase).
      //(?:\s[A-Z][a-z]*)+: Đây là một nhóm non-capturing, kiểm tra chuỗi có thể có một hoặc nhiều từ (được phân tách bởi khoảng trắng), trong đó từ đầu tiên viết hoa và các từ sau đó viết thường.
      //$: Đây là anchor, kiểm tra xem chuỗi phải kết thúc ở đây.
      .matches(/^[A-Z][a-z]*(?:\s[A-Z][a-z]*)+$/g)
      .withMessage(
        "Vui lòng nhập họ tên đầy đủ, và chữ cái đầu tiên phải viết hoa!"
      ),
    body("position").notEmpty().withMessage("Vui lòng nhập chức vụ!"),
  ],
  authController.postSignup
);

//router edit military
router.put(
  "/military/edit/:id",
  adminController.militaryValid,
  adminController.editMilitary
);

//router add military
router.post(
  "/military/add",
  adminController.militaryValid,
  adminController.postAddMilitary
);

//router remove military
router.delete("/military/delete/:id", adminController.deleteMilitary);

//////////////////////
// router add location
router.post(
  "/location/add",
  adminController.locationValidator,
  adminController.postAddLocation
);

// edit location
router.put(
  "/location/edit/:id",
  adminController.locationEditValidator,
  adminController.postEditLocation
);

// get list of location
router.get("/location/list", adminController.getListLocation);

//get location details
router.get("/location/details/:id", adminController.getLocationDetails);

//delete location vẫn dữ lại đơn vị cấp dưới
router.delete("/location/delete/:id", adminController.deleteLocation);

//destroy location xóa luôn đơn vị cấp dưới
router.delete("/location/destroy/:id", adminController.destroyLocation);
module.exports = router;
