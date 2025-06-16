import mongoose, { Schema, model } from "mongoose";

const AdminSchema = new Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    role: {
        type: String,
        enum: ['superAdmin', 'admin'],
        default: 'admin',
    },
    parkingNumber: {
        type: Number,
        required: true,
        ref: 'Parking'
    },
    username:{
        type:String,
        required:true,
        
    }
    
})

export default mongoose.models.Admin || model("Admin", AdminSchema);