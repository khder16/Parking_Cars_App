import mongoose, { Schema, model } from "mongoose";
const RepairOrderSchema = new Schema({
    userId: {
        type: Schema.ObjectId,
        ref: 'User',
        required: true,

    },
    selectedPark: {
        type: Schema.ObjectId,
        ref: 'Parking',
        required: true,

    },
    carProblem: {
        type: Schema.ObjectId,
        ref: 'CarProblem',
        required: true,
    },
    orderStatus: {
        type: Boolean,
        required: true,
        default: false
    },
    orderPrice: {
        type: Number,
        required: true,
        default: 0
    },
    orderFinishDate: {
        type: Date,
    }

}, { timestamps: true })
export default model('RepairOrder', RepairOrderSchema)