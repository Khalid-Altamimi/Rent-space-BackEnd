const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const verifyToken = require("../middleware/verify-token");
const Apartment = require("../models/apartment");
router.get('/listing/:listingId/bookedDates', async (req, res)=> {
try {
const bookings = await Booking.find({listingId: req.params.listingId});
const bookedDates = bookings.map((b) => ({
    start:b.startDate,
    end: b.endDate, 
    
}));
res.json(bookedDates)
}
catch (err) {
    res.status(500).json({message: err.message})
}
})
router.post("/",verifyToken, async (req,res) => {
try{
const {listingId, startDate, endDate} = req.body;
if (!listingId || !startDate || !endDate){
    return res.status(400).json({message: "Missing booking info"})
}
const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    const overlap = await Booking.findOne({
        listingId,
        startDate: { $lt: new Date(endDate) },   // [start:end)
        endDate:   { $gt: new Date(startDate) } 
    });
    if (overlap) return res.status(400).json({message: "This date range is already booked"})
    const days =
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24);
    const totalPrice = Math.ceil(days) * listing.price;
    const booking = new Booking({
        listingId,
        userId:req.user._id,
        startDate,
        endDate,
        totalPrice
    })
    await booking.save()
    res.status(201).json(booking)
}
 
catch (err) {
    res.status(500).json({message: err.message})
}
})
router.delete('/:bookingId',verifyToken, async (req,res) => {
    try{
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({message:"booking not found"})
    const listing = await Apartment.findById(booking.listingId)
    const bookingUserId = booking.userId?.toString();
    const requesterId = req.user._id?.toString();
    const listingOwnerId = listing?.OwnerId?.toString();

     const isBookingOwner = bookingUserId === requesterId;
    const isListingOwner = listingOwnerId && listingOwnerId === requesterId;
    const isAdmin = req.user.role && req.user.role.toLowerCase() === 'admin';
    if (!isBookingOwner && !isListingOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    } 
    await booking.deleteOne();
    res.json({ message: "Booking cancelled successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
})
module.exports = router;