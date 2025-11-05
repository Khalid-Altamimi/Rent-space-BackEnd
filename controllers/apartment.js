const Apartment = require('../models/apartment.js');
const express = require('express');
const router = express.Router();

// basic code for apartments


// add verify for owner only (token) to create (use middleware)
// , add cloudinary, handel the booking calander
router.post('/', async (req, res) => {
    try {
        const createdApartment = await Apartment.create(req.body);
        res.status(201).json(createdApartment);
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
});

// works fine for now
router.get('/', async (req, res) => {
  
    try {
        const foundApartment = await Apartment.find();
        res.status(200).json(foundApartment);
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
});

// works fine for now
router.get('/:apartmentId', async (req, res) => {
  
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

// works fine for now
// add verify for owner only (token) to delete
router.delete('/:apartmentId', async (req, res) => {
  
    try {
        
        const foundApartment = await Apartment.findByIdAndDelete(req.params.apartmentId);
        
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

// works fine for now
// add verify for owner only (token) to update
router.put('/:apartmentId', async (req, res) => {
  try {
        const updatedApartment = await Apartment.findByIdAndUpdate(req.params.apartmentId, req.body, { new: true, runValidators: true } );
        
        if (!updatedApartment) {
            res.status(404);
            throw new Error('Apartment not found.');
        }
        
        res.status(200).json(updatedApartment);
  
    } catch (err) {

        if (res.statusCode === 404) {
            res.json({ err: err.message });
        } else {
            res.status(500).json({ err: err.message });
        }
  }
});

module.exports = router;