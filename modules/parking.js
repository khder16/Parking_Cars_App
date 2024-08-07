import { ObjectId } from "mongodb";
import mongoose, { Mongoose, Schema, SchemaTypes, model } from "mongoose";


const parkingSchema = new Schema({
    Admin: {
        type: ObjectId,
        required: true,
        ref: 'Admin'
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        },
        parkingNumber: { type: Number, required: true },
        parkingName: { type: String, required: true },
        Price: { type: Number, required: false }
    },
    park: [
        {   duration:{type:Number , default:0},
            parkNumber: { type: Number, required: true },
            filled: { type: Boolean, default: false },
            carNumber: { type: String, default: null },
            bookingEndTime: { type: Date, required: true }


        }
    ],
    carRepairPlaces: [
        {
            carRepairNumber: { type: Number, required: true },
            filled: { type: Boolean, default: false },
            carNumber: { type: String, default: null }
        }
    ]
})

// parkingSchema.index({ parkingName: 1, location: "2dsphere" })
parkingSchema.index({ location: "2dsphere" })

export default model('Parking', parkingSchema)