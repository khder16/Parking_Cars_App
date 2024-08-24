import mongoose, { Schema, model } from "mongoose";
const carProblems = new Schema({
    problemType: {
        type: String, // Mechanic// Electric // other 
        required: true,
    },
    name: { type: String, required: true }, // OverHeating /...
    image: { type: String, required: true }, // image from public folder 
    price: { type: Number, required: true }, // price
    duration: { type: Number, required: true } // duration for fixing problem 




})
export default model('CarProblem', carProblems)