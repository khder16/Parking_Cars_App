import Admin from "../modules/admins.js";
import parking from "../modules/parking.js";

// Register Admin Function

export const registerAdmin = async (req, res) => {
  try {
    const {
      email,
      password,
      confirmPassword,
      username,
      firstName,
      lastName,
      ParkNumber,
    } = req.body;
    if (!(email && password && username && firstName && lastName)) {
      return res
        .status(400)
        .json({ message: req.t("auth:all_input_required") });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: req.t("auth:invalid_email") });
    }
    if (!validator.isLength(password, { min: 6 })) {
      return res
        .status(400)
        .json({ message: req.t("auth:password_min_length") });
    }
    if (!validator.isLength(confirmPassword, { min: 6 })) {
      return res.status(400).json({
        message: req.t("auth:confirm_password_min_length"),
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: req.t("auth:passwords_not_match"),
      });
    }
    if (!validator.isLength(username, { min: 3, max: 10 })) {
      return res.status(400).json({ message: req.t("auth:username_required") });
    }
    if (!validator.isLength(firstName, { min: 1, max: 10 })) {
      return res
        .status(400)
        .json({ message: req.t("auth:first_name_required") });
    }
    if (!validator.isLength(lastName, { min: 1, max: 10 })) {
      return res
        .status(400)
        .json({ message: req.t("auth:last_name_required") });
    }
    const isExist = await Admin.findOne({ $or: [{ email }, { username }] });
    if (isExist) {
      return res.status(409).json({
        message: req.t("auth:email_username_exists"),
      });
    }
    const encryptedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await Admin.create({
      email: email,
      password: encryptedPassword,
      username: username,
      firstName: firstName,
      lastName: lastName,
      parkingNumber: ParkNumber,
    });
    return res
      .status(200)
      .json({ message: req.t("auth:registration_successful") });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

// Login Admin Function

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: req.t("auth:provide_email_password") });
    }
    const user = await User.findOne({ email: email });
    if (user) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("admin:login_as_user") });
    }
    const admin = await Admin.findOne({ email }).select(
      "firstName  lastName email password role  username"
    );
    if (!admin) {
      return res.status(400).json({ message: req.t("admin:admin_not_found") });
    }
    if (admin && (await bcrypt.compare(password.toString(), admin.password))) {
      const token = jwt.sign({ email: admin.email }, process.env.TOKEN_KEY, {
        expiresIn: "90d",
      });
      const AdminPark = await parking
        .find({ Admin: admin._id })
        .select("location.parkingName location.parkingNumber location.price");
      res.cookie("token", token, { maxAge: 240 * 60 * 60 * 1000 });
      res.status(200).json({
        message: req.t("auth:login_successful"),
        token: token,
        admin: admin,
      });
    } else {
      return res
        .status(400)
        .json({ message: req.t("auth:incorrect_email_password") });
    }
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

// Showl all parks for the Admin

export const getMyParks = async (req, res) => {
  try {
    const { AdminEmail } = req.body;
    if (!AdminEmail) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ messgae: req.t("admin:provide_full_info") });
    }
    const Admin1 = await Admin.findOne({ email: AdminEmail });
    if (!Admin1) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("admin:admin_not_found") });
    }
    const parks = await parking
      .find({ Admin: Admin1._id })
      .select("location.parkingName location.Price ");
    if (!parks) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("parking:no_parks_found") });
    }

    return res.status(StatusCodes.OK).json(parks);
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

// Logout
export const logoutAdmin = async (req, res) => {
  try {
    const token = "";
    res.cookie("token", token);
    res.status(200).json({ token });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

// Add new Park by Admin

export const addPark = async (req, res) => {
  try {
    const {
      parkingName,
      parklat,
      parklong,
      NumberOfCarRepairPlaces,
      Price,
      AdminEmail,
    } = req.body;
    if (
      !parkingName ||
      !parklat ||
      !parklong ||
      !NumberOfCarRepairPlaces ||
      !Price ||
      !AdminEmail
    ) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("parking:missingInputs") });
    }

    const park = Array.from({ length: 10 }, (_, i) => ({ parkNumber: i + 1 }));

    const carRepairPlaces = Array.from(
      { length: NumberOfCarRepairPlaces },
      (_, i) => ({
        carRepairNumber: i + 1,
        filled: false,
        carNumber: "",
      })
    );
    //find The Admin
    const AdminId = await Admin.findOne({ email: AdminEmail });
    if (!AdminId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("admin:admin_not_found") });
    }

    const HighestparkingNumber = await parking
      .find()
      .sort({ "location.parkingNumber": -1 })
      .limit(1);
    const parkingNumber =
      HighestparkingNumber.length > 0
        ? HighestparkingNumber[0].location.parkingNumber + 1
        : 1;

    console.log(park);
    const location = [parklat, parklong];
    const existingPark = await parking.findOne({
      $or: [
        { "location.coordinates": location },
        { "location.parkingName": parkingName },
      ],
    });
    if (existingPark) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("parking:park_already_found") });
    }

    const newParking = await parking.create({
      Admin: AdminId._id,
      "location.parkingName": parkingName,
      "location.parkingNumber": parkingNumber,
      "location.coordinates": location,
      park: park,
      carRepairPlaces: carRepairPlaces,
      "location.Price": Price,
    });

    return res.status(StatusCodes.OK).json({ message: "done Sucessfuly" });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

// Edit park Information
export const editPark = async (req, res) => {
  try {
    const { AdminEmail, parkingName, newParkingName, Price, newPrice } =
      req.body;
    if (!AdminEmail) {
      return res
        .status(StatusCodes.OK)
        .json({ message: req.t("auth:all_input_required") });
    }

    const Admin = await Admin.findOne({ email: AdminEmail });
    if (!Admin) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("admin:admin_not_found") });
    }
    const AdminPark = await parking.findOne({
      $and: [{ Admin: Admin._id }, { "location.parkingName": parkingName }],
    });
    if (!AdminPark) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ messgae: req.t("parking:no_park_with_name") });
    }
    AdminPark.location.parkingName = newParkingName || parkingName;
    AdminPark.location.Price = newPrice || Price;
    await AdminPark.save();

    return res.status(StatusCodes.OK).json({ message: "Done Sucessfuly" });
  } catch (error) {
    console.error(error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

export const Settings = async (req, res) => {
  try {
    const { AdminEmail, newAdminEmail, username, newusername } = req.body;
    if (!AdminEmail || !username) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Please Provide Full info" });
    }
    const AdminInfo = await Admin.findOne({ email: AdminEmail });
    if (!AdminInfo) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: req.t("admin:admin_not_found") });
    }
    AdminInfo.email = newAdminEmail || AdminEmail;
    AdminInfo.username = newusername || username;
    await AdminInfo.save();

    return res.status(StatusCodes.OK).json({ message: AdminInfo });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};
