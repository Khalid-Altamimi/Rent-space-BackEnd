const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref:'User', required:true},
    listingId : {type:mongoose.Schema.Types.ObjectId, ref:'Listing', required:true},
    startDate : {type:Date ,required:true},
    endDate: {type:Date ,required:true},
    totalPrice: {type:Number, required:true},
    createdAt: {type:Date, default:Date.now}
});
const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;