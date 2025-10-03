import mongoose, { mongo } from "mongoose";

const addressSchema = new mongoose.Schema({
    street: {
        type: String,
        requiured: true,
    }, 
    city: {
        type: String,
        requiured: true,
    }, 
    state: {
        type: String,
        requiured: true,
    }, 
    zip: {
        type: String,
        requiured: true,
    }, 
    country: {
        type: String,
        requiured: true,
    }, 
    isDefault: {
        type: Boolean,
        default : false
    }
})

const userSchema = new mongoose.Schema({
    username : {
        type: String,
        required: true,
        unique: true
    },
    email : {
        type: String,
        required: true,
        unique: true
    },
    password : {
        type: String,
        required: true,
        select: false
    },
    fullName : {
        type: String,
        required: true,
    },
    role : {
        type: String,
        enum : ["user","seller"]
    },
    addresses : [
        addressSchema
    ],
})

export const User = mongoose.model("User",userSchema)