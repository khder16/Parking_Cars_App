import mongoose, { Schema, model } from "mongoose";
const ParkingOrderSchema = new Schema({
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
    duration: {
        type: Number,
        required: true,

    },
    Price: {
        type: Number,
        required: true
    }

}, { timestamps: true })
export default model('ParkingOrder', ParkingOrderSchema)