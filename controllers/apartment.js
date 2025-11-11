const Apartment = require('../models/apartment.js');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verify-token.js');
const authorizeRole = require('../middleware/authorize-role.js');

const upload = require('../config/multer')
const cloudinary = require('../config/cloudinary')

//-----------------Apartment(CRUD)----------------//

// index page (get all apartments)
router.get('/', async (req, res) => {
  
    try {
        const foundApartment = await Apartment.find();
        res.status(200).json(foundApartment);
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
});

// create apartment
router.post('/', authorizeRole('Owner'), upload.array('ApartmentImg'), async (req, res) => {
    try {

        req.body.ApartmentImg = []; 
        const ApartmenImages = req.files;
        
        /* we take the images from the form and store them in ApartmenImages
        then we push each image in the array and give it (url, image link string) 
        and (_id, image cloud storage) */
        ApartmenImages.forEach(file => {
            req.body.ApartmentImg.push({
            url: file.path,
            cloudinary_id: file.filename
            });
        }); 

        req.body.OwnerId = req.user._id;

        req.body.BookingCalendar = [];
        
        const createdApartment = await Apartment.create(req.body);
        res.status(201).json(createdApartment);
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
});

//delete apartment
router.delete('/apartment/:apartmentId', authorizeRole('Owner'), async (req, res) => {
  
    try {
        
        const foundApartment = await Apartment.findById(req.params.apartmentId);
        
        if (!foundApartment) {
            res.status(404);
            throw new Error('Apartment not found.');
        }

        if (foundApartment.OwnerId.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to delete this apartment.');
        }

        
        for (const img of foundApartment.ApartmentImg) {
          if (img.cloudinary_id) {
            await cloudinary.uploader.destroy(img.cloudinary_id);
          }
        }

        await foundApartment.deleteOne();
        
        res.status(200).json(foundApartment);
    
    } catch (err) {
        
        if (res.statusCode === 404) {
            res.json({ err: err.message });
        } 
        else {
            res.status(500).json({ err: err.message });
        }
    }
});

//update apartment
router.put('/apartment/:apartmentId', authorizeRole('Owner'), upload.array('ApartmentImg'), async (req, res) => {
  try {

        const foundApartment = await Apartment.findById(req.params.apartmentId);

        if (!foundApartment) {
            res.status(404);
            throw new Error('Apartment not found.');
        }

        if (foundApartment.OwnerId.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to update this apartment.');
        }

        // Check if new images are uploaded
        if (req.files && req.files.length > 0) {
        
            // Delete old images from Cloudinary
            for (const img of foundApartment.ApartmentImg) {
                if (img.cloudinary_id) {
                await cloudinary.uploader.destroy(img.cloudinary_id);
                }
            }

            // Update ApartmentImg array with new images
            foundApartment.ApartmentImg = req.files.map(file => ({
                url: file.path,
                cloudinary_id: file.filename,
            }));
            
        } else {
            // If no new images are uploaded, retain existing images
            foundApartment.ApartmentImg = foundApartment.ApartmentImg.map((img, index) => ({
                url: req.body[`currentImage${index + 1}`], // Use existing URL from hidden input
                cloudinary_id: img.cloudinary_id // Keep existing Cloudinary ID
            }));
        }

        // Update other fields from req.body
        foundApartment.ApartmentName = req.body.ApartmentName;
        foundApartment.ApartmentPrice = req.body.ApartmentPrice; 
        foundApartment.ApartmentDescription = req.body.ApartmentDescription; 
        foundApartment.ApartmentOffering = req.body.ApartmentOffering;
        foundApartment.ApartmentCity = req.body.ApartmentCity;
        foundApartment.ApartmentRating = req.body.ApartmentRating; 
        foundApartment.BookingCalendar = req.body.BookingCalendar;
        foundApartment.OwnerId = req.body.OwnerId;

        // Save the updated item
        const updatedApartment = await foundApartment.save();
        res.status(200).json(updatedApartment);
  
    } catch (err) {

        if (res.statusCode === 404) {
            res.json({ err: err.message });
        } else {
            res.status(500).json({ err: err.message });
        }
  }
});


//-------------Id routes-----------//

// show apartment detail page
router.get('/apartment/:apartmentId', async (req, res) => {
  
    try {
        
        const foundApartment = await Apartment.findById(req.params.apartmentId);
        
        if (!foundApartment) {
            res.status(404);
            throw new Error('Apartment not found.');
        }

        res.status(200).json(foundApartment);
    
    } catch (err) {
        
        if (res.statusCode === 404) {
            res.json({ err: err.message });
        } 
        else {
            res.status(500).json({ err: err.message });
        }
    }
});

// show city page
router.get('/city/:city', async (req, res) => {
  try {

    
    const cityApartments = await Apartment.find({ ApartmentCity: req.params.city });

    // this will not happend because in the front end there will be no link if the city 
    // has no apartment (added for extra control)
    if (!cityApartments || cityApartments.length === 0) {
      return res.status(404).json({ message: `No apartments found in ${city}` });
    }

    res.status(200).json(cityApartments);
    
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
});







//-----------------Booking routes---------------------//

// Useapartmet model
/*
router.get('/apartment/:apartmentId/bookedDates', async (req, res)=> {
try {
const bookings = await Booking.find({apartmentId: req.params.apartmentId});
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
const {apartmentId, startDate, endDate} = req.body;
if (!apartmentId || !startDate || !endDate){
    return res.status(400).json({message: "Missing booking info"})
}
const apartment = await Listing.findById(apartmentId);
    if (!apartment) return res.status(404).json({ message: "Listing not found" });
    const overlap = await Booking.findOne({
        apartmentId,
        startDate: { $lt: new Date(endDate) },   // [start:end)
        endDate:   { $gt: new Date(startDate) } 
    });
    if (overlap) return res.status(400).json({message: "This date range is already booked"})
    const days =
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24);
    const totalPrice = Math.ceil(days) * Apartment.ApartmentPrice ;
    const booking = new Booking({
        apartmentId,
        userId:req.user._id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalPrice
    })
    await booking.save()
    res.status(201).json(booking)
}
 
catch (err) {
    res.status(500).json({message: err.message})
}
});
router.get("/userBookings/:userId", verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId;
        if (req.user._id.toString() !== userId && req.user.role !== "Owner") {
            return res.status(403).json({ message: "Not authorized to view these bookings" });
        }
     const bookings = await Booking.find({ userId });

        res.status(200).json(bookings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});
router.get("/apartmentBookings/:apartmentId", verifyToken, async (req, res) => {
  try {
    const apartmentId = req.params.apartmentId;
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment)
      return res.status(404).json({ message: "Apartment not found" });
    if (apartment.OwnerId.toString() !== req.user._id && req.user.role !== "Owner") {
      return res.status(403).json({ message: "Not authorized to view these bookings" });
    }
    const bookings = await Booking.find({ apartmentId });

    res.status(200).json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});


*/

/*
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
*/

//-----------------Listings routes--------------------//

module.exports = router;