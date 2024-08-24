import Admin from "../modules/Admins.js";
import parking from "../modules/parking.js";



// Register Admin Function


export const registerAdmin = async (req, res,) => {
    try {
        const { email, password, confirmPassword, username, firstName, lastName, ParkNumber } = req.body
        if (!(email && password && username && firstName && lastName)) {
            return res.status(400).send("All input is required");
        }
        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Invalid Email" })
        }
        if (!validator.isLength(password, { min: 6 })) {
            return res.status(400).json({ message: "Password should be at least 6 characters long" })
        }
        if (!validator.isLength(confirmPassword, { min: 6 })) {
            return res.status(400).json({ message: "Confirm Password should be at least 6 characters long" })
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "The password and confirm password are not the same" })
        }
        if (!validator.isLength(username, { min: 3, max: 10 })) {
            return res.status(400).json({ message: 'Username is required' });
        }
        if (!validator.isLength(firstName, { min: 1, max: 10 })) {
            return res.status(400).json({ message: 'First Name is required' });
        }
        if (!validator.isLength(lastName, { min: 1, max: 10 })) {
            return res.status(400).json({ message: 'Last Name is required' });
        }
        const isExist = await Admin.findOne({ $or: [{ email }, { username }] })
        if (isExist) {
            return res.status(409).json({ message: 'email is already exsisted Pleas Input another email' })
        }
        const encryptedPassword = await bcrypt.hash(password, 10);
        const newAdmin = await Admin.create({
            email: email,
            password: encryptedPassword,
            username: username,
            firstName: firstName,
            lastName: lastName,
            parkingNumber: ParkNumber,
        })
        return res.status(200).json({ message: 'Done Sucessfuly' })

    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message })

    }
}

// Login Admin Function

export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ msg: "Please provide email and password to login" });
        }
        const user = await User.findOne({ email: email })
        if (user) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Please Log in as a user" })
        }
        const admin = await Admin.findOne({ email }).select("firstName  lastName email password role  username");
        if (!admin) {
            return res.status(400).json({ message: "Password or email may be incorrect" });
        }
        if (admin && (await bcrypt.compare(password.toString(), admin.password))) {
            console.log(`${admin.firstName} Loged-in`);
            const token = jwt.sign({ email: admin.email }, process.env.TOKEN_KEY, { expiresIn: '90d' });
            const AdminPark = await parking.find({ Admin: admin._id }).select("location.parkingName location.parkingNumber location.price")
            res.cookie('token', token, { maxAge: 240 * 60 * 60 * 1000 });
            res.status(200).json({ message: "Login Sucessfly", token: token, admin: admin });
        } else {
            return res.status(400).json({ message: "Password or email may be incorrect" });
        }

    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message })

    }
}

// Showl all parks for the Admin

export const getMyParks = async (req, res) => {
    try {
        const { AdminEmail } = req.body
        if (!AdminEmail) {
            return res.status(StatusCodes.BAD_REQUEST).json({ messgae: 'Please provide full info ' })
        }
        const Admin1 = await Admin.findOne({ email: AdminEmail })
        if (!Admin1) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: " Admin Not Found" })
        }
        const parks = await parking.find({ Admin: Admin1._id }).select('location.parkingName location.Price ')
        if (!parks) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "You Don't have any parks " })
        }

        return res.status(StatusCodes.OK).json(parks)
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message })

    }
}

// Logout 
export const logoutAdmin = async (req, res) => {
    try {
        const token = '';
        res.cookie('token', token)
        res.status(200).json({ token });
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message })

    }
}

// Add new Park by Admin

export const addPark = async (req, res) => {
    try {
        const { parkingName, parklat, parklong, NumberOfCarRepairPlaces, Price, AdminEmail } = req.body;
        if (!parkingName || !parklat || !parklong || !NumberOfCarRepairPlaces || !Price || !AdminEmail) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Please Provide Full Information" })
        }
        /////create Park array
        const park = Array.from({ length: 10 }, (_, i) => ({ parkNumber: i + 1 }));
        /////////create Car Reapir Places Array
        const carRepairPlaces = Array.from({ length: NumberOfCarRepairPlaces }, (_, i) => ({
            carRepairNumber: i + 1,
            filled: false,
            carNumber: "",
        }));
        ///find The Admin
        const AdminId = await Admin.findOne({ email: AdminEmail })
        if (!AdminId) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "admin Not Found" })
        }
        //////find The Highest parking Numer to make sure there is no two parks have the same Number
        const HighestparkingNumber = await parking.find().sort({ "location.parkingNumber": -1 }).limit(1)
        const parkingNumber = HighestparkingNumber.length > 0 ? HighestparkingNumber[0].location.parkingNumber + 1 : 1


        console.log(park);
        const location = [parklat, parklong]
        const existingPark = await parking.findOne({
            $or: [
                { 'location.coordinates': location },
                { 'location.parkingName': parkingName }
            ]
        });
        if (existingPark) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Park Already Found' })
        }

        const newParking = await parking.create({
            Admin: AdminId._id,
            "location.parkingName": parkingName,
            "location.parkingNumber": parkingNumber,
            "location.coordinates": location,
            park: park,
            carRepairPlaces: carRepairPlaces,
            "location.Price": Price
        })

        return res.status(StatusCodes.OK).json({ message: "done Sucessfuly" })

    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message })
    }
}

// Edit park Information 
export const editPark = async (req, res) => {
    try {

        const { AdminEmail, parkingName, newParkingName, Price, newPrice } = req.body
        if (!AdminEmail) {
            return res.status(StatusCodes.OK).json({ message: 'Please Provide All Information' })
        }



        const Admin = await Admin.findOne({ email: AdminEmail })
        if (!Admin) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Admin Not Found" })
        }
        const AdminPark = await parking.findOne({
            $and: [
                { Admin: Admin._id },
                { "location.parkingName": parkingName }
            ]
        })
        if (!AdminPark) {
            return res.status(StatusCodes.BAD_REQUEST).json({ messgae: "There Is No Park with specified Name" })
        }
        AdminPark.location.parkingName = newParkingName || parkingName
        AdminPark.location.Price = newPrice || Price
        await AdminPark.save()

        
        return res.status(StatusCodes.OK).json({ message: "Done Sucessfuly" })
    } catch (error) {
        console.error(error)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message })
    }
}


export const Settings = async (req, res) => {
    try {

        const { AdminEmail, newAdminEmail, username, newusername } = req.body
        if (!AdminEmail || !username) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Please Provide Full info" })
        }
        const AdminInfo = await Admin.findOne({ email: AdminEmail })
        if (!AdminInfo) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Admin Not Found" })
        }
        AdminInfo.email = newAdminEmail || AdminEmail
        AdminInfo.username = newusername || username
        await AdminInfo.save()


        return res.status(StatusCodes.OK).json({ message: AdminInfo })
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message })
    }
}