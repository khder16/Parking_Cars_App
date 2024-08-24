import User from '../modules/users.js';
import Cars from '../modules/cars.js';
import parking from '../modules/parking.js';
import CarProblem from '../modules/CarProblems.js'
import { StatusCodes } from 'http-status-codes';



export const selectProblem = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.user }).populate('car')

        if (!user) {
            return res.status(404).json({ message: "Cannot fond user" })
        }
        const userCar = user.car


        const problems = req.body.problems;
        const problemType = req.body.type
        const car = await Cars.findOne({ onerId: user._id })

        await car.save()
        if (problemType === 'Mechanical') {



        }
        if (problemType == 'Electric') {
            await userCar.carProblems.Electric.push(problems)
            await car.save()
        }
        await userCar.save()
        const message = req.cookies.language === 'ar' ? ' تم الطلب بنجاح' : "Done Sucessfuly"
        return res.status(StatusCodes.OK).json({ message: message })

    } catch (error) {
        return res.status(500).json({ message: 'An error occurred' });
    }
}
export const AddProblem = async (req, res) => {
    try {
        const { ProblemType, Name, image, duration, Price } = req.body
        const carProblems = await CarProblem.create({
            ProblemType: ProblemType,
            Name: Name,
            image: image,
            duration: duration,
            Price: Price

        })
        return res.status(StatusCodes.CREATED).json(carProblems)

    } catch (error) {
        console.log(error);
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "error" })

    }

}
export const getProblems = async (req, res) => {

    try {
        const { ProblemType } = req.body
        if (!ProblemType) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Please Provide Problem Type" })
        }
        const Problems = await CarProblem.find({ ProblemType: ProblemType })


        return res.status(StatusCodes.OK).json(Problems)

    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}


