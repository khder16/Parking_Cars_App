import { StatusCodes } from "http-status-codes"
import ParkingOrder from "../modules/parking-order.js";
import parking from "../modules/parking.js";
import Admins from "../modules/Admins.js";
import RepairOrder from "../modules/repair-order.js";

export const NumberOfParksByLocation = async (req, res) => {
  try {
    const { AdminEmail } = req.body
    if (!AdminEmail) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Please Provide Full Info" })
    }
    const AdminId = await Admins.findOne({ email: AdminEmail })
    if (!AdminId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: " Admin Not Found" })
    }
    console.log(AdminId._id);
    const result = await ParkingOrder.aggregate([{
      $group: {
        _id: '$SelectedPark',



        total: { $count: {} },
        d: { $push: '$$ROOT' }
      },

    }, {
      $lookup: {
        from: 'parkings',
        localField: 'd.SelectedPark',
        foreignField: '_id',
        as: 'ParkingLocation'
      },
    }, {
      $match: {
        'ParkingLocation.Admin': AdminId._id
      }

    },
    {
      $unwind: '$ParkingLocation'
    },

    { $sort: { total: -1 } },



    {
      $project: {

        name: '$ParkingLocation.location.parkingName',

        total: 1

      }
    }


    ])
    if (!result) {
      return res.status(StatusCodes.OK).json({ message: "No Booked Parks Yet" })
    }
    else { return res.status(StatusCodes.OK).json({ result: result }) }


  } catch (error) {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' })

  }
}


export const TotalRevenu = async (req, res) => {
  try {
    const { AdminEmail } = req.body
    if (!AdminEmail) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Please Provide Full Info" })
    }
    const AdminId = await Admins.findOne({ email: AdminEmail })
    if (!AdminId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: " Admin Not Found" })
    }
    const Parks = await parking.find({ Admin: AdminId._id })
    console.log(Parks);
    console.log(AdminId._id);
    const result = await ParkingOrder.aggregate([{
      $lookup: {
        from: 'parkings',
        localField: 'SelectedPark',
        foreignField: '_id',
        as: 'result'
      }
    },
    {
      $match: {
        'result.Admin': AdminId._id
      }
    },
    {


      $unwind: '$result'

    },


    {
      $group: {
        _id: '$SelectedPark',

        name: { $first: '$result.location.parkingName' },
        total: { $sum: '$Price' }

      }
    },





    {
      $project: {
        _id: 0,

        name: 1,
        total: 1
      }
    }, { $sort: { total: -1 } },


    ])
    if (result.length > 0) {
      return res.status(StatusCodes.OK).json({ result: result })
    }
    else { return res.status(StatusCodes.OK).json({ message: "There is no parks yet" }) }
  } catch (error) {
    console.error(error)
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'internal Server Error' })


  }
}
export const NumberOfLocationsByPark = async (req, res) => {
  try {
    const { AdminEmail, parkName } = req.body
    console.log(parkName);
    if (!AdminEmail || !parkName) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Please Provide Full Information' })
    }

    const AdminId = await Admins.findOne({ email: AdminEmail })
    if (!AdminId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Admin Not Found'
      })
    }
    const SelectedPark = await parking.findOne({ 'location.parkingName': parkName })
    if (!SelectedPark) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Selected Park Not Found'
      })
    }
    const result = await ParkingOrder.aggregate([
      {
        $match: {
          SelectedPark: SelectedPark._id
        }

      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' }
          },
          total: { $count: {} },
          result: { $push: '$$ROOT' }
        }
      }, { $sort: { total: -1 } },
      {
        $project: {
          name: '$_id.month',
          total: 1,
          _id: 0
        }
      }
    ])
    if (result.length < 1) {
      const date = new Date()
      const month = date.getMonth() + 1


      const result1 = [
        {
          total: 0,
          name: month
        },
        {
          total: 0,
          name: month - 1
        }
      ];

      return res.status(StatusCodes.OK).json({ result: result1 })
    }


    return res.status(StatusCodes.OK).json({ result: result })
  } catch (error) {
    console.error(error)
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'internal Server Error' })

  }
}
export const TotalRevenuByPark = async (req, res) => {
  try {
    const { AdminEmail, parkName } = req.body
    if (!AdminEmail || !parkName) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Please Provide Full Information " })
    }
    const AdminId = await Admins.findOne({ email: AdminEmail })
    if (!AdminId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Admin Not Found" })
    }
    const SelectedPark = await parking.findOne({ 'location.parkingName': parkName })
    if (!SelectedPark) {

      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Park Not Found" })
    }
    const result = await ParkingOrder.aggregate([
      {
        $match: {
          SelectedPark: SelectedPark._id

        }
      }, {
        $group: {
          _id: {
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$Price' }


        }
      },
      { $sort: { total: -1 } },
      {
        $project: {
          _id: 0,
          name: '$_id.month',
          total: 1

        }
      }
    ])

    // console.log(date);
    // console.log(result.length);
    if (result.length < 1) {
      const date = new Date()
      const month = date.getMonth() + 1


      const result1 = [
        {
          total: 0,
          name: month
        },
        {
          total: 0,
          name: month - 1
        }
      ];

      return res.status(StatusCodes.OK).json({ result: result1 })
    }
    return res.status(StatusCodes.OK).json({ result: result })

  } catch (error) {
    console.error(error)
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'internal Server Error' })

  }
}
export const RepairOrdersByproblem = async (req, res) => {
  try {
    const { AdminEmail, parkName } = req.body
    if (!AdminEmail || !parkName) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Please Provide Full info ' })
    }
    const AdminId = await Admins.findOne({ email: AdminEmail })
    if (!AdminId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Admin not found' })
    }

    const SelectedPark = await parking.findOne({ 'location.parkingName': parkName, Admin: AdminId._id })
    if (!SelectedPark) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Park not found' })
    }
    const result = await RepairOrder.aggregate([
      {
        $match: {
          SelectedPark: SelectedPark._id

        }
      },
      {
        $lookup: {
          from: 'carproblems',
          localField: 'carProblem',
          foreignField: '_id',
          as: 'result'
        }
      },

      {


        $unwind: { path: '$result', preserveNullAndEmptyArrays: true }


      },


      {
        $group: {
          _id: '$result.ProblemType',
          // Name : '$result.ProblemType',
          total: { $count: {} },
          totalNumber: { $push: '$$ROOT' }

        }
      },
      { $sort: { total: -1 } },


      {
        $project: {
          // result:0 ,
          name: '$_id',

          // type : '$result.ProblemType',
          //  Name:'$_id',
          total: 1
        }
      }
    ])
    if (result.length < 1) {
      const result1 = [{
        _id: "Electric",
        total: 0,
        name: "Electric"
      },
      {
        _id: "Mechanical",
        total: 0,
        name: "Mechanical"
      }
      ];

      return res.status(StatusCodes.OK).json({ result: result1 })
    }
    return res.status(StatusCodes.OK).json({ result: result })
  } catch (error) {
    console.error(error)
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'internal Server Error' })
  }

}
